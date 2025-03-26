
import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/ui-custom/LanguageSelector';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector 
          currentLanguage={language} 
          onLanguageChange={setLanguage}
        />
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('loginTitle')}</CardTitle>
          <CardDescription>
            {t('loginSubtitle')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email" 
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password')}</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full"
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
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full"
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
            
            <div className="text-center text-sm mt-4">
              <span>{t('noAccount')} </span>
              <Link to="/register" className="text-primary hover:underline">
                {t('registerNow')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
