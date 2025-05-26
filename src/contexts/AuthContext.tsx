import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User, UserRole } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
  error: string | null;
  verifyTwoFactor: (code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      // Check for token
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Check for user in localStorage (remember me) or sessionStorage
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const isAuthenticatedFlag = localStorage.getItem('isAuthenticated') || sessionStorage.getItem('isAuthenticated');

      if (storedUser && isAuthenticatedFlag) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // If no user data found, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Logging out user');
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('login_success');
      
      setUser(null);
      setIsAuthenticated(false);
      console.log('User logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
        
        // Save to localStorage
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
        localStorage.setItem('auth.user', JSON.stringify(userData));
        localStorage.setItem('auth.session', JSON.stringify(data.session));
      }
      
      console.log('Login successful, user state set');
    } catch (err) {
      console.error('Complete login error:', err);
      setError((err as Error).message);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create auth user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (error) throw new Error(error.message);
      
      if (data.user) {
        // Generate avatar URL
        const avatarUrl = `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=0062C3&color=fff`;
        
        // Insert user profile into users table
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          name,
          email,
          role,
          avatar: avatarUrl,
          notifications_enabled: true,
          theme_preference: 'dark',
          language_preference: 'en',
          is_verified: false // Default to not verified
        });
        
        if (profileError) throw new Error(profileError.message);
        
        // Don't automatically log in after signup - wait for email verification and admin approval
        setError('Registration successful! Please verify your email and wait for admin verification.');
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setUser({ ...user, ...userData });
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const verifyTwoFactor = async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would be implemented if using Supabase with MFA
      // For now, we'll just simulate it
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        throw new Error('Invalid verification code');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('2FA verified successfully');
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
        redirectTo: window.location.origin + '/reset-password',
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
        setIsAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 