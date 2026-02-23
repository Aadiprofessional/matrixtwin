import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../lib/supabase';
import { api } from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string, turnstileToken?: string | null) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  verifyTwoFactor: (code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  forceReLogin: () => void; // Add this new function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Force re-login by clearing all auth data
  const forceReLogin = () => {
    console.log('AuthContext: Forcing re-login due to token issues');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('auth.user');
    localStorage.removeItem('auth.session');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUser(null);
    
    // Redirect to login page with token expiration flag
    window.location.href = '/login?tokenExpired=true';
  };

  useEffect(() => {
    const checkAuth = () => {
      console.log('AuthContext: Checking authentication state...');
      // Check for token first
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('AuthContext: No token found, setting unauthenticated');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Check for user in localStorage (remember me) or sessionStorage
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const isAuthenticatedFlag = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');

      // Also check the auth.user key that might be set by the login function
      const authUser = localStorage.getItem('auth.user');

      if ((storedUser || authUser) && (isAuthenticatedFlag || token)) {
        let userData;
        try {
          userData = JSON.parse(storedUser || authUser || '{}');
          setUser(userData);
          setIsAuthenticated(true);
          console.log('AuthContext: Authentication restored from localStorage:', userData.email);
        } catch (error) {
          console.error('AuthContext: Error parsing stored user data:', error);
          // Clear corrupted data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('auth.user');
          localStorage.removeItem('auth.session');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('isAuthenticated');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('AuthContext: No valid user data found, token exists:', !!token);
        // If no user data found but token exists, keep the token
        // Only clear if there's no token at all
        if (!token) {
          console.log('AuthContext: Clearing all auth data (no token)');
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('auth.user');
          localStorage.removeItem('auth.session');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('isAuthenticated');
        }
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuth();
    // Use setTimeout to ensure state updates are processed and avoid race conditions
    setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    // Set up event listener for forceReLogin
    const handleForceReLogin = () => {
      forceReLogin();
    };

    window.addEventListener('forceReLogin', handleForceReLogin);

    // Cleanup event listener
    return () => {
      window.removeEventListener('forceReLogin', handleForceReLogin);
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login with:', email);
      
      const response = await api.login(email, password);
      
      if (!response.token) {
        throw new Error('No token returned from login');
      }
      
      const userData = response.user;
      
      if (!userData) {
         throw new Error('No user data returned from login');
      }

      console.log('Login successful, user:', userData);

      setUser(userData);
      setIsAuthenticated(true);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('auth.user', JSON.stringify(userData));
      
    } catch (err) {
      console.error('Login error:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Logging out user');
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('auth.user');
      localStorage.removeItem('auth.session');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isAuthenticated');
      
      // Sign out from Supabase if needed (optional now)
      // await supabase.auth.signOut();
      
      setUser(null);
      setIsAuthenticated(false);
      console.log('Logout successful');
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, turnstileToken?: string | null): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting signup with:', email);
      
      const response = await api.signup(name, email, password, turnstileToken);
      
      if (!response.token) {
        // If the API requires login after signup, we might not get a token here.
        // But assuming standard JWT flow where signup returns token.
        // If not, we should probably just return and let the user login.
        // However, based on existing code, it expects auto-login.
        if (response.success && !response.token) {
            // Maybe just success message
            return;
        }
        throw new Error('No token returned from signup');
      }
      
      const userData = response.user;
      if (!userData) {
        throw new Error('No user data returned from signup');
      }

      console.log('Signup successful, user:', userData);
      
      // Don't auto-login after signup
      // setUser(userData);
      // setIsAuthenticated(true);
      // localStorage.setItem('token', response.token);
      // localStorage.setItem('user', JSON.stringify(userData));
      // localStorage.setItem('isAuthenticated', 'true');
      // localStorage.setItem('auth.user', JSON.stringify(userData));
      
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user to update');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id);
      
      if (error) throw new Error(error.message);
      
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('auth.user', JSON.stringify(updatedUser));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Implement two-factor verification logic here
      // This is a placeholder for the actual implementation
      console.log('Verifying two-factor code:', code);
      
      // For now, just simulate success
      if (code === '123456') {
        console.log('Two-factor verification successful');
      } else {
        throw new Error('Invalid two-factor code');
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw new Error(error.message);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would validate the token and update the password in the database
      // With Supabase, this is handled differently via the password reset flow
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw new Error(error.message);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // Check against a single required role
    if (typeof requiredRole === 'string') {
      return user.role === requiredRole;
    }
    
    // Check against multiple possible roles
    return requiredRole.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        signup,
        updateUser,
        isLoading,
        isInitialized,
        error,
        verifyTwoFactor,
        requestPasswordReset,
        resetPassword,
        hasPermission,
        setUser,
        setIsAuthenticated,
        forceReLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 