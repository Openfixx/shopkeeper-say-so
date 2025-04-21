
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's an authentication flow returning from OAuth provider
    const checkAuthRedirect = async () => {
      try {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          setLoading(true);
          // Let auth provider handle the redirect
          // Supabase will handle this automatically
          toast.info('Completing authentication...');
        }
      } catch (error) {
        console.error('Error during OAuth redirect:', error);
        toast.error('Authentication failed.');
      } finally {
        setLoading(false);
      }
    };

    checkAuthRedirect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Login successful!');
        navigate('/');
      } else {
        await register(email, password);
        toast.success('Registration successful! You can now log in.');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // NOTE: We don't navigate here because we'll be redirected to the OAuth provider
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google authentication failed.');
      setGoogleLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Apni Dukaan
              </h1>
              <p className="text-muted-foreground mt-2">
                {isLogin ? 'Sign in to manage your inventory' : 'Create an account to get started'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-violet-100 focus:border-violet-500 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-violet-100 focus:border-violet-500 dark:border-gray-700"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : isLogin ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                    or continue with
                  </span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-violet-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-gray-800"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaGoogle className="mr-2 h-4 w-4 text-violet-600" />
                )}
                Google
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="font-semibold text-violet-600 hover:text-violet-500"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="font-semibold text-violet-600 hover:text-violet-500"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:underline">
                Continue without account
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
