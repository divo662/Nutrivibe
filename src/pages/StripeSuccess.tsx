import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionService } from '@/services/subscriptionService';
import { useSubscription } from '@/contexts/SubscriptionContext';

const StripeSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshSubscription } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const planId = searchParams.get('plan_id');
        const userId = searchParams.get('user_id');

        if (!sessionId || !planId || !userId) {
          setErrorMessage('Missing required parameters from Stripe');
          setVerificationStatus('error');
          setIsVerifying(false);
          return;
        }

        // Verify the checkout session
        const result = await SubscriptionService.verifyCheckoutSession(sessionId);
        
        if (result.success) {
          setVerificationStatus('success');
          toast({
            title: "Subscription Activated! 🎉",
            description: `Welcome to ${result.planName}! Your subscription is now active.`,
          });
          // Refresh subscription so UI reflects Pro immediately
          await refreshSubscription();
        } else {
          setErrorMessage('Failed to activate subscription');
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        setVerificationStatus('error');
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [searchParams, toast]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying Your Subscription</CardTitle>
            <CardDescription>
              Please wait while we confirm your payment...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-muted-foreground">
              This may take a few moments
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Verification Failed</CardTitle>
            <CardDescription>
              We encountered an issue verifying your subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorMessage}
            </p>
            <div className="space-y-2">
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Welcome to Pro! 🎉</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You now have access to all Pro features including:
            </p>
            <ul className="text-sm text-left space-y-1">
              <li>• Unlimited AI meal plan generations</li>
              <li>• Advanced meal customization</li>
              <li>• Expanded recipe database</li>
              <li>• Priority customer support</li>
            </ul>
          </div>
          
          <Button onClick={handleGoToDashboard} className="w-full">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            You can manage your subscription from your dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeSuccess;
