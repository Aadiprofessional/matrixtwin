import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RiFullscreenLine, RiSendPlaneFill, RiAddLine, RiPhoneLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../../contexts/AIChatContext';

interface AIChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPopup: React.FC<AIChatPopupProps> = ({ isOpen, onClose }) => {
  const { currentChat, isLoading, sendMessage, startNewChat } = useAIChat();
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
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages]);

  // Auto-scroll to bottom when loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isLoading]);
  
  // Auto-scroll when popup opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

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
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-800 text-white rounded-2xl rounded-tl-none py-2 px-4">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full opacity-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full opacity-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full opacity-75"></span>
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
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className={`p-2 rounded-lg ${
                  isLoading || !inputValue.trim() 
                    ? 'bg-dark-700 text-gray-500' 
                    : 'bg-ai-blue text-white hover:bg-ai-blue-600'
                } transition-colors`}
              >
                <RiSendPlaneFill className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}; 