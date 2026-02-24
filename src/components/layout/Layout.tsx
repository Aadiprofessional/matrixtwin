import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickActions } from './QuickActions';
import { IconContext } from 'react-icons';
import { RiMenuLine, RiBrainLine, RiCloseLine } from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import { AIChatPopup } from '../ai/AIChatPopup';

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideHeader = false }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Check if current page is AI-related
  const isAIPage = location.pathname === '/ask-ai' || 
                   location.pathname === '/voice-call' ||
                   location.pathname.endsWith('/ask-ai') ||
                   location.pathname.endsWith('/voice-call');
  
  const toggleSidebar = () => {
    if (isMobile) {
      setShowSidebar(!showSidebar);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };
  
  // Handle sidebar collapse changes
  const handleSidebarCollapseChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  const toggleAIPopup = () => {
    setShowAIPopup(!showAIPopup);
  };
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowSidebar(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Effect to close AI popup when navigating to AI page
  useEffect(() => {
    if (isAIPage) {
      setShowAIPopup(false);
    }
  }, [isAIPage]);

  return (
    <div className="flex min-h-screen h-screen bg-dark-950 text-white">
      {/* Sidebar for large screens */}
      {!isMobile && (
        <Sidebar 
          onCollapseChange={handleSidebarCollapseChange}
        />
      )}
      
      {/* Mobile sidebar with overlay */}
      <AnimatePresence>
        {isMobile && showSidebar && (
          <>
            <div 
              className="fixed inset-0 bg-dark-900/80 backdrop-blur-md z-40"
              onClick={() => setShowSidebar(false)}
            />
            
            <div className="fixed top-0 left-0 h-full w-64 z-50">
              <Sidebar 
                mobile={true}
                onClose={() => setShowSidebar(false)}
              />
            </div>
          </>
        )}
      </AnimatePresence>
      
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out ${!isMobile ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}`}>
        {/* Ambient background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5" 
          style={{ 
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '30px 30px' 
          }}
        />
        
        {/* Conditionally render the header based on hideHeader prop */}
        {!hideHeader && (
          <Header 
            onQuickActionsToggle={() => setShowQuickActions(!showQuickActions)} 
            onMenuToggle={toggleSidebar} 
            isMobile={isMobile}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}
        
        {/* Quick Actions panel */}
        <AnimatePresence>
          {showQuickActions && (
            <QuickActions onClose={() => setShowQuickActions(false)} />
          )}
        </AnimatePresence>
        
        <main ref={mainRef} className={`flex-1 overflow-auto ${!hideHeader ? 'pt-20' : 'pt-0'} pl-4`}>
          <div className="min-h-full px-6">
            {children}
          </div>
        </main>
        
        {/* AI Chat Popup */}
        <AIChatPopup isOpen={showAIPopup} onClose={() => setShowAIPopup(false)} />
        
        {/* AI Assistant Button with transform animation */}
        {!isAIPage && (
          <button 
            onClick={toggleAIPopup}
            className="fixed right-6 bottom-6 bg-portfolio-orange hover:bg-orange-600 text-white rounded-full p-5 shadow-lg hover:shadow-xl transition-all z-50"
            title={showAIPopup ? "Close AI Assistant" : "Ask AI Assistant"}
          >
            {showAIPopup ? (
              <div className="rotate-in">
                <RiCloseLine className="text-3xl" />
              </div>
            ) : (
              <div>
                <RiBrainLine className="text-3xl" />
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}; 