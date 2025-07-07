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
      // Prepare the message content for the API
      let promptText = messageText || "Please analyze this image in detail for my construction project.";
      
      // If there's an image, include it in the prompt
      if (imageBase64) {
        promptText = `${promptText}\n\nImage: ${imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`}`;
      }

      // Prepare the request data for the new Dashscope API with streaming
      const requestData = {
        input: {
          prompt: promptText
        },
        parameters: {
          incremental_output: true
        },
        debug: {}
      };

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
      
      // Make the streaming request to the new Dashscope API
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/33b3f866ff054f2eb98d17c174239fc8/completion', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-6b53808e778c4e11a9928d6416ae7e3e',
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Mark the message as complete
              updateMessageContent(aiMessageId, accumulatedContent, true);
              break;
            }

            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  updateMessageContent(aiMessageId, accumulatedContent, true);
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  // Handle the response format from your API - accumulate content properly
                  if (parsed.output && parsed.output.text) {
                    // If it's incremental, append the new content
                    if (parsed.output.text.startsWith(accumulatedContent)) {
                      accumulatedContent = parsed.output.text;
                    } else {
                      // If it's a new chunk, append it
                      accumulatedContent += parsed.output.text;
                    }
                    // Update the message content in real-time
                    updateMessageContent(aiMessageId, accumulatedContent, false);
                  }
                } catch (parseError) {
                  console.error('Error parsing streaming data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Error processing stream:', streamError);
          updateMessageContent(aiMessageId, accumulatedContent || "I'm sorry, there was an error processing your request. Please try again.", true);
        }
      };

      await processStream();
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
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