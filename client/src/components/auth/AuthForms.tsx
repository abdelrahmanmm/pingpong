import { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/use-toast';
import { apiRequest } from '../../lib/queryClient';

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthForms() {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Login form state
  const [loginValues, setLoginValues] = useState<LoginFormValues>({
    username: '',
    password: '',
  });
  
  // Registration form state
  const [registerValues, setRegisterValues] = useState<RegisterFormValues>({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  
  // Loading states
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  
  // Form errors
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  
  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErrors({});
    
    try {
      // Validate form values
      loginSchema.parse(loginValues);
      
      // Submit login request
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginValues),
      });
      
      if (response && response.user) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${response.user.username}!`,
        });
        
        // Redirect to game
        navigate('/');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setLoginErrors(formattedErrors);
      } else if (error instanceof Response) {
        // Handle API error responses
        const data = await error.json();
        toast({
          variant: "destructive",
          title: "Login failed",
          description: data.error || "Invalid username or password",
        });
      } else {
        // Handle other errors
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "An unexpected error occurred",
        });
      }
    } finally {
      setLoginLoading(false);
    }
  };
  
  // Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterErrors({});
    
    try {
      // Validate form values
      registerSchema.parse(registerValues);
      
      // Submit registration request
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerValues),
      });
      
      if (response && response.user) {
        toast({
          title: "Registration successful",
          description: `Welcome, ${response.user.username}!`,
        });
        
        // Redirect to game
        navigate('/');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setRegisterErrors(formattedErrors);
      } else if (error instanceof Response) {
        // Handle API error responses
        const data = await error.json();
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data.error || "Could not create account",
        });
      } else {
        // Handle other errors
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: "An unexpected error occurred",
        });
      }
    } finally {
      setRegisterLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        
        {/* Login Form */}
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input 
                  id="login-username"
                  type="text"
                  placeholder="Your username"
                  value={loginValues.username}
                  onChange={(e) => setLoginValues({...loginValues, username: e.target.value})}
                />
                {loginErrors.username && (
                  <p className="text-sm text-red-500">{loginErrors.username}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input 
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={loginValues.password}
                  onChange={(e) => setLoginValues({...loginValues, password: e.target.value})}
                />
                {loginErrors.password && (
                  <p className="text-sm text-red-500">{loginErrors.password}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        
        {/* Registration Form */}
        <TabsContent value="register">
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Register to save your game progress and compete on leaderboards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input 
                  id="register-username"
                  type="text"
                  placeholder="Choose a username"
                  value={registerValues.username}
                  onChange={(e) => setRegisterValues({...registerValues, username: e.target.value})}
                />
                {registerErrors.username && (
                  <p className="text-sm text-red-500">{registerErrors.username}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input 
                  id="register-email"
                  type="email"
                  placeholder="Your email address"
                  value={registerValues.email}
                  onChange={(e) => setRegisterValues({...registerValues, email: e.target.value})}
                />
                {registerErrors.email && (
                  <p className="text-sm text-red-500">{registerErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-display-name">Display Name (Optional)</Label>
                <Input 
                  id="register-display-name"
                  type="text"
                  placeholder="Public display name"
                  value={registerValues.displayName || ''}
                  onChange={(e) => setRegisterValues({...registerValues, displayName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input 
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerValues.password}
                  onChange={(e) => setRegisterValues({...registerValues, password: e.target.value})}
                />
                {registerErrors.password && (
                  <p className="text-sm text-red-500">{registerErrors.password}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={registerLoading}>
                {registerLoading ? "Creating Account..." : "Register"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}