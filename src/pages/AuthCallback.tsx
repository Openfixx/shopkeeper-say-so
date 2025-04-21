
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, session, loading } = useAuth();
  
  useEffect(() => {
    const handleAuth = async () => {
      try {
        if (user && session) {
          toast.success('Successfully logged in!');
          navigate('/', { replace: true });
        } else if (!loading && !user) {
          console.log('No user detected in callback');
          toast.error('Authentication failed.');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed.');
        navigate('/login', { replace: true });
      }
    };
    
    if (!loading) {
      handleAuth();
    }
  }, [navigate, user, session, loading]);

  // Show loading for a brief period, then navigate
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-50 dark:from-violet-950 dark:to-indigo-950">
      <div className="text-center">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mb-4" />
        </div>
        <h1 className="text-2xl font-bold text-violet-900 dark:text-violet-300">Signing you in...</h1>
        <p className="mt-2 text-violet-700 dark:text-violet-400">
          Please wait while we complete the authentication process.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
