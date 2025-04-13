
import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { language, t, setLanguage } = useLanguage();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('pleaseEnterCredentials'));
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result?.error) {
        toast.error(result.error.message);
      } else {
        toast.success(t('loginSuccessful'));
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Quick login for demo purposes
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await login('demo@example.com', 'password');
      
      if (result?.error) {
        toast.error(result.error.message);
      } else {
        toast.success(t('demoLoginSuccessful'));
        navigate('/');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error(error.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, redirect to home
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/" />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/30 to-background p-4">
      <motion.div 
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="mb-10 text-center"
          variants={itemVariants}
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Inventory Pro</h1>
          <p className="text-muted-foreground">Manage your inventory effortlessly</p>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="w-full shadow-lg border-0 bg-card/70 backdrop-blur-sm rounded-3xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">{t('loginTitle')}</CardTitle>
              <CardDescription>
                {t('loginSubtitle')}
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <motion.div 
                  className="space-y-2"
                  variants={itemVariants}
                >
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email" 
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl h-11"
                    required
                  />
                </motion.div>
                
                <motion.div 
                  className="space-y-2"
                  variants={itemVariants}
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('password')}</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl h-11"
                    required
                  />
                </motion.div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <motion.div 
                  className="w-full"
                  variants={itemVariants}
                >
                  <Button 
                    type="submit" 
                    className="w-full rounded-xl h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                    disabled={loading || authLoading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      t('loginButton')
                    )}
                  </Button>
                </motion.div>
                
                <motion.div 
                  className="w-full"
                  variants={itemVariants}
                >
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full rounded-xl h-11"
                    onClick={handleDemoLogin}
                    disabled={loading || authLoading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      t('demoLogin')
                    )}
                  </Button>
                </motion.div>
                
                <motion.div 
                  className="text-center text-sm mt-4"
                  variants={itemVariants}
                >
                  <span>{t('noAccount')} </span>
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    {t('registerNow')}
                  </Link>
                </motion.div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
