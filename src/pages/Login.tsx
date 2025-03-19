
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ShopNicheSelector from '@/components/ui-custom/ShopNicheSelector';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNicheSelectorOpen, setIsNicheSelectorOpen] = useState(false);
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      // Check if shop niche is set
      const hasSetNiche = localStorage.getItem('shop_niche');
      if (!hasSetNiche) {
        setIsNicheSelectorOpen(true);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      // Show niche selector after successful login
      setIsNicheSelectorOpen(true);
    } catch (error) {
      toast.error('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNicheSelection = (niche: string) => {
    localStorage.setItem('shop_niche', niche);
    toast.success(`Welcome to Inventory Pro for ${niche}!`);
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="rounded border-gray-300"
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link 
                to="/register"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <ShopNicheSelector 
        open={isNicheSelectorOpen} 
        onOpenChange={setIsNicheSelectorOpen}
        onSelect={handleNicheSelection}
      />
    </div>
  );
};

export default Login;
