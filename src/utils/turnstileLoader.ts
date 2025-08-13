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
  return new Promise((resolve, reject) => {
    // Define turnstile on window if it doesn't exist to prevent errors
    if (typeof window !== 'undefined' && !window.turnstile) {
      window.turnstile = window.turnstile || { render: () => '', remove: () => {}, reset: () => {} };
    }
    
    // If script is already loaded and turnstile is properly initialized, resolve immediately
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      scriptLoaded = true;
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.getElementById('cloudflare-turnstile-script');
    if (existingScript) {
      // If script is loading, wait for it to load
      if (scriptLoading) {
        const checkTurnstile = () => {
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            scriptLoaded = true;
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
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.id = 'cloudflare-turnstile-script';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait for turnstile to be properly initialized
        const checkTurnstile = () => {
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            scriptLoaded = true;
            scriptLoading = false;
            resolve();
          } else {
            setTimeout(checkTurnstile, 100);
          }
        };
        checkTurnstile();
      };
      
      script.onerror = (error) => {
        scriptLoading = false;
        reject(new Error(`Failed to load Turnstile script: ${error}`));
      };
      
      document.head.appendChild(script);
    } catch (error) {
      scriptLoading = false;
      reject(error);
    }
  });
};

/**
 * Checks if the Turnstile script is loaded
 * @returns boolean indicating if the script is loaded
 */
export const isTurnstileLoaded = (): boolean => {
  return scriptLoaded || !!window.turnstile;
};