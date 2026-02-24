import React, { useState, useRef, useEffect } from 'react';
import { RiFullscreenLine, RiSendPlaneFill, RiAddLine, RiPhoneLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../../contexts/AIChatContext';
import { useProjects } from '../../contexts/ProjectContext';
import { Button } from '../../components/ui/Button';

interface AIChatPanelProps {
  showHeader?: boolean;
  onExpand?: () => void;
  onVoiceCall?: () => void;
  onNewChat?: () => void;
  className?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ 
  showHeader = true,
  onExpand,
  onVoiceCall,
  onNewChat,
  className = ''
}) => {
  const { currentChat, sendMessage, startNewChat, getProjectChats, switchToChat } = useAIChat();
  const { selectedProject } = useProjects();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Switch to project-specific chat when project changes
  useEffect(() => {
    if (selectedProject?.id) {
      // If current chat is not for this project, switch or create new
      if (currentChat.projectId !== String(selectedProject.id)) {
        const projectChats = getProjectChats(String(selectedProject.id));
        if (projectChats.length > 0) {
          // Switch to the most recent chat for this project
          // Assuming chats are ordered by createdAt or lastUpdatedAt descending, or just pick first
          // Actually getProjectChats returns array from chatHistory which is likely ordered by creation if we appended new ones.
          // But chatHistory in Context is initialized from localStorage.
          // Let's sort to find latest
          const latestChat = [...projectChats].sort((a, b) => 
            new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
          )[0];
          switchToChat(latestChat.id);
        } else {
          // Create new chat for this project
          startNewChat(String(selectedProject.id));
        }
      }
    }
  }, [selectedProject?.id, currentChat.projectId, getProjectChats, switchToChat, startNewChat]);
  
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const messageText = inputValue;
    setInputValue('');
    
    // Pass the current project ID to scope the chat
    await sendMessage(messageText, selectedProject?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExpandDefault = () => {
    if (onExpand) {
      onExpand();
    } else {
      navigate('/ask-ai');
    }
  };

  const handleNewChatDefault = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      startNewChat(selectedProject?.id ? String(selectedProject.id) : undefined);
      setInputValue('');
    }
  };
  
  const handleVoiceCallDefault = () => {
    if (onVoiceCall) {
      onVoiceCall();
    } else {
      navigate('/voice-call');
    }
  };
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages]);

  // Auto-scroll effect when new messages arrive and not loading
  useEffect(() => {
    if (currentChat.messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentChat.messages]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showHeader && (
        <div className="flex justify-between items-center p-3 border-b border-dark-800 bg-gradient-to-r from-dark-800 to-dark-900">
          <h3 className="font-semibold text-ai-blue">AI Assistant</h3>
          <div className="flex gap-1">
            <button 
              onClick={handleNewChatDefault} 
              className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-dark-700 text-xs"
              title="New Chat"
            >
              <RiAddLine className="w-4 h-4" />
            </button>
            <button 
              onClick={handleVoiceCallDefault} 
              className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-dark-700 text-xs"
              title="Voice Call"
            >
              <RiPhoneLine className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExpandDefault} 
              className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-dark-700 text-xs"
              title="Expand"
            >
              <RiFullscreenLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {currentChat.messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`rounded-2xl py-2 px-3 max-w-[85%] text-xs ${
                message.sender === 'user' 
                  ? 'bg-ai-blue text-white rounded-tr-none' 
                  : message.isStreaming
                    ? 'bg-dark-800 text-gray-100 rounded-tl-none border border-ai-blue/30'
                    : 'bg-dark-800 text-gray-100 rounded-tl-none'
              }`}
            >
              {message.imageUrl && (
                <div className="mb-2 rounded overflow-hidden">
                  <img 
                    src={message.imageUrl} 
                    alt="Uploaded" 
                    className="max-w-full h-auto max-h-40 object-contain bg-dark-950/50"
                  />
                </div>
              )}
              <div className="flex items-start">
                <div className="flex-1">
                  {message.content}
                  {message.isStreaming && message.content === '' && (
                    <div className="flex items-center text-ai-blue">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-ai-blue rounded-full animate-typing-dots" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-ai-purple rounded-full animate-typing-dots" style={{ animationDelay: '200ms' }} />
                        <div className="w-1 h-1 bg-ai-teal rounded-full animate-typing-dots" style={{ animationDelay: '400ms' }} />
                      </div>
                      <span className="ml-2 text-xs">Thinking...</span>
                    </div>
                  )}
                </div>
                {message.isStreaming && message.content !== '' && (
                  <div className="ml-2 flex items-center">
                    <div className="w-1 h-1 bg-gradient-to-r from-ai-blue to-ai-purple rounded-full animate-streaming-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Loading indicator - only show when last message is streaming */}
        {currentChat.messages.length > 0 && 
         currentChat.messages[currentChat.messages.length - 1]?.isStreaming && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 dark:bg-dark-700 rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-dark-800 bg-dark-850">
        <div className="flex items-center gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            className="flex-1 bg-dark-800 border border-dark-700 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-ai-blue resize-none text-xs"
            rows={1}
          />
          <Button
            type="submit"
            variant="ai"
            size="sm"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <RiSendPlaneFill className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};