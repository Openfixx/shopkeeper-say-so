
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ShopNicheSelector from '@/components/ui-custom/ShopNicheSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [isNicheSelectorOpen, setIsNicheSelectorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is already authenticated and redirect appropriately
  useEffect(() => {
    if (isAuthenticated) {
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
    setError(null);
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoginInProgress(true);
    try {
      // For demo purposes
      if (email === 'demo@example.com' && password === 'password') {
        const result = await login(email, password);
        toast.success('Login successful! Welcome to Inventory Pro.');
        
        // Check if shop niche is set, if not open the selector
        const hasSetNiche = localStorage.getItem('shop_niche');
        if (!hasSetNiche) {
          setIsNicheSelectorOpen(true);
        } else {
          navigate('/');
        }
      } else {
        const result = await login(email, password);
        
        if (result && result.error) {
          setError(result.error.message);
          toast.error(result.error.message);
        } else {
          toast.success('Login successful! Welcome to Inventory Pro.');
          
          // Check if shop niche is set, if not open the selector
          const hasSetNiche = localStorage.getItem('shop_niche');
          if (!hasSetNiche) {
            setIsNicheSelectorOpen(true);
          } else {
            navigate('/');
          }
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials and try again.');
      toast.error('Login failed. Please check your credentials and try again.');
    } finally {
      setLoginInProgress(false);
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
            <Alert className="bg-blue-50 text-blue-700 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use <strong>demo@example.com</strong> and password <strong>password</strong> for demo access
              </AlertDescription>
            </Alert>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          
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
              disabled={loginInProgress || isLoading}
            >
              {loginInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
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
