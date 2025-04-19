
import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Phone, ArrowRight } from 'lucide-react';

const EnhancedLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result?.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Login successful');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationCode = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    // In a real app, we would integrate with an SMS service
    toast.success(`Verification code sent to ${phoneNumber}`);
    setCodeSent(true);
  };

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }
    
    // In a real app, we would verify the code with our backend
    toast.success('Login successful');
    // For demo purposes
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleGoogleLogin = () => {
    // In a real app, we would integrate with Google OAuth
    toast.success('Google login initiated');
    // For demo purposes
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await login('demo@example.com', 'password');
      
      if (result?.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Demo login successful');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, redirect to home
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Inventory Pro</h1>
          <p className="text-gray-400">Manage your inventory effortlessly</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full"
        >
          <Card className="w-full bg-zinc-900 border-zinc-800 text-white rounded-3xl shadow-xl overflow-hidden">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid grid-cols-2 bg-zinc-800 p-1 rounded-xl m-4">
                <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-violet-600">
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="rounded-lg data-[state=active]:bg-violet-600">
                  Phone
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="p-6">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-400">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-400">Password</Label>
                      <Link to="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      {showPassword ? 
                        <EyeOff 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 cursor-pointer" 
                          onClick={() => setShowPassword(false)}
                        /> : 
                        <Eye 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 cursor-pointer" 
                          onClick={() => setShowPassword(true)}
                        />
                      }
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full rounded-xl h-12 bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={loading || authLoading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center">
                        Login <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-zinc-900 text-gray-400">OR</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full rounded-xl h-12 bg-transparent border border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    Continue with Google
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full rounded-xl h-12 bg-transparent border border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={handleDemoLogin}
                  >
                    Try Demo Account
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="phone" className="p-6">
                {!codeSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-400">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      className="w-full rounded-xl h-12 bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={handleSendVerificationCode}
                    >
                      Send Verification Code
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handlePhoneLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verification-code" className="text-gray-400">Verification Code</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="Enter verification code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 rounded-xl"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full rounded-xl h-12 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      Verify & Login
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="link" 
                      className="w-full text-violet-400 hover:text-violet-300"
                      onClick={() => setCodeSent(false)}
                    >
                      Change Phone Number
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="p-6 pt-0 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EnhancedLogin;
