
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

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { language, translations } = useLanguage();

  // Translation map for different languages
  const t = translations[language] || {};

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error(t.pleaseEnterAllFields || 'Please enter all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(t.passwordsDoNotMatch || 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error(t.passwordTooShort || 'Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(name, email, password);
      toast.success(t.registrationSuccessful || 'Registration successful. Please check your email for verification link.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || t.registrationFailed || 'Registration failed');
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
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t.registerTitle || 'Create an Account'}</CardTitle>
          <CardDescription>
            {t.registerSubtitle || 'Enter your details to create a new account'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name || 'Name'}</Label>
              <Input
                id="name"
                type="text" 
                placeholder={t.namePlaceholder || 'Enter your name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t.email || 'Email'}</Label>
              <Input
                id="email"
                type="email" 
                placeholder={t.emailPlaceholder || 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t.password || 'Password'}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.passwordPlaceholder || '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword || 'Confirm Password'}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t.confirmPasswordPlaceholder || '••••••••'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                t.registerButton || 'Register'
              )}
            </Button>
            
            <div className="text-center text-sm mt-4">
              <span>{t.alreadyHaveAccount || 'Already have an account?'} </span>
              <Link to="/login" className="text-primary hover:underline">
                {t.loginNow || 'Login now'}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
