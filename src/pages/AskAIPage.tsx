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
    sendMessage,
    clearMessages,
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
    if ((!messageText.trim() && !uploadedImage)) return;
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
    const textWithLinks = content.replace(urlRegex, url => `<a href="${url}" target="_blank" class="text-portfolio-orange underline hover:text-white transition-colors">${url}</a>`);
    
    // Convert markdown-style bullet points
    const bulletRegex = /^\s*[-*•]\s(.+)$/gm;
    const textWithBullets = textWithLinks.replace(bulletRegex, '<li>$1</li>');
    
    // If there are bullet points, wrap them in a list
    const hasListItems = textWithBullets.includes('<li>');
    let formattedText = textWithBullets;
    
    if (hasListItems) {
      formattedText = textWithBullets.replace(/(<li>.+<\/li>)+/g, match => 
        `<ul class="list-disc pl-5 my-3 space-y-1 text-gray-300">${match}</ul>`
      );
    }
    
    // Format headings (markdown-style)
    const headingRegex = /^###\s+(.+)$/gm;
    formattedText = formattedText.replace(headingRegex, '<h3 class="text-lg font-medium text-portfolio-orange my-2">$1</h3>');
    
    // Format subheadings
    const subheadingRegex = /^##\s+(.+)$/gm;
    formattedText = formattedText.replace(subheadingRegex, '<h2 class="text-xl font-semibold text-white my-3">$1</h2>');
    
    // Format bold text
    const boldRegex = /\*\*(.+?)\*\*/g;
    formattedText = formattedText.replace(boldRegex, '<strong class="font-semibold text-portfolio-orange">$1</strong>');
    
    // Format italic text
    const italicRegex = /\*(.+?)\*/g;
    formattedText = formattedText.replace(italicRegex, '<em class="text-gray-400">$1</em>');
    
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
    <div className="flex flex-col h-screen relative bg-black">
      {/* Background decorations - Subtle Orange Theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-portfolio-orange/5 via-transparent to-transparent opacity-20 pointer-events-none"></div>
      
      {/* Fixed Layout with 3 sections: Header, Scrollable Chat, Footer */}
      <div className="flex flex-col h-full z-10">
        {/* Fixed Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 px-4 pt-4 flex-shrink-0">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-portfolio-orange/10 flex items-center justify-center border border-portfolio-orange/20 mr-4">
              <IconContext.Provider value={{ className: "text-portfolio-orange text-xl" }}>
                <RiBrainLine />
              </IconContext.Provider>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Matrix AI
              </h1>
              <div className="text-gray-400 text-sm mt-1 flex items-center flex-wrap gap-4">
                <span>{t('askAI.subtitle', 'Ask anything about your projects')}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-4 self-end sm:self-auto">
            <Button
              onClick={handleNewChat}
              className="rounded-lg px-4 py-2 text-white bg-portfolio-orange hover:bg-portfolio-orange/80 transition-colors flex items-center"
            >
              <RiAddLine className="mr-2" />
              New Chat
            </Button>
            
            <Button
              onClick={toggleChatHistory}
              variant="outline"
              className="rounded-lg px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
            >
              <RiHistoryLine className="mr-2" />
              History
            </Button>
            
            <Button
              onClick={handleSwitchToVoice}
              variant="outline"
              className="rounded-full w-10 h-10 flex items-center justify-center border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-portfolio-orange hover:text-portfolio-orange transition-colors"
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
              <Card variant="ai-dark" className="p-4 h-full overflow-auto border border-portfolio-orange/20 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-display font-semibold flex items-center text-white">
                    <IconContext.Provider value={{ className: "mr-2 text-portfolio-orange" }}>
                      <RiHistoryLine />
                    </IconContext.Provider>
                    Chat History
                  </h3>
                  <button 
                    onClick={toggleChatHistory}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
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
                          ? 'bg-portfolio-orange/20 border-l-2 border-portfolio-orange text-white'
                          : 'hover:bg-gray-800/50 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                          <IconContext.Provider value={{ className: currentChat.id === chat.id ? "text-portfolio-orange" : "text-gray-400" }}>
                            <RiRobot2Line />
                          </IconContext.Provider>
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">{chat.title}</div>
                          <div className="text-xs text-gray-500">
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
        <div className="flex-grow overflow-hidden flex flex-col px-4 pb-4">
          <Card variant="ai-dark" className="flex flex-col flex-grow overflow-hidden border border-gray-800 bg-gray-900/50">
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
                            ? 'bg-portfolio-orange text-white' 
                            : message.isStreaming 
                              ? 'bg-portfolio-orange text-white animate-pulse' 
                              : 'bg-portfolio-orange/10 text-portfolio-orange border border-portfolio-orange/20'
                        }`}>
                          <IconContext.Provider value={{ className: "text-lg" }}>
                            {message.sender === 'user' ? <RiUserLine /> : <RiRobot2Line />}
                          </IconContext.Provider>
                        </div>
                        
                        <div className={`rounded-2xl px-5 py-4 ${
                          message.sender === 'user'
                            ? 'bg-portfolio-orange text-white shadow-lg'
                            : 'bg-gray-800/50 border border-gray-700 shadow-lg'
                        }`}>
                          <div className={`mb-1 text-xs opacity-70 flex items-center ${message.sender === 'user' ? 'text-white/80' : 'text-gray-400'}`}>
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
                                className="max-w-full h-auto max-h-60 object-contain bg-black/50"
                              />
                            </div>
                          )}
                          
                          <div className={`prose prose-sm ${message.sender === 'user' ? 'prose-invert text-white' : 'prose-invert text-gray-200'} max-w-none`}>
                            {message.sender === 'user' 
                              ? message.content 
                              : formatMessage(message.content)}
                            {message.isStreaming && message.content === '' && (
                              <div className="flex items-center text-portfolio-orange">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <div className="w-2 h-2 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                  <div className="w-2 h-2 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Update the reasoning toggle button */}
                          {message.sender === 'ai' && messageReasoning && !message.isStreaming && (
                            <div className="mt-2">
                              <button 
                                onClick={() => toggleReasoning(message.id)}
                                className="text-xs bg-portfolio-orange/10 hover:bg-portfolio-orange/20 text-portfolio-orange rounded-full px-3 py-1 inline-flex items-center transition-colors border border-portfolio-orange/20"
                              >
                                <RiBrainLine className="mr-1" />
                                {isReasoningActive ? 'Hide reasoning' : 'Show reasoning'}
                              </button>
                              
                              {isReasoningActive && (
                                <div className="mt-2 p-3 bg-black/50 border border-portfolio-orange/20 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
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
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Fixed Input area at bottom */}
            <div className="border-t border-gray-800 p-5 bg-black/90 flex-shrink-0">
              {/* Image preview */}
              {uploadedImage && (
                <div className="mb-4 relative">
                  <div className="border border-portfolio-orange/30 rounded-lg overflow-hidden bg-gray-900 p-2">
                    <div className="flex items-center mb-2">
                      <RiImageLine className="text-portfolio-orange mr-2" />
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
                    className="bg-gray-900 border border-gray-700 rounded-full pl-12 pr-4 py-3 w-full focus:border-portfolio-orange focus:ring-1 focus:ring-portfolio-orange transition-all duration-300 group-hover:border-gray-600 text-white placeholder-gray-500"
                    leftIcon={
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-portfolio-orange">
                        <RiSearchLine className="w-5 h-5" />
                      </div>
                    }
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
                  className="rounded-full h-12 w-12 flex items-center justify-center border border-gray-700 hover:border-portfolio-orange hover:bg-portfolio-orange/10 transition-all duration-300"
                  disabled={isImageAnalyzing}
                >
                  <RiImageAddLine className="text-xl text-portfolio-orange" />
                </Button>
                
                <Button 
                  type="submit"
                  className="rounded-full px-5 py-3 bg-portfolio-orange hover:bg-portfolio-orange/80 transition-all duration-300 shadow-md hover:shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(!input.trim() && !uploadedImage) || isImageAnalyzing}
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