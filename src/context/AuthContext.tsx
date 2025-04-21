
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { DbProfile } from '@/lib/supabase';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'shopkeeper' | 'worker';
  shopId?: string;
  preferredLanguage?: string;
  photoURL?: string;
  avatar?: string;
};

export type LoginResult = {
  error?: {
    message: string;
  };
};

type AuthContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  preferredLanguage: string;
  setPreferredLanguage: (language: string) => void;
  login: (email: string, password: string) => Promise<LoginResult | undefined>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  shopName: string;
  setShopName: (name: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(() => {
    return localStorage.getItem('preferredLanguage') || 'en-US';
  });
  const [shopName, setShopName] = useState<string>(() => {
    return localStorage.getItem('shopName') || 'Apni Dukaan';
  });

  useEffect(() => {
    localStorage.setItem('preferredLanguage', preferredLanguage);
  }, [preferredLanguage]);

  useEffect(() => {
    localStorage.setItem('shopName', shopName);
  }, [shopName]);

  // Initialize auth and set up auth state listener
  useEffect(() => {
    setIsLoading(true);
    
    // First check for existing session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          await handleSession(session);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    getSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Creating a local variable to avoid race conditions
        let isSessionHandled = false;
        
        if (session) {
          isSessionHandled = true;
          await handleSession(session);
        } else if (!isSessionHandled) {
          // Only reset user if we haven't already handled this event
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session: Session) => {
    try {
      const userData = session.user;
      
      // Demo mode handling logic
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Create a demo user profile
        const demoProfile: UserProfile = {
          id: userData?.id || 'demo-user-id',
          name: 'Demo User',
          email: userData?.email || 'demo@example.com',
          role: 'shopkeeper',
          preferredLanguage
        };
        
        setUser(demoProfile);
        return;
      }
      
      // For demo/development, create a profile with user data
      const demoProfile: UserProfile = {
        id: userData?.id || 'demo-user-id',
        name: userData?.user_metadata?.name || userData?.email?.split('@')[0] || 'User',
        email: userData?.email || 'demo@example.com',
        role: 'shopkeeper',
        preferredLanguage: preferredLanguage
      };
      
      setUser(demoProfile);
      
      // Persist auth in localStorage to prevent automatic logouts
      localStorage.setItem('authUser', JSON.stringify({
        id: demoProfile.id,
        email: demoProfile.email,
        name: demoProfile.name
      }));
    } catch (error) {
      console.error('Session handling error:', error);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult | undefined> => {
    setIsLoading(true);
    try {
      // Handle demo mode login
      if (email === 'demo@example.com' && password === 'password') {
        // Create a demo user profile
        const demoProfile: UserProfile = {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'shopkeeper',
          preferredLanguage
        };
        
        setUser(demoProfile);
        
        // Store in localStorage to prevent logout
        localStorage.setItem('authUser', JSON.stringify({
          id: demoProfile.id,
          email: demoProfile.email,
          name: demoProfile.name
        }));
        
        return undefined;
      }
      
      // Normal Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error(error.message);
        return { error: { message: error.message } };
      }
      
      toast.success('Successfully logged in');
      return undefined;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return { error: { message: error.message || 'Login failed' } };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Account created successfully. Please check your email for verification link.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      // Clear local storage auth data
      localStorage.removeItem('authUser');
      
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const handleSetPreferredLanguage = async (language: string) => {
    setPreferredLanguage(language);
    
    if (user) {
      try {
        // In demo mode, we don't actually update the database
        console.log('Language preference updated to:', language);
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        preferredLanguage,
        setPreferredLanguage: handleSetPreferredLanguage,
        login,
        register,
        logout,
        shopName,
        setShopName
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
