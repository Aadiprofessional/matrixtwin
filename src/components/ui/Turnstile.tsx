import React, { useEffect, useRef, useState } from 'react';
import { loadTurnstileScript, isTurnstileLoaded } from '../../utils/turnstileLoader';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

const Turnstile: React.FC<TurnstileProps> = ({ 
  siteKey, 
  onVerify, 
  theme = 'auto',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [isScriptLoaded, setIsScriptLoaded] = useState(isTurnstileLoaded());

  // Load the Turnstile script once
  useEffect(() => {
    if (!isScriptLoaded) {
      loadTurnstileScript()
        .then(() => {
          setIsScriptLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load Turnstile script:', error);
        });
    }
  }, [isScriptLoaded]);

  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Auto-verify on localhost for development convenience
  useEffect(() => {
    if (isLocalhost) {
      console.info('Turnstile: Running on localhost, bypassing verification with mock token');
      // Generate a fake token for local development
      const mockToken = 'LOCAL_DEV_' + Math.random().toString(36).substring(2, 15);
      // Small delay to simulate real verification
      setTimeout(() => {
        onVerify(mockToken);
      }, 500);
    }
  }, [isLocalhost, onVerify]);

  // Render the widget when the script is loaded (only if not on localhost)
  useEffect(() => {
    // Skip widget rendering on localhost
    if (isLocalhost || !isScriptLoaded || !containerRef.current) {
      return;
    }

    // Make sure turnstile is fully initialized
    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      console.warn('Turnstile is not fully initialized yet');
      // Try again in a moment
      const retryTimeout = setTimeout(() => {
        setIsScriptLoaded(isTurnstileLoaded());
      }, 500);
      
      return () => clearTimeout(retryTimeout);
    }

    // Clean up previous widget if it exists
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      } catch (e) {
        console.warn('Failed to remove previous Turnstile widget', e);
      }
    }

    // Render new widget with a small delay to ensure DOM is ready
    const renderTimeout = setTimeout(() => {
      try {
        if (containerRef.current && window.turnstile && typeof window.turnstile.render === 'function') {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            theme: theme
          });
        }
      } catch (e) {
        console.error('Failed to render Turnstile widget', e);
      }
    }, 100);

    // Clean up on unmount
    return () => {
      clearTimeout(renderTimeout);
      
      // Only attempt to remove widget if not on localhost
      if (!isLocalhost && widgetIdRef.current && window.turnstile && typeof window.turnstile.remove === 'function') {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          console.warn('Failed to remove Turnstile widget during cleanup', e);
        }
      }
    };
  }, [isLocalhost, isScriptLoaded, siteKey, theme, onVerify]);

  // On localhost, render an empty div with a message
  if (isLocalhost) {
    return (
      <div className={className} style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
        Turnstile verification bypassed in localhost environment
      </div>
    );
  }
  
  // Normal rendering for production environments
  return <div ref={containerRef} className={className} />;
};

export { Turnstile };

// Add Turnstile to the global Window interface
declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}