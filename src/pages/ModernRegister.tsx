import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

const ModernRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    setLoading(true);
    try {
      await register(email, password);
      toast.success('Account created! Please check your email to verify your account');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      setLoading(false);
    }
  };

  if (isAuthenticated && !authLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-800 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Apni Dukaan</h1>
          <p className="text-gray-200">Start managing your inventory today</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full"
        >
          <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    {showPassword ? (
                      <EyeOff
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 cursor-pointer"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <Eye
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 cursor-pointer"
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  disabled={loading || authLoading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </div>

            <div className="p-6 pt-0 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 font-medium">
                  Login
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ModernRegister;
