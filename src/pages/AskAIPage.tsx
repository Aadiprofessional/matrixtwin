import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiRobot2Line, 
  RiLightbulbLine, 
  RiCloseCircleLine,
  RiBrainLine,
  RiAddLine,
  RiHistoryLine,
  RiPhoneLine,
  RiUserLine,
  RiSendPlaneFill,
  RiDeleteBinLine
} from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useProjects } from '../contexts/ProjectContext';
import { useAIChat } from '../contexts/AIChatContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const AskAIPage: React.FC = () => {
  const { t } = useTranslation();
  const { selectedProject } = useProjects();
  const { 
    currentChat, 
    chatHistory, 
    sendMessage,
    startNewChat,
    deleteChat,
    switchToChat,
    getProjectChats
  } = useAIChat();
  
  const [input, setInput] = useState('');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [activeReasoningId, setActiveReasoningId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollToBottom();
  }, [currentChat.messages]);

  // Switch to project-specific chat when project changes
  useEffect(() => {
    if (selectedProject?.id) {
      // If current chat is not for this project, switch or create new
      if (currentChat.projectId !== String(selectedProject.id)) {
        const projectChats = getProjectChats(String(selectedProject.id));
        if (projectChats.length > 0) {
          // Switch to the most recent chat for this project
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText: string = input) => {
    if (!messageText.trim()) return;
    setInput('');
    
    try {
      await sendMessage(messageText, selectedProject?.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    startNewChat(selectedProject?.id ? String(selectedProject.id) : undefined);
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

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm(t('askAI.confirmDelete', 'Are you sure you want to delete this chat?'))) {
      await deleteChat(chatId);
    }
  };

  const handleSwitchToVoice = () => {
    navigate('/voice-call');
  };

  const toggleReasoning = (messageId: string) => {
    setActiveReasoningId(activeReasoningId === messageId ? null : messageId);
  };

  const filteredHistory = selectedProject?.id 
    ? getProjectChats(String(selectedProject.id))
    : chatHistory;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] relative -mx-6">
      {/* Background decorations - Subtle Orange Theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-portfolio-orange/5 via-transparent to-transparent opacity-20 pointer-events-none"></div>
      
      {/* Fixed Layout with 3 sections: Header, Scrollable Chat, Footer */}
      <div className="flex flex-col h-full z-10">
        {/* Fixed Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-6 border-b border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-portfolio-orange/10 flex items-center justify-center border border-portfolio-orange/20 mr-3">
              <IconContext.Provider value={{ className: "text-portfolio-orange text-xl" }}>
                <RiBrainLine />
              </IconContext.Provider>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">
                Matrix AI
              </h1>
              <div className="text-gray-400 text-xs flex items-center">
                <span>{t('askAI.subtitle', 'Ask anything about your projects')}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 self-end sm:self-auto mt-2 sm:mt-0">
            <Button
              onClick={handleNewChat}
              size="sm"
              className="rounded-lg bg-portfolio-orange hover:bg-portfolio-orange/80 text-white border-none"
            >
              <RiAddLine className="mr-1" />
              New Chat
            </Button>
            
            <Button
              onClick={toggleChatHistory}
              variant="outline"
              size="sm"
              className="rounded-lg border-white/10 text-gray-300 hover:bg-white/5"
            >
              <RiHistoryLine className="mr-1" />
              History
            </Button>
            
            <Button
              onClick={handleSwitchToVoice}
              variant="outline"
              size="sm"
              className="rounded-lg border-white/10 text-gray-300 hover:bg-white/5 w-9 h-9 p-0 flex items-center justify-center"
              title={t('askAI.switchToVoice', 'Switch to Voice Call')}
            >
              <RiPhoneLine />
            </Button>
          </div>
        </div>
        
        {/* Chat History Drawer - Right Panel with Backdrop */}
        <AnimatePresence>
          {showChatHistory && (
            <>
              {/* Backdrop for click-outside to close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleChatHistory}
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              />
              
              {/* Right Side Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 z-50 w-80 h-full shadow-2xl"
              >
                <Card variant="ai-dark" className="p-0 h-full flex flex-col border-l border-white/10 bg-black/90 backdrop-blur-xl">
                  <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
                    <h3 className="text-sm font-display font-semibold flex items-center text-white">
                      <IconContext.Provider value={{ className: "mr-2 text-portfolio-orange" }}>
                        <RiHistoryLine />
                      </IconContext.Provider>
                      Chat History
                    </h3>
                    <button 
                      onClick={toggleChatHistory}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <RiCloseCircleLine className="text-xl" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-10 text-gray-500 text-sm">
                        No history found
                      </div>
                    ) : (
                      filteredHistory.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => handleChatSelect(chat.id)}
                          className={`group w-full text-left p-3 rounded-md transition-all text-sm cursor-pointer relative flex items-center justify-between ${
                            currentChat.id === chat.id
                              ? 'bg-portfolio-orange/10 border border-portfolio-orange/30 text-white'
                              : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center overflow-hidden flex-1 mr-2">
                            <div className="overflow-hidden w-full">
                              <div className="font-medium truncate pr-1">{chat.title}</div>
                              <div className="text-[10px] text-gray-600 mt-1 flex items-center justify-between">
                                <span>{new Date(chat.lastUpdatedAt).toLocaleDateString()}</span>
                                <span className="text-xs opacity-60">{new Date(chat.lastUpdatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                            className="text-gray-500 hover:text-red-500 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                            title="Delete chat"
                          >
                            <RiDeleteBinLine />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Main Chat Area - Middle section with scrollable content */}
        <div className="flex-grow overflow-hidden flex flex-col relative">
          {/* Only this area should scroll */}
          <div className="flex-grow overflow-y-auto py-4 px-4 ai-scrollbar">
            <div className="space-y-6 w-full">
              {currentChat.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 mt-10">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <RiBrainLine className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-300">How can I help you today?</h3>
                  <p className="text-sm max-w-md mt-2">
                    Ask me about your project status, tasks, safety reports, or any other construction details.
                  </p>
                </div>
              )}
              
              {currentChat.messages.map((message) => {
                // Get reasoning for this specific message if it exists
                const messageReasoning = window.sessionStorage.getItem(`reasoning-${message.id}`);
                const isReasoningActive = activeReasoningId === message.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start ${message.sender === 'user' ? 'max-w-[90%] sm:max-w-[85%] flex-row-reverse' : 'max-w-[95%]'}`}>
                      <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center mx-2 ${
                        message.sender === 'user' 
                          ? 'bg-portfolio-orange text-white' 
                          : message.isStreaming 
                            ? 'bg-portfolio-orange text-white animate-pulse' 
                            : 'bg-transparent text-portfolio-orange border border-white/10'
                      }`}>
                        <IconContext.Provider value={{ className: "text-sm" }}>
                          {message.sender === 'user' ? <RiUserLine /> : <RiRobot2Line />}
                        </IconContext.Provider>
                      </div>
                      
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        message.sender === 'user'
                          ? 'bg-portfolio-orange text-white shadow-md'
                          : 'bg-transparent text-gray-200 pl-0 border-none shadow-none'
                      }`}>
                        <div className={`mb-1 text-[10px] opacity-70 flex items-center ${message.sender === 'user' ? 'text-white/80' : 'text-gray-400'}`}>
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
                        
                        <div className={`prose prose-sm prose-p:my-1 prose-headings:my-2 ${message.sender === 'user' ? 'prose-invert text-white' : 'prose-invert text-gray-200'} max-w-none leading-relaxed`}>
                          {message.sender === 'user' 
                            ? message.content 
                            : (
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 pb-2 border-b border-white/10" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-portfolio-orange mt-4 mb-2" {...props} />,
                                    h4: ({node, ...props}) => <h4 className="text-base font-semibold text-white mt-3 mb-2" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-gray-300 last:mb-0" {...props} />,
                                    a: ({node, ...props}) => <a className="text-portfolio-orange hover:text-white underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-300" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-gray-300" {...props} />,
                                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-portfolio-orange/50 pl-4 py-1 my-4 bg-white/5 rounded-r italic text-gray-400" {...props} />,
                                    hr: ({node, ...props}) => <hr className="border-white/10 my-6" {...props} />,
                                    table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-white/10"><table className="min-w-full divide-y divide-white/10" {...props} /></div>,
                                    thead: ({node, ...props}) => <thead className="bg-white/5" {...props} />,
                                    th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" {...props} />,
                                    tbody: ({node, ...props}) => <tbody className="divide-y divide-white/5 bg-transparent" {...props} />,
                                    tr: ({node, ...props}) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
                                    td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300" {...props} />,
                                    code: ({node, className, children, ...props}) => {
                                      const match = /language-(\w+)/.exec(className || '')
                                      return match ? (
                                        <div className="rounded-lg bg-[#1e1e1e] my-4 overflow-hidden border border-white/10 shadow-lg">
                                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                            <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
                                            <div className="flex space-x-1.5">
                                              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                            </div>
                                          </div>
                                          <div className="p-4 overflow-x-auto">
                                            <code className={`${className} font-mono text-sm`} {...props}>
                                              {children}
                                            </code>
                                          </div>
                                        </div>
                                      ) : (
                                        <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-portfolio-orange" {...props}>
                                          {children}
                                        </code>
                                      )
                                    },
                                    pre: ({node, ...props}) => <pre className="bg-transparent p-0 m-0" {...props} />,
                                    img: ({node, ...props}) => <img className="rounded-lg max-w-full h-auto my-4 border border-white/10" {...props} alt={props.alt || 'AI generated image'} />,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              )}
                          {message.isStreaming && message.content === '' && (
                            <div className="flex items-center text-portfolio-orange py-1">
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                <div className="w-1.5 h-1.5 bg-portfolio-orange rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Update the reasoning toggle button */}
                        {message.sender === 'ai' && messageReasoning && !message.isStreaming && (
                          <div className="mt-2 border-t border-white/10 pt-2">
                            <button 
                              onClick={() => toggleReasoning(message.id)}
                              className="text-[10px] bg-portfolio-orange/10 hover:bg-portfolio-orange/20 text-portfolio-orange rounded-full px-2 py-0.5 inline-flex items-center transition-colors border border-portfolio-orange/20"
                            >
                              <RiBrainLine className="mr-1" />
                              {isReasoningActive ? 'Hide reasoning' : 'Show reasoning'}
                            </button>
                            
                            {isReasoningActive && (
                              <div className="mt-2 p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap">
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
          <div className="border-t border-white/10 py-4 px-6 bg-black/20 backdrop-blur-md flex-shrink-0">
            <div className="w-full max-w-none">
              <div className="flex items-end gap-2 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:ring-1 focus-within:ring-portfolio-orange focus-within:border-portfolio-orange transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('askAI.inputPlaceholder', 'Ask me anything about your project...')}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm text-white placeholder-gray-500 min-h-[44px] max-h-[120px] py-2.5 px-2 scrollbar-hide"
                  rows={1}
                  style={{ height: 'auto', minHeight: '44px' }}
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  className="rounded-lg w-10 h-10 p-0 flex items-center justify-center bg-portfolio-orange hover:bg-portfolio-orange/80 transition-all shadow-md text-white disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
                  disabled={!input.trim()}
                >
                  <RiSendPlaneFill className="text-lg" />
                </Button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-600">
                  AI can make mistakes. Please verify important information.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskAIPage; 