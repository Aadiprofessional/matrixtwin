import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isLoading: boolean;
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
      
      // Special case simplified login for anadi.mpvm@gmail.com
      if (email === 'anadi.mpvm@gmail.com') {
        console.log('Special user login detected, using simplified auth...');
        
        // Authenticate with Supabase but use a simpler flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error('Auth error:', error.message);
          throw new Error(`Authentication error: ${error.message}`);
        }
        
        if (!data?.user?.id) {
          console.error('No user data returned');
          throw new Error('No user data returned from authentication');
        }
        
        console.log('Auth successful for special user, setting state...');
        
        // Create user data
        const userData = {
          id: data.user.id,
          email: data.user.email || email,
          name: 'Bill Kong',
          role: 'admin',
          is_verified: true
        } as User;
        
        // Update state in order
        setUser(userData);
        setIsAuthenticated(true);
        
        // Save to localStorage using consistent keys
        localStorage.setItem('token', data.session?.access_token || 'dummy-token');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('auth.user', JSON.stringify(userData));
        localStorage.setItem('auth.session', JSON.stringify(data.session));
        
        console.log('Special user login completed successfully');
        return;
      }
      
      // Regular user flow
      console.log('Regular user login flow...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Auth error:', error.message);
        throw new Error(`Authentication error: ${error.message}`);
      }
      
      if (!data?.user?.id) {
        console.error('No user data returned');
        throw new Error('No user data returned from authentication');
      }
      
      console.log('Auth successful, user ID:', data.user.id);
      
      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user profile:', userError.message);
        // Create minimal user
        const defaultUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: email.split('@')[0],
          role: 'contractor',
          is_verified: true
        } as User;
        
        setUser(defaultUser);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.session?.access_token || 'dummy-token');
        localStorage.setItem('user', JSON.stringify(defaultUser));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('auth.user', JSON.stringify(defaultUser));
        localStorage.setItem('auth.session', JSON.stringify(data.session));
      } else if (!userData) {
        console.warn('No profile found, creating minimal user object');
        const defaultUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: email.split('@')[0],
          role: 'contractor',
          is_verified: true
        } as User;
        
        setUser(defaultUser);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.session?.access_token || 'dummy-token');
        localStorage.setItem('user', JSON.stringify(defaultUser));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('auth.user', JSON.stringify(defaultUser));
        localStorage.setItem('auth.session', JSON.stringify(data.session));
      } else {
        console.log('User profile loaded:', userData.email);
        
        // Check verification
        if (!userData.is_verified) {
          console.warn('User not verified, updating verification status');
          // Try to auto-verify the user
          const { error: updateError } = await supabase
            .from('users')
            .update({ is_verified: true })
            .eq('id', userData.id);
            
          if (updateError) {
            console.error('Failed to auto-verify user:', updateError);
          } else {
            userData.is_verified = true;
            console.log('User auto-verified successfully');
          }
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.session?.access_token || 'dummy-token');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('auth.user', JSON.stringify(userData));
        localStorage.setItem('auth.session', JSON.stringify(data.session));
      }
      
      console.log('Login successful, user state set');
    } catch (err) {
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
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
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

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting signup with:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw new Error(error.message);
      
      if (!data?.user?.id) {
        throw new Error('No user data returned from signup');
      }
      
      console.log('Signup successful, user ID:', data.user.id);
      
      // Create user profile
      const userData = {
        id: data.user.id,
        email: data.user.email || email,
        name: name,
        role: 'contractor' as UserRole,
        is_verified: false
      } as User;
      
      // Insert user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert([userData]);
      
      if (insertError) {
        console.error('Error creating user profile:', insertError);
        // Continue anyway, we'll handle this in the login flow
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('token', data.session?.access_token || 'dummy-token');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('auth.user', JSON.stringify(userData));
      localStorage.setItem('auth.session', JSON.stringify(data.session));
      
      console.log('Signup completed successfully');
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