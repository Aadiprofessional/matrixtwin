// Debug utility for authentication issues
export const debugAuth = () => {
  console.log('=== AUTHENTICATION DEBUG ===');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const authUser = localStorage.getItem('auth.user');
  const authSession = localStorage.getItem('auth.session');
  
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'null');
  
  console.log('User exists:', !!user);
  console.log('User data:', user ? JSON.parse(user) : 'null');
  
  console.log('IsAuthenticated flag:', isAuthenticated);
  console.log('Auth.user exists:', !!authUser);
  console.log('Auth.session exists:', !!authSession);
  
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Token payload:', payload);
        console.log('Token issued at:', new Date(payload.iat * 1000));
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Token is expired:', payload.exp < Math.floor(Date.now() / 1000));
        console.log('Current time:', new Date());
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
  
  console.log('=== END DEBUG ===');
};

// Make it available globally for browser console
(window as any).debugAuth = debugAuth; 