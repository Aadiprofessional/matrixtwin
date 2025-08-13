// Token management utility
const API_BASE_URL = 'https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api';

export const tokenManager = {
  // Get current token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // Set token in localStorage
  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  // Clear token from localStorage
  clearToken(): void {
    localStorage.removeItem('token');
  },

  // Check if token is expired (client-side check)
  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false; // No expiration
      
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  // Refresh token by re-authenticating
  async refreshToken(): Promise<string | null> {
    try {
      // Get stored user credentials (if available)
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.warn('No stored user data for token refresh');
        return null;
      }

      const userData = JSON.parse(storedUser);
      if (!userData.email) {
        console.warn('No email in stored user data');
        return null;
      }

      // For security, we can't store password, so we'll need to redirect to login
      // This is a placeholder for a proper refresh token mechanism
      console.log('Token refresh needed - redirecting to login');
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  },

  // Get a valid token, refreshing if necessary
  async getValidToken(): Promise<string | null> {
    const token = this.getToken();
    if (!token) return null;

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log('Token is expired, attempting refresh...');
      const newToken = await this.refreshToken();
      if (newToken) {
        this.setToken(newToken);
        return newToken;
      }
      return null;
    }

    return token;
  }
};

// Make it available globally for debugging
(window as any).tokenManager = tokenManager; 