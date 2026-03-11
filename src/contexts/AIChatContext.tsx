import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { pdfjs } from 'react-pdf';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
  attachments?: ChatAttachment[];
  messageType?: OutboundMessageType;
  isStreaming?: boolean;
}

export type OutboundMessageType = 'text' | 'search' | 'image' | 'document' | 'pdf_vision';

export interface ChatAttachment {
  url: string;
  fileName: string;
  fileType: 'image' | 'document';
  originalName: string;
  size: number;
}

export interface SendMessageOptions {
  mode?: 'text' | 'search';
  file?: File | null;
  uploadMode?: 'image' | 'document' | 'pdf_vision';
  imageBase64?: string;
}

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  sendMessage: (content: string, projectId?: string | number | null, options?: SendMessageOptions | string) => Promise<void>;
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
                attachments: undefined,
                messageType: 'text',
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
  const uploadAttachment = async (file: File, userId?: string): Promise<ChatAttachment> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${crypto.randomUUID()}_${safeName}`;
    const ownerId = userId || 'anonymous';
    const filePath = `users/${ownerId}/chat/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      fileName,
      fileType: file.type.startsWith('image/') ? 'image' : 'document',
      originalName: file.name,
      size: file.size
    };
  };

  const uploadPdfVisionData = async (file: File, userId?: string): Promise<{ attachment: ChatAttachment; imageUrls: string[]; pageCount: number }> => {
    const ownerId = userId || 'anonymous';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const baseId = crypto.randomUUID();
    const pdfFileName = `${baseId}_${safeName}`;
    const pdfPath = `users/${ownerId}/chat/${pdfFileName}`;

    const { error: pdfUploadError } = await supabase.storage
      .from('user-uploads')
      .upload(pdfPath, file);

    if (pdfUploadError) {
      throw new Error(pdfUploadError.message);
    }

    const { data: pdfData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(pdfPath);

    const imageUrls: string[] = [];
    const fileArrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument(fileArrayBuffer);
    const pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (!context) {
        continue;
      }
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const pageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!pageBlob) {
        continue;
      }
      const imageFileName = `${baseId}_page_${i}.png`;
      const imagePath = `users/${ownerId}/chat/${imageFileName}`;
      const { error: imageUploadError } = await supabase.storage
        .from('user-uploads')
        .upload(imagePath, pageBlob);
      if (imageUploadError) {
        continue;
      }
      const { data: imageData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(imagePath);
      imageUrls.push(imageData.publicUrl);
    }

    return {
      attachment: {
        url: pdfData.publicUrl,
        fileName: pdfFileName,
        fileType: 'document',
        originalName: file.name,
        size: file.size
      },
      imageUrls,
      pageCount: pdf.numPages
    };
  };

  const sendMessage = async (messageText: string, projectId: string | number | null = null, options?: SendMessageOptions | string) => {
    const normalizedOptions: SendMessageOptions = typeof options === 'string'
      ? { imageBase64: options }
      : (options || {});
    const imageBase64 = normalizedOptions.imageBase64;
    const attachedFile = normalizedOptions.file || null;
    const uploadMode = normalizedOptions.uploadMode;
    if (!messageText.trim() && !imageBase64 && !attachedFile) return;
    
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
    
    let uploadedAttachment: ChatAttachment | undefined;
    let pdfVisionData: { imageUrls: string[]; pageCount: number } | undefined;
    if (attachedFile) {
      try {
        if (uploadMode === 'pdf_vision') {
          const visionResult = await uploadPdfVisionData(attachedFile, user?.id);
          uploadedAttachment = visionResult.attachment;
          pdfVisionData = {
            imageUrls: visionResult.imageUrls,
            pageCount: visionResult.pageCount
          };
        } else {
          uploadedAttachment = await uploadAttachment(attachedFile, user?.id);
        }
      } catch (error) {
        console.error('Error uploading attachment:', error);
        return;
      }
    }

    const resolvedMessageType: OutboundMessageType = uploadMode === 'pdf_vision'
      ? 'pdf_vision'
      : uploadedAttachment
      ? (uploadedAttachment.fileType === 'image' ? 'image' : 'document')
      : imageBase64
        ? 'image'
        : normalizedOptions.mode === 'search'
          ? 'search'
          : 'text';

    const normalizedContent = messageText.trim()
      ? messageText
      : uploadedAttachment
        ? `Attached file: ${uploadedAttachment.originalName}`
        : 'Analyze this image';

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: normalizedContent,
      sender: 'user',
      timestamp: new Date(),
      imageUrl: uploadedAttachment?.fileType === 'image' ? uploadedAttachment.url : imageBase64 || undefined,
      attachments: uploadedAttachment ? [uploadedAttachment] : undefined,
      messageType: resolvedMessageType
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
    updateChatTitle(targetChatId, normalizedContent);
    
    // Create AI message placeholder ID
    const aiMessageId = crypto.randomUUID();
    
    try {
      const payloadText = messageText.trim()
        ? messageText
        : uploadedAttachment
          ? `Please analyze this ${uploadedAttachment.fileType}.`
          : 'Please analyze this image in detail.';

      const resolvedProjectId = projectId ? String(projectId) : (currentChat.projectId || tempChatProjectId || null);

      const outboundMessage: any = {
        uid: user?.id || 'anonymous',
        type: resolvedMessageType,
        text: { body: payloadText },
        body: payloadText,
        content: payloadText,
        role: 'user',
        roleDescription: user?.role || 'user',
        timestamp: new Date().toLocaleString(),
        chatid: targetChatId,
        projectId: resolvedProjectId
      };

      if (uploadedAttachment) {
        outboundMessage.url = uploadedAttachment.url;
        outboundMessage.attachments = [uploadedAttachment];
        if (resolvedMessageType === 'pdf_vision') {
          outboundMessage.image_urls = pdfVisionData?.imageUrls || [];
          outboundMessage.page_count = pdfVisionData?.pageCount || 0;
        }
      } else if (imageBase64) {
        outboundMessage.url = imageBase64;
      }

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
      const response = await fetch('https://n8n.matrixaiserver.com/webhook/MatrixTwin/aisearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'openrequest',
          stream: true,
          chatid: targetChatId,
          projectId: resolvedProjectId,
          messages: [outboundMessage]
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

      let buffer = '';
      
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ Stream completed');
              // Process any remaining buffer as text
              if (buffer.trim()) {
                fullContent += buffer;
              }
              updateMessageContent(aiMessageId, fullContent, true);
              break;
            }

            // Decode the chunk and append to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process the buffer line by line to handle SSE and NDJSON correctly
            const lines = buffer.split('\n');
            
            // Keep the last line in the buffer as it might be incomplete
            // unless the buffer ends with a newline, in which case the last element is empty
            // and we have processed all complete lines.
            // But split('a\n') -> ['a', '']
            // split('a') -> ['a']
            // So if the last element is empty, it means the buffer ended with \n
            
            // If the buffer doesn't end with \n, the last line is incomplete.
            // If it does, the last line is empty string (which we can skip or keep as buffer base).
            
            // Actually, we should just pop the last element always and set it as new buffer.
             // If buffer ended with \n, the last element is empty string, which is fine as new buffer.
             // If buffer didn't end with \n, the last element is partial line, which is correct.
             buffer = lines.pop() || '';
             
             for (const line of lines) {
               const trimmedLine = line.trim();
               if (!trimmedLine) continue; // Skip empty lines/heartbeats
               
               // normalize line ending (remove \r if present)
               let contentToProcess = line.replace(/\r$/, '');
               
               // Remove "data: " prefix if present
              if (line.startsWith('data: ')) {
                contentToProcess = line.slice(6);
              } else if (line.startsWith('data:')) {
                contentToProcess = line.slice(5);
              }
              
              // Try to parse as JSON
              try {
                // First try parsing the line as is
                const parsed = JSON.parse(contentToProcess);
                
                // Handle n8n specific format
                if (parsed.type === 'item' && parsed.content) {
                  fullContent += parsed.content;
                } else if (parsed.type === 'begin' || parsed.type === 'end') {
                  // Ignore begin/end messages
                } else if (parsed.response || parsed.output || parsed.text || parsed.content) {
                  // Handle other common JSON formats
                  fullContent += (parsed.response || parsed.output || parsed.text || parsed.content);
                } else {
                  // Fallback for unknown JSON structure or OpenAI format
                  if (parsed.choices?.[0]?.delta?.content) {
                    fullContent += parsed.choices[0].delta.content;
                  }
                }
              } catch (e) {
                // Not valid JSON, treat as raw text
                // But be careful not to append "data: " or junk
                // If we stripped "data:", append the rest
                // If it was just "data: [DONE]", contentToProcess is "[DONE]"
                if (contentToProcess.trim() !== '[DONE]') {
                   fullContent += contentToProcess;
                }
              }
            }
            
            // Update UI with latest content
            updateMessageContent(aiMessageId, fullContent, false);
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
