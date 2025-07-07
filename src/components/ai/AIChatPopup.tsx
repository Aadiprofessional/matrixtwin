import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RiFullscreenLine, RiSendPlaneFill, RiAddLine, RiPhoneLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../../contexts/AIChatContext';
import { Button } from '../../components/ui/Button';

interface AIChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPopup: React.FC<AIChatPopupProps> = ({ isOpen, onClose }) => {
  const { currentChat, sendMessage, startNewChat } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const messageText = inputValue;
    setInputValue('');
    
    await sendMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExpand = () => {
    navigate('/ask-ai');
  };

  const handleNewChat = () => {
    startNewChat();
    setInputValue('');
  };
  
  const handleVoiceCall = () => {
    navigate('/voice-call');
  };
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages]);

  // Close popup when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Auto-scroll effect when new messages arrive and not loading
  useEffect(() => {
    if (currentChat.messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentChat.messages]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-28 right-6 h-96 bg-dark-900 rounded-2xl shadow-2xl w-80 shadow-ai-blue/10 border border-dark-700 overflow-hidden z-50 flex flex-col fade-in-up"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-dark-800 bg-gradient-to-r from-dark-800 to-dark-900">
            <h3 className="font-semibold text-ai-blue">AI Assistant</h3>
            <div className="flex gap-1">
              <button 
                onClick={handleNewChat} 
                className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-dark-700 text-xs"
                title="New Chat"
              >
                <RiAddLine className="w-4 h-4" />
              </button>
              <button 
                onClick={handleVoiceCall} 
                className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-dark-700 text-xs"
                title="Voice Call"
              >
                <RiPhoneLine className="w-4 h-4" />
              </button>
              <button 
                onClick={handleExpand} 
                className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-dark-700 text-xs"
                title="Expand"
              >
                <RiFullscreenLine className="w-4 h-4" />
              </button>
            </div>
          </div>
          
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
                disabled={!inputValue.trim()}
              >
                <RiSendPlaneFill className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}; 