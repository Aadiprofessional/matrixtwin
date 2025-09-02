import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from 'react';

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
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdatedAt: Date;
}

interface AIChatContextType {
  currentChat: ChatSession;
  chatHistory: ChatSession[];
  sendMessage: (content: string, projectId?: number | null, imageBase64?: string) => Promise<void>;
  clearMessages: () => void;
  startNewChat: () => void;
  switchToChat: (chatId: string) => void;
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

const createNewChatSession = (): ChatSession => {
  const now = new Date();
  return {
    id: `chat-${Date.now()}`,
    title: `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    messages: [createInitialGreeting()],
    createdAt: now,
    lastUpdatedAt: now
  };
};

// Load chat history from local storage
const loadChatHistory = (): ChatSession[] => {
  try {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      // Convert string dates back to Date objects
      return parsed.map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        lastUpdatedAt: new Date(chat.lastUpdatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [createNewChatSession()];
};

export const AIChatProvider: React.FC<AIChatProviderProps> = ({ children }) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(loadChatHistory);
  const [currentChatId, setCurrentChatId] = useState<string>(chatHistory[0].id);
  const currentSessionRef = useRef<string>(currentChatId);

  // Keep the ref updated with the current chat ID
  useEffect(() => {
    currentSessionRef.current = currentChatId;
  }, [currentChatId]);
  
  // Save chat history to local storage when it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Get the current chat from chatHistory
  const currentChat = chatHistory.find(chat => chat.id === currentChatId) || chatHistory[0];

  // Update chat with message (used for both user and AI messages)
  const updateChatWithMessage = useCallback((message: Message) => {
    setChatHistory(prevHistory => {
      return prevHistory.map(chat => {
        if (chat.id === currentSessionRef.current) {
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
  const updateMessageContent = useCallback((messageId: string, newContent: string, isComplete: boolean = false) => {
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
  }, []);

  // Update chat title based on first user message
  const updateChatTitle = useCallback((chatId: string, messageText: string) => {
    setChatHistory(prevHistory => {
      return prevHistory.map(chat => {
        if (chat.id === chatId) {
          // Only update title if this is the first user message
          if (chat.messages.length === 1 && chat.messages[0].sender === 'ai') {
            return {
              ...chat,
              title: messageText.length > 30 
                ? messageText.substring(0, 27) + '...' 
                : messageText
            };
          }
        }
        return chat;
      });
    });
  }, []);

  // Send a message in the current chat
  const sendMessage = async (messageText: string, projectId: number | null = null, imageBase64?: string) => {
    if ((!messageText.trim() && !imageBase64)) return;
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText || "Analyze this image",
      sender: 'user',
      timestamp: new Date(),
      imageUrl: imageBase64 ? imageBase64 : undefined
    };
    
    // First add the user message immediately to the UI
    updateChatWithMessage(userMessage);
    
    // Update the chat title if needed
    updateChatTitle(currentChatId, messageText || "Image analysis");
    
    // Create AI message placeholder ID
    const aiMessageId = (Date.now() + 1).toString();
    
    try {
      // Get current chat messages from state
      const currentChatData = chatHistory.find(chat => chat.id === currentChatId);
      const currentMessages = currentChatData ? currentChatData.messages : [];
      
      // Prepare messages for the API
      const messages = [];
      
      // Add context from previous messages (last 5 messages for context)
      const recentMessages = currentMessages.slice(-5);
      for (const msg of recentMessages) {
        if (msg.sender === 'user') {
          const content = [];
          content.push({
            type: "text",
            text: msg.content
          });
          
          if (msg.imageUrl) {
            content.push({
              type: "image_url",
              image_url: {
                url: msg.imageUrl
              }
            });
          }
          
          messages.push({
            role: "user",
            content: content
          });
        } else if (msg.sender === 'ai') {
          messages.push({
            role: "assistant",
            content: msg.content
          });
        }
      }
      
      // Add the current user message
      const currentContent = [];
      currentContent.push({
        type: "text",
        text: messageText || "Please analyze this image in detail."
      });
      
      if (imageBase64) {
        currentContent.push({
          type: "image_url",
          image_url: {
            url: imageBase64
          }
        });
      }
      
      messages.push({
        role: "user",
        content: currentContent
      });

      // Create AI message placeholder
      const aiMessage: Message = {
        id: aiMessageId,
        content: "",
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true
      };
      
      // Add the placeholder AI message
      updateChatWithMessage(aiMessage);
      
      console.log('🚀 Sending request to API...');
      
      // Make the streaming request to the Dashscope API
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-9f7b91a0bb81406b9da7ff884ddd2592',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: messages,
          stream: true
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
                  const parsed = JSON.parse(data);
                  console.log('📦 Parsed chunk:', parsed);
                  
                  // Handle the response format from Dashscope API
                  if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                    const delta = parsed.choices[0].delta;
                    if (delta.content) {
                      fullContent += delta.content;
                      // Update the message content in real-time
                      updateMessageContent(aiMessageId, fullContent, false);
                    }
                  }
                } catch (parseError) {
                  console.error('❌ Error parsing streaming data:', parseError);
                  console.log('Raw data:', data);
                }
              }
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

  const clearMessages = () => {
    const updatedHistory = chatHistory.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages: [createInitialGreeting()],
          lastUpdatedAt: new Date()
        };
      }
      return chat;
    });
    
    setChatHistory(updatedHistory);
  };
  
  const startNewChat = () => {
    const newChat = createNewChatSession();
    setChatHistory([newChat, ...chatHistory]);
    setCurrentChatId(newChat.id);
  };
  
  const switchToChat = (chatId: string) => {
    if (chatHistory.some(chat => chat.id === chatId)) {
      setCurrentChatId(chatId);
    }
  };

  return (
    <AIChatContext.Provider 
      value={{
        currentChat,
        chatHistory,
        sendMessage,
        clearMessages,
        startNewChat,
        switchToChat
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};