import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string; // Optional image URL for messages with images
  isStreaming?: boolean; // Flag to indicate if message is still streaming
}

interface ChatSession {
  id: string;
  projectId?: string; // Optional projectId to scope chats
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdatedAt: Date;
}

interface AIChatContextType {
  currentChat: ChatSession;
  chatHistory: ChatSession[];
  sendMessage: (content: string, projectId?: string | number | null, imageBase64?: string) => Promise<void>;
  clearMessages: () => void;
  startNewChat: (projectId?: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  switchToChat: (chatId: string) => void;
  getProjectChats: (projectId: string) => ChatSession[];
  isLoading: boolean;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within a AIChatProvider');
  }
  return context;
};

interface AIChatProviderProps {
  children: ReactNode;
}

const createInitialGreeting = (): Message => ({
  id: '0',
  content: "Hello! I'm your AI assistant. How can I help you with your construction projects today?",
  sender: 'ai',
  timestamp: new Date()
});

export const AIChatProvider: React.FC<AIChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [tempChatProjectId, setTempChatProjectId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentSessionRef = useRef<string>(currentChatId);

  // Keep the ref updated with the current chat ID
  useEffect(() => {
    currentSessionRef.current = currentChatId;
  }, [currentChatId]);

  // Load chat history from Supabase
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select(`
            *,
            chat_messages (*)
          `)
          .eq('user_id', user.id)
          .order('last_updated_at', { ascending: false });

        if (error) throw error;

        if (sessions && sessions.length > 0) {
          const formattedSessions: ChatSession[] = sessions.map(session => ({
            id: session.id,
            projectId: session.project_id,
            title: session.title,
            createdAt: new Date(session.created_at),
            lastUpdatedAt: new Date(session.last_updated_at),
            messages: session.chat_messages
              .map((msg: any) => ({
                id: msg.id,
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.timestamp),
                imageUrl: msg.image_url,
                isStreaming: msg.is_streaming
              }))
              .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime())
          }));
          
          setChatHistory(formattedSessions);
          if (!currentChatId && formattedSessions.length > 0) {
            setCurrentChatId(formattedSessions[0].id);
          }
        } else {
          // If no sessions exist, clear currentChatId so it falls back to temp
          setCurrentChatId('');
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [user]);

  // Get the current chat from chatHistory
  const currentChat = chatHistory.find(chat => chat.id === currentChatId) || 
    (currentChatId === 'temp' || !currentChatId ? {
      id: 'temp',
      projectId: tempChatProjectId,
      title: 'New Chat',
      messages: [createInitialGreeting()],
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    } : (chatHistory[0] || {
      id: 'temp',
      projectId: tempChatProjectId,
      title: 'New Chat',
      messages: [createInitialGreeting()],
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    }));

  // Update chat with message (used for both user and AI messages)
  const updateChatWithMessage = useCallback((message: Message, targetChatId?: string) => {
    const chatIdToUpdate = targetChatId || currentSessionRef.current;
    
    setChatHistory(prevHistory => {
      return prevHistory.map(chat => {
        if (chat.id === chatIdToUpdate) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            lastUpdatedAt: new Date()
          };
        }
        return chat;
      });
    });
  }, []);

  // Update existing message content (for streaming)
  const updateMessageContent = useCallback(async (messageId: string, newContent: string, isComplete: boolean = false) => {
    setChatHistory(prevHistory => {
      return prevHistory.map(chat => {
        if (chat.id === currentSessionRef.current) {
          return {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: newContent, isStreaming: !isComplete }
                : msg
            ),
            lastUpdatedAt: new Date()
          };
        }
        return chat;
      });
    });

    // Update Supabase when streaming is complete
    if (isComplete) {
      try {
        await supabase
          .from('chat_messages')
          .update({ 
            content: newContent,
            is_streaming: false 
          })
          .eq('id', messageId);
          
        // Also update session last_updated_at
        await supabase
          .from('chat_sessions')
          .update({ last_updated_at: new Date().toISOString() })
          .eq('id', currentSessionRef.current);
      } catch (error) {
        console.error('Error updating message in Supabase:', error);
      }
    }
  }, []);

  // Update chat title based on first user message
  const updateChatTitle = useCallback(async (chatId: string, messageText: string) => {
    const newTitle = messageText.length > 30 
      ? messageText.substring(0, 27) + '...' 
      : messageText;

    setChatHistory(prevHistory => {
      return prevHistory.map(chat => {
        if (chat.id === chatId) {
          // Only update title if this is the first user message
          // Check if there are only 2 messages (greeting + user message)
          if (chat.messages.length <= 2) {
            return {
              ...chat,
              title: newTitle
            };
          }
        }
        return chat;
      });
    });

    // Update title in Supabase if it's the first user message
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat && chat.messages.length <= 2) {
      try {
        await supabase
          .from('chat_sessions')
          .update({ title: newTitle })
          .eq('id', chatId);
      } catch (error) {
        console.error('Error updating chat title in Supabase:', error);
      }
    }
  }, [chatHistory]);

  // Send a message in the current chat
  const sendMessage = async (messageText: string, projectId: string | number | null = null, imageBase64?: string) => {
    if ((!messageText.trim() && !imageBase64)) return;
    
    let targetChatId = currentChatId;
    
    // Check if we need to create a new session (lazy creation)
    if (targetChatId === 'temp' || !targetChatId) {
      if (!user) return;
      
      const now = new Date();
      const newChatId = crypto.randomUUID();
      const effectiveProjectId = projectId ? String(projectId) : tempChatProjectId;
      
      const newChat: ChatSession = {
        id: newChatId,
        projectId: effectiveProjectId,
        title: `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        messages: [createInitialGreeting()],
        createdAt: now,
        lastUpdatedAt: now
      };
      
      // Optimistic update - add to history
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
      currentSessionRef.current = newChatId; // Update ref manually for immediate use
      targetChatId = newChatId;
      
      try {
        // Create session in Supabase
        const { error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            id: newChat.id,
            user_id: user.id,
            project_id: newChat.projectId,
            title: newChat.title,
            created_at: newChat.createdAt.toISOString(),
            last_updated_at: newChat.lastUpdatedAt.toISOString()
          });

        if (sessionError) throw sessionError;

        // Create initial greeting message in Supabase
        const greeting = newChat.messages[0];
        await supabase.from('chat_messages').insert({
          id: crypto.randomUUID(), // New ID for the greeting in DB
          session_id: newChat.id,
          content: greeting.content,
          sender: greeting.sender,
          timestamp: greeting.timestamp.toISOString()
        });

      } catch (error) {
        console.error('Error creating new chat in Supabase:', error);
        // Should we abort? For now, continue to try sending message
      }
    }
    
    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: messageText || "Analyze this image",
      sender: 'user',
      timestamp: new Date(),
      imageUrl: imageBase64 ? imageBase64 : undefined
    };
    
    // First add the user message immediately to the UI
    updateChatWithMessage(userMessage, targetChatId);
    
    // Save user message to Supabase
    try {
      await supabase.from('chat_messages').insert({
        id: userMessage.id,
        session_id: targetChatId,
        content: userMessage.content,
        sender: userMessage.sender,
        image_url: userMessage.imageUrl,
        timestamp: userMessage.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Error saving user message to Supabase:', error);
    }
    
    // Update the chat title if needed
    updateChatTitle(targetChatId, messageText || "Image analysis");
    
    // Create AI message placeholder ID
    const aiMessageId = crypto.randomUUID();
    
    try {
      // Add the current user message
      const currentContent = [];
      if (messageText) {
        currentContent.push({
          type: "text",
          text: messageText
        });
      } else if (imageBase64) {
        currentContent.push({
          type: "text",
          text: "Please analyze this image in detail."
        });
      }
      
      if (imageBase64) {
        currentContent.push({
          type: "image_url",
          image_url: {
            url: imageBase64
          }
        });
      }
      
      const userMessagePayload = {
        role: "user",
        content: currentContent
      };
      
      const messages = [userMessagePayload];

      // Create AI message placeholder
      const aiMessage: Message = {
        id: aiMessageId,
        content: "",
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true
      };
      
      // Add the placeholder AI message
      updateChatWithMessage(aiMessage, targetChatId);
      
      // Save initial AI placeholder to Supabase
      try {
        await supabase.from('chat_messages').insert({
          id: aiMessageId,
          session_id: targetChatId,
          content: "",
          sender: 'ai',
          timestamp: aiMessage.timestamp.toISOString(),
          is_streaming: true
        });
      } catch (error) {
        console.error('Error saving AI placeholder to Supabase:', error);
      }
      
      console.log('🚀 Sending request to API...');
      
      // Make the streaming request to the new webhook
      const response = await fetch('https://n8n.matrixaiserver.com/webhook/MatrixTwin/DashboardSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          user: user || { id: 'anonymous', role: 'guest', name: 'Guest' },
          stream: true,
          projectId: projectId,
          chatId: targetChatId,
          userId: user?.id
        })
      });

      console.log('📊 API Response status:', response.status);

      if (!response.ok) {
        console.error('❌ API request failed:', response.status, response.statusText);
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullContent = '';
      const decoder = new TextDecoder();

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ Stream completed');
              updateMessageContent(aiMessageId, fullContent, true);
              break;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            
            // Check if it's SSE format
            if (chunk.includes('data: ')) {
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        
                        if (data === '[DONE]') {
                            console.log('🏁 Received [DONE] signal');
                            updateMessageContent(aiMessageId, fullContent, true);
                            return;
                        }

                        try {
                            // Try to parse as JSON first
                            const parsed = JSON.parse(data);
                            // Handle various potential response formats
                            const content = parsed.choices?.[0]?.delta?.content || 
                                          parsed.response || 
                                          parsed.output || 
                                          parsed.text || 
                                          parsed.content ||
                                          '';
                            
                            if (content) {
                                fullContent += content;
                                updateMessageContent(aiMessageId, fullContent, false);
                            } else if (typeof parsed === 'string') {
                                fullContent += parsed;
                                updateMessageContent(aiMessageId, fullContent, false);
                            }
                        } catch (e) {
                            // If not JSON, treat as raw text
                            fullContent += data;
                            updateMessageContent(aiMessageId, fullContent, false);
                        }
                    }
                }
            } else {
                // Not SSE, treat as raw text stream or plain JSON response
                try {
                    // Check if the whole chunk is a valid JSON object (might be a non-streaming response)
                    const parsed = JSON.parse(chunk);
                    const content = parsed.response || parsed.output || parsed.text || parsed.content;
                    if (content) {
                        fullContent += content;
                    } else {
                        fullContent += chunk;
                    }
                } catch {
                    // Not JSON, just append raw text
                    fullContent += chunk;
                }
                updateMessageContent(aiMessageId, fullContent, false);
            }
          }
        } catch (streamError) {
          console.error('❌ Error processing stream:', streamError);
          updateMessageContent(aiMessageId, fullContent || "I'm sorry, there was an error processing your request. Please try again.", true);
        }
      };

      await processStream();
      
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      
      // Update the AI message with error content
      updateMessageContent(aiMessageId, "I'm sorry, there was an error processing your request. Please try again later.", true);
    }
  };

  const clearMessages = async () => {
    // For now, we'll just create a new chat instead of clearing messages in the current one
    // This preserves history while giving a fresh start
    startNewChat(currentChat.projectId);
  };
  
  const startNewChat = (projectId?: string) => {
    setTempChatProjectId(projectId);
    setCurrentChatId('temp');
  };
  
  const deleteChat = async (chatId: string) => {
    if (!user) return;

    // Optimistic update
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updatedHistory);
    
    // If we deleted the current chat, switch to another one
    if (currentChatId === chatId) {
      // Find another chat for the same project if possible
      const currentProjectChat = chatHistory.find(c => c.id === chatId);
      const projectId = currentProjectChat?.projectId;
      
      const nextChat = updatedHistory.find(c => c.projectId === projectId) || updatedHistory[0];
      
      if (nextChat) {
        setCurrentChatId(nextChat.id);
      } else {
        // No chats left, start a new one
        startNewChat(projectId);
      }
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting chat:', error);
      // We could reload history here if deletion failed, but for now we'll just log it
    }
  };

  const switchToChat = (chatId: string) => {
    if (chatHistory.some(chat => chat.id === chatId)) {
      setCurrentChatId(chatId);
    } else if (chatId === 'temp') {
      setCurrentChatId('temp');
    }
  };

  const getProjectChats = (projectId: string) => {
    return chatHistory.filter(chat => chat.projectId === projectId);
  };

  return (
    <AIChatContext.Provider value={{ 
      currentChat, 
      chatHistory, 
      sendMessage, 
      clearMessages, 
      startNewChat, 
      deleteChat,
      switchToChat,
      getProjectChats,
      isLoading
    }}>
      {children}
    </AIChatContext.Provider>
  );
};