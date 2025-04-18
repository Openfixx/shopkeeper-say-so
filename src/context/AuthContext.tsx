
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(() => {
    return localStorage.getItem('preferredLanguage') || 'en-US';
  });

  useEffect(() => {
    localStorage.setItem('preferredLanguage', preferredLanguage);
  }, [preferredLanguage]);

  useEffect(() => {
    setIsLoading(true);
    
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
        return;
      }
      
      if (session) {
        await handleSession(session);
      } else {
        setIsLoading(false);
      }
    };
    
    getSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await handleSession(session);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session: Session) => {
    try {
      const userData = session.user;
      
      // Check if we're in demo mode
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
        setIsLoading(false);
        return;
      }
      
      // In demo mode, handle profile differently to avoid trying to access non-existent tables
      // We'll mock the profiles functionality
      const demoProfile: UserProfile = {
        id: userData?.id || 'demo-user-id',
        name: userData?.user_metadata?.name || userData?.email?.split('@')[0] || 'User',
        email: userData?.email || 'demo@example.com',
        role: 'shopkeeper',
        preferredLanguage: preferredLanguage
      };
      
      setUser(demoProfile);
      
      /* Note: In production, you would do this instead:
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }
      
      if (!profileData) {
        const newProfile = {
          id: userData.id,
          name: userData.user_metadata.name || userData.email?.split('@')[0] || 'User',
          email: userData.email || '',
          role: 'shopkeeper' as const,
          preferredLanguage: preferredLanguage
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);
          
        if (insertError) {
          console.error('Error creating user profile:', insertError);
          throw insertError;
        }
        
        setUser(newProfile);
      } else {
        setUser({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role,
          shopId: profileData.shop_id,
          preferredLanguage: profileData.preferred_language || preferredLanguage
        });
        
        if (profileData.preferred_language) {
          setPreferredLanguage(profileData.preferred_language);
        }
      }
      */
    } catch (error) {
      console.error('Session handling error:', error);
    } finally {
      setIsLoading(false);
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
        setIsLoading(false);
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
        
        /* In production mode, you would do:
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: language })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating language preference:', error);
        }
        */
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
        logout
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
