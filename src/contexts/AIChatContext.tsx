import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string; // Optional image URL for messages with images
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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
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
    if ((!messageText.trim() && !imageBase64) || isLoading) return;
    
    // Start loading state before sending
    setIsLoading(true);
    
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
    
    try {
      // Define API URL based on environment
      const API_URL = 'https://matrixbim-server.onrender.com/api/dashscope';
      
      let aiResponseText = '';
      let reasoningText = '';
      
      if (imageBase64) {
        // For image analysis, use the image-analysis endpoint and QVQ model
        const apiEndpoint = `${API_URL}/image-analysis`;
        
        const requestData = {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { 
                    url: imageBase64.startsWith('data:') 
                      ? imageBase64 
                      : `data:image/jpeg;base64,${imageBase64}` 
                  }
                },
                {
                  type: "text",
                  text: messageText || "Please analyze this image in detail for my construction project."
                }
              ]
            }
          ],
          stream: true
        };
        
        // Create a new EventSource using POST method with a polyfill approach
        const controller = new AbortController();
        
        // First, make a POST request to start the server-sent events stream
        return new Promise<void>((resolve, reject) => {
          fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Server responded with ${response.status}`);
            }
            
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            function processChunk({ done, value }: ReadableStreamReadResult<Uint8Array>) {
              if (done) {
                // Create AI response message if we have content
                if (aiResponseText) {
                  const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: aiResponseText,
                    sender: 'ai',
                    timestamp: new Date()
                  };
                  
                  // Add AI response
                  updateChatWithMessage(aiMessage);
                  
                  // Save reasoning in global state or session storage for later reference
                  if (reasoningText) {
                    // Store the reasoning for the UI to access
                    window.sessionStorage.setItem(`reasoning-${aiMessage.id}`, reasoningText);
                  }
                }
                
                setIsLoading(false);
                resolve();
                return;
              }
              
              // Decode the incoming chunk and add it to our buffer
              buffer += decoder.decode(value, { stream: true });
              
              // Process complete SSE messages
              const lines = buffer.split('\n\n');
              buffer = lines.pop() || ''; // Keep the last incomplete chunk in the buffer
              
              // Process each complete SSE message
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    
                    // Handle reasoning content
                    if (data.reasoning) {
                      reasoningText += data.reasoning;
                    }
                    
                    // Handle actual response content
                    if (data.content) {
                      aiResponseText += data.content;
                    }
                    
                    // Handle stream end
                    if (data.done) {
                      // Create AI response message
                      const aiMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        content: aiResponseText || "I've analyzed the image but couldn't generate a detailed response.",
                        sender: 'ai',
                        timestamp: new Date()
                      };
                      
                      // Add AI response
                      updateChatWithMessage(aiMessage);
                      
                      // Save reasoning in global state or session storage for later reference
                      if (reasoningText) {
                        // Store the reasoning for the UI to access
                        window.sessionStorage.setItem(`reasoning-${aiMessage.id}`, reasoningText);
                      }
                      
                      // Clean up and resolve
                      controller.abort();
                      setIsLoading(false);
                      resolve();
                      return;
                    }
                  } catch (error) {
                    console.error('Error parsing QVQ stream:', error);
                  }
                }
              }
              
              // Continue reading chunks
              reader.read().then(processChunk).catch(error => {
                console.error('Error reading stream:', error);
                reject(error);
              });
            }
            
            // Start reading the stream
            reader.read().then(processChunk).catch(reject);
          })
          .catch(error => {
            console.error('Error sending image analysis request:', error);
            // Add error message if we don't have any content yet
            if (!aiResponseText) {
              const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "I'm sorry, there was an error processing the image. Please try again.",
                sender: 'ai',
                timestamp: new Date()
              };
              updateChatWithMessage(errorMessage);
            }
            
            setIsLoading(false);
            reject(error);
          });
        });
      } else {
        // For regular text message, use the voice-call endpoint
        // Create combined prompt with project context
        const combinedPrompt = `
          CONTEXT: ${projectId ? `Project ID: ${projectId}` : 'No specific project selected.'}
          
          USER QUERY: ${messageText}
          
          Please provide a helpful, concise, and informative response in English based on the construction project data. You are Matrix AI construction assistant.
        `;
        
        const requestData = {
          prompt: combinedPrompt,
          stream: false
        };
        
        // Make API call to get AI response
        const response = await axios.post(
          `${API_URL}/voice-call`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Extract text from the response based on DashScope API format
        if (response.data && response.data.output && response.data.output.text) {
          aiResponseText = response.data.output.text;
        }
        
        // Format and add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponseText || "I'm sorry, I couldn't process that request. Please try again.",
          sender: 'ai',
          timestamp: new Date()
        };
        
        // Add AI response
        updateChatWithMessage(aiMessage);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, there was an error processing your request. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      // Add error message
      updateChatWithMessage(errorMessage);
    } finally {
      setIsLoading(false);
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
        isLoading,
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