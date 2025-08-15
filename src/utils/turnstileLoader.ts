/**
 * Utility to load the Cloudflare Turnstile script only once
 */

let scriptLoaded = false;
let scriptLoading = false;

/**
 * Loads the Cloudflare Turnstile script if it hasn't been loaded already
 * @returns A promise that resolves when the script is loaded
 */
export const loadTurnstileScript = (): Promise<void> => {
  console.log('Attempting to load Cloudflare Turnstile script...');
  return new Promise((resolve, reject) => {
    // Define turnstile on window if it doesn't exist to prevent errors
    if (typeof window !== 'undefined' && !window.turnstile) {
      console.log('Initializing empty turnstile object on window');
      // @ts-ignore - Ignore type errors for this initialization
      window.turnstile = { 
        render: () => '', 
        remove: () => {}, 
        reset: () => {},
        ready: (callback) => callback(),
        execute: () => {},
        getResponse: () => '',
        isExpired: () => false
      };
    }
    
    // If script is already loaded and turnstile is properly initialized, resolve immediately
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      console.log('Turnstile script already loaded and initialized');
      scriptLoaded = true;
      resolve();
      return;
    }
    
    // Set a timeout to prevent hanging if script fails to load
    const timeoutId = setTimeout(() => {
      console.warn('Turnstile script load timed out after 10 seconds');
      // Create a visible error message in the DOM
      const turnstileContainers = document.querySelectorAll('#turnstile-container');
      turnstileContainers.forEach(container => {
        const errorMsg = document.createElement('div');
        errorMsg.style.color = 'red';
        errorMsg.style.padding = '10px';
        errorMsg.style.backgroundColor = 'rgba(255,0,0,0.1)';
        errorMsg.style.borderRadius = '4px';
        errorMsg.style.margin = '10px 0';
        errorMsg.textContent = 'Failed to load CAPTCHA verification. Please refresh the page.';
        container.appendChild(errorMsg);
      });
      // Resolve anyway to prevent blocking the UI
      resolve();
    }, 10000);

    // Check if script tag already exists
    const existingScript = document.getElementById('cloudflare-turnstile-script');
    if (existingScript) {
      // If script is loading, wait for it to load
      if (scriptLoading) {
        const checkTurnstile = () => {
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            scriptLoaded = true;
            clearTimeout(timeoutId);
            resolve();
          } else {
            setTimeout(checkTurnstile, 100);
          }
        };
        checkTurnstile();
      } else {
        // Script tag exists but not loading or loaded (unusual case)
        scriptLoading = true; // Set to loading since we're going to wait for it
        const checkTurnstile = () => {
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            scriptLoaded = true;
            scriptLoading = false;
            clearTimeout(timeoutId);
            resolve();
          } else {
            setTimeout(checkTurnstile, 100);
          }
        };
        checkTurnstile();
      }
      return;
    }

    // Create and append the script
      try {
        scriptLoading = true;
        console.log('Creating new Cloudflare Turnstile script element');
        
        // Remove any existing script first to ensure clean loading
        const existingScript = document.getElementById('cloudflare-turnstile-script');
        if (existingScript) {
          console.log('Removing existing Turnstile script');
          existingScript.remove();
        }
        
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.id = 'cloudflare-turnstile-script';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-loading-timestamp', Date.now().toString());
        
        script.onload = () => {
          console.log('Turnstile script loaded, checking for initialization...');
          // Wait for turnstile to be properly initialized
          let checkAttempts = 0;
          const maxAttempts = 50; // 5 seconds max wait
          
          const checkTurnstile = () => {
            checkAttempts++;
            if (window.turnstile && typeof window.turnstile.render === 'function') {
              console.log('Turnstile successfully initialized after', checkAttempts, 'attempts');
              scriptLoaded = true;
              scriptLoading = false;
              clearTimeout(timeoutId);
              resolve();
            } else if (checkAttempts > maxAttempts) {
              console.warn('Turnstile initialization timed out after', checkAttempts, 'attempts');
              scriptLoading = false;
              // Continue anyway
              resolve();
            } else {
              setTimeout(checkTurnstile, 100);
            }
          };
          checkTurnstile();
        };
        
        script.onerror = (error) => {
          console.error('Error loading Turnstile script:', error);
          scriptLoading = false;
          clearTimeout(timeoutId);
          
          // Create a visible error message
          const turnstileContainers = document.querySelectorAll('#turnstile-container');
          turnstileContainers.forEach(container => {
            const errorMsg = document.createElement('div');
            errorMsg.style.color = 'red';
            errorMsg.style.padding = '10px';
            errorMsg.textContent = 'Failed to load CAPTCHA. Please try refreshing the page.';
            container.appendChild(errorMsg);
          });
          
          // Resolve anyway to prevent blocking the UI
          resolve();
        };
        
        console.log('Appending Turnstile script to document head');
        document.head.appendChild(script);
      } catch (error) {
        console.error('Exception during Turnstile script creation:', error);
        scriptLoading = false;
        clearTimeout(timeoutId);
        reject(error);
      }
  });
};

/**
 * Checks if the Turnstile script is loaded
 * @returns boolean indicating if the script is loaded
 */
export const isTurnstileLoaded = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!window.turnstile && typeof window.turnstile.render === 'function';
  }
  
  return false;
};