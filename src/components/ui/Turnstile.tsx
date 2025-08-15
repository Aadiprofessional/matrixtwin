import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { loadTurnstileScript, isTurnstileLoaded } from '../../utils/turnstileLoader';

interface TurnstileProps {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onVerify?: (token: string) => void; // For backward compatibility
  options?: {
    theme?: 'light' | 'dark' | 'auto';
    [key: string]: any;
  };
  className?: string;
  ref?: React.Ref<any>;
}

const Turnstile = forwardRef<any, TurnstileProps>(({ 
  siteKey, 
  onSuccess, 
  onError,
  onVerify, // For backward compatibility
  options = { theme: 'auto' },
  className = ''
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  
  // Define the window.turnstile type to avoid TypeScript errors
  const turnstile = window.turnstile;

  const [isScriptLoaded, setIsScriptLoaded] = useState(isTurnstileLoaded());

  // Expose reset method to parent components via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    }
  }));

  // Load the Turnstile script once
  useEffect(() => {
    if (!isScriptLoaded) {
      loadTurnstileScript()
        .then(() => {
          setIsScriptLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load Turnstile script:', error);
          if (onError) onError();
        });
    }
  }, [isScriptLoaded, onError]);

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
        if (onSuccess) onSuccess(mockToken);
        if (onVerify) onVerify(mockToken); // For backward compatibility
      }, 500);
    }
  }, [isLocalhost, onSuccess, onVerify]);

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
          // @ts-ignore - Ignore type errors for the render call
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              if (onSuccess) onSuccess(token);
              if (onVerify) onVerify(token); // For backward compatibility
            },
            'error-callback': () => {
              console.error('Turnstile widget encountered an error');
              if (onError) onError();
            },
            theme: options?.theme || 'auto',
            'refresh-expired': 'auto',
            ...options
          });
          console.log('Turnstile widget rendered with ID:', widgetIdRef.current);
        }
      } catch (e) {
        console.error('Failed to render Turnstile widget', e);
        if (onError) onError();
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
  }, [isLocalhost, isScriptLoaded, siteKey, options, onSuccess, onVerify, onError]);

  // On localhost, render an empty div with a message
  if (isLocalhost) {
    return (
      <div className={className} style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
        Turnstile verification bypassed in localhost environment
      </div>
    );
  }
  
  // Normal rendering for production environments
  return (
    <div 
      ref={containerRef} 
      className={`${className} min-h-[150px] flex items-center justify-center`}
      style={{ 
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '15px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        overflow: 'visible',
        boxShadow: '0 0 10px rgba(0, 153, 255, 0.5)',
        margin: '10px 0',
        zIndex: 100
      }}
      id="turnstile-container"
    >
      {!isScriptLoaded && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <span style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>Loading CAPTCHA verification...</span>
          <span style={{ color: '#aaa', fontSize: '12px' }}>If this takes too long, try refreshing the page</span>
        </div>
      )}
      {isScriptLoaded && !widgetIdRef.current && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <span style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>CAPTCHA should appear here. If not visible, please refresh the page.</span>
          <button 
            onClick={() => {
              // Force reload the script
              const existingScript = document.getElementById('cloudflare-turnstile-script');
              if (existingScript) existingScript.remove();
              setIsScriptLoaded(false);
              loadTurnstileScript().then(() => setIsScriptLoaded(true));
            }}
            style={{
              backgroundColor: 'rgba(0, 153, 255, 0.5)',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Reload CAPTCHA
          </button>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '-20px', left: '0', width: '100%', textAlign: 'center', fontSize: '10px', color: '#aaa' }}>
        Cloudflare Turnstile CAPTCHA
      </div>
    </div>
  );
});

export { Turnstile };

// Add Turnstile to the global Window interface
// This is a custom declaration that doesn't conflict with the one from @marsidev/react-turnstile
interface Turnstile {
  render: (container: HTMLElement, options: any) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  ready?: (callback: () => void) => void;
  execute?: (container: string | HTMLElement, options?: any) => void;
  getResponse?: (container: string | HTMLElement) => string | undefined;
  isExpired?: (widgetId: string) => boolean;
}