
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const handleAuth = async () => {
      try {
        toast.success('Successfully logged in!');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed.');
        navigate('/login', { replace: true });
      }
    };
    
    handleAuth();
  }, [navigate]);

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-800">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <h1 className="text-xl font-medium">Signing you in...</h1>
        <p className="mt-2">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
