import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiRobot2Line, 
  RiSendPlaneLine, 
  RiLightbulbLine, 
  RiSearchLine, 
  RiCloseCircleLine,
  RiLoader4Line,
  RiBrainLine,
  RiVolumeUpLine,
  RiAddLine,
  RiHistoryLine,
  RiImageAddLine,
  RiImageLine,
  RiCloseLine,
  RiPhoneLine,
  RiUserLine
} from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { Link, useNavigate } from 'react-router-dom';

import { useProjects } from '../contexts/ProjectContext';
import { useAIChat } from '../contexts/AIChatContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const AskAIPage: React.FC = () => {
  const { t } = useTranslation();
  const { projects, selectedProject } = useProjects();
  const { 
    currentChat, 
    chatHistory, 
    isLoading: isLoadingResponse, 
    sendMessage,
    startNewChat,
    switchToChat
  } = useAIChat();
  
  const [input, setInput] = useState('');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeReasoningId, setActiveReasoningId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollToBottom();
  }, [currentChat.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText: string = input) => {
    if ((!messageText.trim() && !uploadedImage) || isLoadingResponse) return;
    setInput('');
    setUploadError(null);
    
    try {
      if (uploadedImage) {
        // Store the image for sending but clear the UI display first
        const tempImage = uploadedImage;
        
        // Clear the image from UI immediately after initiating the send
        setUploadedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Set loading and send the message with the stored image
        setIsImageAnalyzing(true);
        await sendMessage(messageText, null, tempImage);
        setIsImageAnalyzing(false);
      } else {
        await sendMessage(messageText, null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsImageAnalyzing(false);
      setUploadError('Failed to analyze image. Please try again or try with a different image.');
    }
  };

  const handleNewChat = () => {
    startNewChat();
    setInput('');
    setShowChatHistory(false);
  };
  
  const toggleChatHistory = () => {
    setShowChatHistory(!showChatHistory);
  };
  
  const handleChatSelect = (chatId: string) => {
    switchToChat(chatId);
    setShowChatHistory(false);
  };

  const handleSwitchToVoice = () => {
    navigate('/voice-call');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadError(null);
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size should be less than 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };
  
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const toggleReasoning = (messageId: string) => {
    setActiveReasoningId(activeReasoningId === messageId ? null : messageId);
  };

  const formatMessage = (content: string) => {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const textWithLinks = content.replace(urlRegex, url => `<a href="${url}" target="_blank" class="text-ai-blue underline hover:text-ai-purple transition-colors">${url}</a>`);
    
    // Convert markdown-style bullet points
    const bulletRegex = /^\s*[-*•]\s(.+)$/gm;
    const textWithBullets = textWithLinks.replace(bulletRegex, '<li>$1</li>');
    
    // If there are bullet points, wrap them in a list
    const hasListItems = textWithBullets.includes('<li>');
    let formattedText = textWithBullets;
    
    if (hasListItems) {
      formattedText = textWithBullets.replace(/(<li>.+<\/li>)+/g, match => 
        `<ul class="list-disc pl-5 my-3 space-y-1 text-secondary-800 dark:text-secondary-200">${match}</ul>`
      );
    }
    
    // Format headings (markdown-style)
    const headingRegex = /^###\s+(.+)$/gm;
    formattedText = formattedText.replace(headingRegex, '<h3 class="text-lg font-medium text-ai-blue my-2">$1</h3>');
    
    // Format subheadings
    const subheadingRegex = /^##\s+(.+)$/gm;
    formattedText = formattedText.replace(subheadingRegex, '<h2 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-purple my-3">$1</h2>');
    
    // Format bold text
    const boldRegex = /\*\*(.+?)\*\*/g;
    formattedText = formattedText.replace(boldRegex, '<strong class="font-semibold text-ai-blue">$1</strong>');
    
    // Format italic text
    const italicRegex = /\*(.+?)\*/g;
    formattedText = formattedText.replace(italicRegex, '<em class="text-secondary-600 dark:text-secondary-300">$1</em>');
    
    // Format paragraphs with staggered animation
    return formattedText.split('\n\n').map((paragraph, i) => (
      <motion.p 
        key={i} 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3, delay: i * 0.1 }}
        className="mb-3 last:mb-0" 
        dangerouslySetInnerHTML={{ __html: paragraph }} 
      />
    ));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] relative">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-ai-dots opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-radial from-ai-blue/5 to-transparent pointer-events-none"></div>
      
      {/* Circuit pattern backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,30 L90,30" stroke="url(#grad1)" strokeWidth="0.5" />
            <path d="M10,50 L90,50" stroke="url(#grad1)" strokeWidth="0.5" />
            <path d="M10,70 L90,70" stroke="url(#grad1)" strokeWidth="0.5" />
            <path d="M30,10 L30,90" stroke="url(#grad1)" strokeWidth="0.5" />
            <path d="M50,10 L50,90" stroke="url(#grad1)" strokeWidth="0.5" />
            <path d="M70,10 L70,90" stroke="url(#grad1)" strokeWidth="0.5" />
            
            <circle cx="30" cy="30" r="2" fill="url(#grad1)" />
            <circle cx="50" cy="30" r="2" fill="url(#grad1)" />
            <circle cx="70" cy="30" r="2" fill="url(#grad1)" />
            <circle cx="30" cy="50" r="2" fill="url(#grad1)" />
            <circle cx="50" cy="50" r="3" fill="url(#grad1)">
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="70" cy="50" r="2" fill="url(#grad1)" />
            <circle cx="30" cy="70" r="2" fill="url(#grad1)" />
            <circle cx="50" cy="70" r="2" fill="url(#grad1)" />
            <circle cx="70" cy="70" r="2" fill="url(#grad1)" />
            
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e90ff" />
                <stop offset="100%" stopColor="#9d00ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="absolute bottom-0 left-0 w-72 h-72 opacity-10">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20,20 C40,20 60,40 60,60 C60,80 40,80 20,60 C0,40 0,20 20,20 Z" stroke="url(#grad2)" strokeWidth="0.5" fill="none" />
            <path d="M80,80 C60,80 40,60 40,40 C40,20 60,20 80,40 C100,60 100,80 80,80 Z" stroke="url(#grad2)" strokeWidth="0.5" fill="none" />
            <path d="M20,20 L80,80" stroke="url(#grad2)" strokeWidth="0.5" />
            <path d="M20,80 L80,20" stroke="url(#grad2)" strokeWidth="0.5" />
            
            <circle cx="20" cy="20" r="2" fill="url(#grad2)" />
            <circle cx="80" cy="80" r="2" fill="url(#grad2)" />
            <circle cx="20" cy="80" r="2" fill="url(#grad2)" />
            <circle cx="80" cy="20" r="2" fill="url(#grad2)" />
            <circle cx="50" cy="50" r="3" fill="url(#grad2)">
              <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
            </circle>
            
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e2e2" />
                <stop offset="100%" stopColor="#9d00ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-[20%] w-72 h-72 bg-ai-blue/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-[20%] w-80 h-80 bg-ai-purple/5 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-[30%] right-[10%] w-64 h-64 bg-ai-teal/5 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000"></div>
      </div>
      
      {/* Fixed Layout with 3 sections: Header, Scrollable Chat, Footer */}
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 relative z-10 flex-shrink-0">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-ai-blue to-ai-purple flex items-center justify-center shadow-ai-glow mr-4">
              <IconContext.Provider value={{ className: "text-white text-xl" }}>
                <RiBrainLine />
              </IconContext.Provider>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-ai-blue via-ai-purple to-ai-teal">
                <span className="">Matrix AI </span>
              </h1>
              <div className="text-secondary-600 dark:text-secondary-400 mt-1 flex items-center flex-wrap gap-4">
                <span>{t('askAI.subtitle', 'Ask anything about your projects')}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-4 self-end sm:self-auto">
            <Button
              onClick={handleNewChat}
              variant="ai"
              className="rounded-lg px-4 py-2 text-white bg-ai-blue hover:bg-ai-blue-600 transition-colors flex items-center"
            >
              <RiAddLine className="mr-2" />
              New Chat
            </Button>
            
            <Button
              onClick={toggleChatHistory}
              variant="outline"
              className="rounded-lg px-4 py-2 border border-dark-700 text-gray-300 hover:bg-dark-800 transition-colors flex items-center"
            >
              <RiHistoryLine className="mr-2" />
              History
            </Button>
            
            <Button
              onClick={handleSwitchToVoice}
              variant="outline"
              className="rounded-full w-10 h-10 flex items-center justify-center border border-dark-700 text-gray-300 hover:bg-dark-800 hover:border-ai-blue hover:text-ai-blue transition-colors"
              title={t('askAI.switchToVoice', 'Switch to Voice Call')}
            >
              <RiPhoneLine className="text-lg" />
            </Button>
          </div>
        </div>
        
        {/* Chat History Drawer - Floating below buttons */}
        <AnimatePresence>
          {showChatHistory && (
            <div className="absolute top-24 right-0 z-50 w-80 max-h-[400px] mr-4">
              <Card variant="ai" className="p-4 h-full overflow-auto backdrop-blur-md bg-secondary-50/10 dark:bg-dark-900/90 border border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-display font-semibold flex items-center">
                    <IconContext.Provider value={{ className: "mr-2 text-ai-blue" }}>
                      <RiHistoryLine />
                    </IconContext.Provider>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-purple">
                      Chat History
                    </span>
                  </h3>
                  <button 
                    onClick={toggleChatHistory}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-dark-800"
                  >
                    <RiCloseCircleLine />
                  </button>
                </div>
                
                <div className="space-y-2 mt-2 max-h-[320px] overflow-y-auto pr-1">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        currentChat.id === chat.id
                          ? 'bg-ai-blue/20 border-l-2 border-ai-blue'
                          : 'hover:bg-dark-800/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-dark-800 flex items-center justify-center mr-3">
                          <IconContext.Provider value={{ className: currentChat.id === chat.id ? "text-ai-blue" : "text-gray-400" }}>
                            <RiRobot2Line />
                          </IconContext.Provider>
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">{chat.title}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(chat.lastUpdatedAt).toLocaleDateString()} {new Date(chat.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </AnimatePresence>
        
        {/* Main Chat Area - Middle section with scrollable content */}
        <div className="flex-grow overflow-hidden flex flex-col">
          <Card variant="ai" className="flex flex-col flex-grow overflow-hidden backdrop-blur-md bg-secondary-50/10 dark:bg-dark-900/50 border border-white/10 shadow-lg">
            {/* Only this area should scroll */}
            <div className="flex-grow overflow-y-auto p-5 ai-scrollbar">
              <div className="space-y-8">
                {currentChat.messages.map((message) => {
                  // Get reasoning for this specific message if it exists
                  const messageReasoning = window.sessionStorage.getItem(`reasoning-${message.id}`);
                  const isReasoningActive = activeReasoningId === message.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center mx-3 ${
                          message.sender === 'user' 
                            ? 'bg-primary-500/10 text-primary-500 border border-primary-500/30' 
                            : 'bg-gradient-to-r from-ai-blue to-ai-purple text-white'
                        }`}>
                          <IconContext.Provider value={{ className: "text-lg" }}>
                            {message.sender === 'user' ? <RiUserLine /> : <RiRobot2Line />}
                          </IconContext.Provider>
                        </div>
                        
                        <div className={`rounded-2xl px-5 py-4 ${
                          message.sender === 'user'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            : 'bg-secondary-50/30 dark:bg-dark-800/80 backdrop-blur-md border border-white/10 shadow-lg'
                        }`}>
                          <div className="mb-1 text-xs opacity-70 flex items-center">
                            <IconContext.Provider value={{ className: "mr-1" }}>
                              <RiLightbulbLine />
                            </IconContext.Provider>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          
                          {/* Display uploaded image in user message */}
                          {message.imageUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden">
                              <img 
                                src={message.imageUrl} 
                                alt="Uploaded" 
                                className="max-w-full h-auto max-h-60 object-contain bg-dark-950/50"
                              />
                            </div>
                          )}
                          
                          <div className={`prose prose-sm ${message.sender === 'user' ? 'prose-invert' : 'dark:prose-invert'} max-w-none`}>
                            {message.sender === 'user' 
                              ? message.content 
                              : formatMessage(message.content)}
                          </div>
                          
                          {/* Update the reasoning toggle button */}
                          {message.sender === 'ai' && messageReasoning && (
                            <div className="mt-2">
                              <button 
                                onClick={() => toggleReasoning(message.id)}
                                className="text-xs bg-ai-blue/20 hover:bg-ai-blue/30 text-ai-blue rounded-full px-3 py-1 inline-flex items-center transition-colors"
                              >
                                <RiBrainLine className="mr-1" />
                                {isReasoningActive ? 'Hide reasoning' : 'Show reasoning'}
                              </button>
                              
                              {isReasoningActive && (
                                <div className="mt-2 p-3 bg-dark-900/50 border border-ai-blue/20 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                                  {messageReasoning}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(isLoadingResponse || isImageAnalyzing) && (
                  <div className="flex justify-start">
                    <div className="flex items-start max-w-[85%]">
                      <div className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center mx-3 bg-gradient-to-r from-ai-blue to-ai-purple text-white">
                        <IconContext.Provider value={{ className: "text-lg" }}>
                          <RiRobot2Line />
                        </IconContext.Provider>
                      </div>
                      
                      <div className="rounded-2xl px-5 py-4 bg-secondary-50/30 dark:bg-dark-800/80 backdrop-blur-md border border-white/10 shadow-lg">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-ai-blue rounded-full opacity-75" />
                          <div className="w-2 h-2 bg-ai-purple rounded-full opacity-75" />
                          <div className="w-2 h-2 bg-ai-teal rounded-full opacity-75" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Fixed Input area at bottom */}
            <div className="border-t border-white/10 p-5 bg-secondary-50/5 dark:bg-dark-900/70 backdrop-blur-md flex-shrink-0">
              {/* Image preview */}
              {uploadedImage && (
                <div className="mb-4 relative">
                  <div className="border border-ai-blue/30 rounded-lg overflow-hidden bg-dark-900/50 p-2">
                    <div className="flex items-center mb-2">
                      <RiImageLine className="text-ai-blue mr-2" />
                      <span className="text-sm text-gray-300">Image to analyze:</span>
                      <button 
                        onClick={clearUploadedImage}
                        className="ml-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1 rounded-full transition-colors"
                      >
                        <RiCloseLine />
                      </button>
                    </div>
                    <img 
                      src={uploadedImage} 
                      alt="Upload preview" 
                      className="max-h-60 max-w-full mx-auto object-contain rounded"
                    />
                  </div>
                </div>
              )}
              
              {/* Error message for image upload or analysis */}
              {uploadError && (
                <div className="mb-4">
                  <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded-lg flex items-center">
                    <RiCloseLine className="mr-2 flex-shrink-0" />
                    <span className="text-sm">{uploadError}</span>
                  </div>
                </div>
              )}
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-3"
              >
                <div className="relative flex-grow group">
                  <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={uploadedImage 
                      ? t('askAI.inputPlaceholderImage', 'Ask about this image...') 
                      : t('askAI.inputPlaceholder', 'Type your question...')}
                    className="bg-secondary-50/30 dark:bg-dark-800/50 backdrop-blur-md border border-secondary-200/50 dark:border-dark-700/50 rounded-full pl-12 pr-4 py-3 w-full focus:border-ai-blue/50 focus:ring-1 focus:ring-ai-blue/50 transition-all duration-300 group-hover:border-ai-blue/30"
                    leftIcon={
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ai-blue">
                        {isLoadingResponse ? <RiLoader4Line className="w-5 h-5 animate-spin" /> : <RiSearchLine className="w-5 h-5" />}
                      </div>
                    }
                    disabled={isLoadingResponse}
                  />
                </div>
                
                {/* Image Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerImageUpload}
                  className="rounded-full h-12 w-12 flex items-center justify-center border border-secondary-200/50 dark:border-dark-700/50 hover:border-ai-blue/50 hover:bg-ai-blue/10 transition-all duration-300"
                  disabled={isLoadingResponse || isImageAnalyzing}
                >
                  <RiImageAddLine className="text-xl text-ai-blue" />
                </Button>
                
                <Button 
                  type="submit"
                  variant="ai"
                  className="rounded-full px-5 py-3 bg-gradient-to-r from-ai-blue to-ai-purple hover:from-ai-blue hover:to-ai-teal transition-all duration-500 shadow-md hover:shadow-ai-glow"
                  disabled={(!input.trim() && !uploadedImage) || isLoadingResponse || isImageAnalyzing}
                  rightIcon={<RiSendPlaneLine />}
                >
                  {t('askAI.send', 'Send')}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AskAIPage; 