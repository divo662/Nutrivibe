import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoaderCircle, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import heroFood from '@/assets/hero-food.jpg';

// Validation functions (hoisted to prevent recreation)
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  };
};

const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  const validation = validatePassword(password);
  const score = Object.values(validation).filter(Boolean).length - 1; // -1 for isValid
  
  if (score < 3) return 'weak';
  if (score < 5) return 'medium';
  return 'strong';
};

// Memoized PasswordInput component to prevent unnecessary re-renders
const PasswordInput = memo(({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  showPassword, 
  onToggleVisibility,
  error 
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: string;
}) => {
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "pr-10",
          error && "border-destructive focus-visible:ring-destructive"
        )}
        autoComplete={id.includes('signin') ? 'current-password' : 'new-password'}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={onToggleVisibility}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

// Memoized PasswordStrengthIndicator
const PasswordStrengthIndicator = memo(({ password }: { password: string }) => {
  if (!password) return null;
  
  const validation = validatePassword(password);
  const strength = getPasswordStrength(password);
  
  const strengthColors = {
    weak: 'bg-destructive',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  } as const;
  
  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong'
  } as const;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              strengthColors[strength]
            )}
            style={{ 
              width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%'
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {strengthLabels[strength]}
        </span>
      </div>
      
      <div className="space-y-1">
        {[
          { key: 'minLength', label: 'At least 8 characters' },
          { key: 'hasUpperCase', label: 'One uppercase letter' },
          { key: 'hasLowerCase', label: 'One lowercase letter' },
          { key: 'hasNumbers', label: 'One number' },
          { key: 'hasSpecialChar', label: 'One special character' }
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2 text-xs">
            {validation[key as keyof typeof validation] ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(
              validation[key as keyof typeof validation] 
                ? "text-green-600" 
                : "text-muted-foreground"
            )}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

// Memoized ErrorMessage
const ErrorMessage = memo(({ message }: { message?: string }) => {
  if (!message) return null;
  
  return (
    <div className="flex items-center space-x-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Form data states
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // UI states
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  // Error states
  const [signUpErrors, setSignUpErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [signInErrors, setSignInErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render auth form if user is already authenticated
  if (user) {
    return null;
  }

  // Validation handlers
  const validateSignUpForm = () => {
    const errors: typeof signUpErrors = {};
    
    // Full name validation
    if (!signUpData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (signUpData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    // Email validation
    if (!signUpData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(signUpData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    const passwordValidation = validatePassword(signUpData.password);
    if (!signUpData.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = 'Password does not meet requirements';
    }
    
    // Confirm password validation
    if (!signUpData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (signUpData.password !== signUpData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setSignUpErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignInForm = () => {
    const errors: typeof signInErrors = {};
    
    if (!signInData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(signInData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!signInData.password) {
      errors.password = 'Password is required';
    }
    
    setSignInErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handlers
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignUpForm()) {
      return;
    }
    
    setIsLoading(true);
    setSignUpErrors({});
    
    try {
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);
      if (error) {
        setSignUpErrors({ general: error.message || 'Failed to create account. Please try again.' });
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      setSignUpErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignInForm()) {
      return;
    }
    
    setIsLoading(true);
    setSignInErrors({});
    
    try {
      const { error } = await signIn(signInData.email, signInData.password);
      if (error) {
        setSignInErrors({ general: error.message || 'Invalid email or password' });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setSignInErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Create stable toggle functions
  const toggleSignInPassword = useCallback(() => setShowSignInPassword(prev => !prev), []);
  const toggleSignUpPassword = useCallback(() => setShowSignUpPassword(prev => !prev), []);
  const toggleSignUpConfirmPassword = useCallback(() => setShowSignUpConfirmPassword(prev => !prev), []);

  // Create stable change handlers for sign in
  const handleSignInEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignInData(prev => ({ ...prev, email: value }));
    if (signInErrors.email) {
      setSignInErrors(prev => ({ ...prev, email: undefined }));
    }
  }, [signInErrors.email]);

  const handleSignInPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignInData(prev => ({ ...prev, password: value }));
    if (signInErrors.password) {
      setSignInErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [signInErrors.password]);

  // Create stable change handlers for sign up
  const handleSignUpFullNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignUpData(prev => ({ ...prev, fullName: value }));
    if (signUpErrors.fullName) {
      setSignUpErrors(prev => ({ ...prev, fullName: undefined }));
    }
  }, [signUpErrors.fullName]);

  const handleSignUpEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignUpData(prev => ({ ...prev, email: value }));
    if (signUpErrors.email) {
      setSignUpErrors(prev => ({ ...prev, email: undefined }));
    }
  }, [signUpErrors.email]);

  const handleSignUpPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignUpData(prev => ({ ...prev, password: value }));
    if (signUpErrors.password) {
      setSignUpErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [signUpErrors.password]);

  const handleSignUpConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignUpData(prev => ({ ...prev, confirmPassword: value }));
    if (signUpErrors.confirmPassword) {
      setSignUpErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  }, [signUpErrors.confirmPassword]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Clear errors when switching tabs
    setSignUpErrors({});
    setSignInErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          {/* Left: Brand/Benefits */}
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-2xl border bg-white/60 backdrop-blur-md p-6 sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-transparent to-primary/5 pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 text-xs font-medium">
                  Eat well, live vibrant
                </div>
                <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-foreground">
                  Welcome to <span className="text-emerald-600">NutriVibe</span>
                </h1>
                <p className="text-muted-foreground max-w-prose">
                  Personalized Nigerian-inspired meal plans, recipes, and smart shopping lists, tailored to your goals and preferences.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600" /> AI-powered meal plans</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600" /> Local, budget-friendly shopping lists</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600" /> Culturally-aware nutrition guidance</li>
                </ul>
              </div>
              <img src={heroFood} alt="Healthy meals"
                   className="relative z-0 mt-6 aspect-[16/9] w-full rounded-xl object-cover ring-1 ring-emerald-200/60" />
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="order-1 lg:order-2">
            <Card className="w-full max-w-md ml-auto shadow-elegant border-0">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Sign in to continue
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your personalized meal planning companion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs 
                  value={activeTab} 
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                    <TabsTrigger 
                      value="signin" 
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="space-y-4">
                    {signInErrors.general && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <ErrorMessage message={signInErrors.general} />
                      </div>
                    )}
                    
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          required
                          value={signInData.email}
                          onChange={handleSignInEmailChange}
                          className={cn(
                            signInErrors.email && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="Enter your email"
                          autoComplete="email"
                        />
                        <ErrorMessage message={signInErrors.email} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <PasswordInput
                          id="signin-password"
                          value={signInData.password}
                          onChange={handleSignInPasswordChange}
                          placeholder="Enter your password"
                          showPassword={showSignInPassword}
                          onToggleVisibility={toggleSignInPassword}
                          error={signInErrors.password}
                        />
                        <ErrorMessage message={signInErrors.password} />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-medium py-2.5 transition-all duration-200" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-4">
                    {signUpErrors.general && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <ErrorMessage message={signUpErrors.general} />
                      </div>
                    )}
                    
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-fullname">Full Name</Label>
                        <Input
                          id="signup-fullname"
                          type="text"
                          required
                          value={signUpData.fullName}
                          onChange={handleSignUpFullNameChange}
                          className={cn(
                            signUpErrors.fullName && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="Enter your full name"
                          autoComplete="name"
                        />
                        <ErrorMessage message={signUpErrors.fullName} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          value={signUpData.email}
                          onChange={handleSignUpEmailChange}
                          className={cn(
                            signUpErrors.email && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="Enter your email"
                          autoComplete="email"
                        />
                        <ErrorMessage message={signUpErrors.email} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <PasswordInput
                          id="signup-password"
                          value={signUpData.password}
                          onChange={handleSignUpPasswordChange}
                          placeholder="Create a strong password"
                          showPassword={showSignUpPassword}
                          onToggleVisibility={toggleSignUpPassword}
                          error={signUpErrors.password}
                        />
                        <PasswordStrengthIndicator password={signUpData.password} />
                        <ErrorMessage message={signUpErrors.password} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                        <PasswordInput
                          id="signup-confirm"
                          value={signUpData.confirmPassword}
                          onChange={handleSignUpConfirmPasswordChange}
                          placeholder="Confirm your password"
                          showPassword={showSignUpConfirmPassword}
                          onToggleVisibility={toggleSignUpConfirmPassword}
                          error={signUpErrors.confirmPassword}
                        />
                        {signUpData.confirmPassword && signUpData.password === signUpData.confirmPassword && (
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <Check className="h-4 w-4" />
                            <span>Passwords match</span>
                          </div>
                        )}
                        <ErrorMessage message={signUpErrors.confirmPassword} />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-medium py-2.5 transition-all duration-200" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
                
                {/* Additional Info */}
                <div className="text-center space-y-2 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    By signing up, you agree to our{' '}
                    <a href="/legal/terms" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Need help?{' '}
                    <a href="/support" className="text-primary hover:underline">Contact Support</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;