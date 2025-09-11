import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, TestTube } from 'lucide-react';

const StripeTest = () => {
  const { upgradeToPro } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testStripeIntegration = async (planId: string) => {
    try {
      setIsLoading(true);
      
      toast({
        title: "Testing Stripe Integration",
        description: `Creating checkout session for ${planId}...`,
      });

      await upgradeToPro(planId);
      
      // If we reach here, the redirect should have happened
      toast({
        title: "Redirecting to Stripe",
        description: "You should be redirected to Stripe checkout now.",
      });
      
    } catch (error) {
      console.error('Stripe test error:', error);
      toast({
        title: "Stripe Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          Stripe Integration Test
        </CardTitle>
        <CardDescription>
          Test the Stripe checkout integration with test cards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Use these test card numbers in Stripe checkout:
          </p>
          <div className="space-y-1 text-xs font-mono bg-gray-100 p-2 rounded">
            <div>✅ Success: 4242 4242 4242 4242</div>
            <div>❌ Decline: 4000 0000 0000 0002</div>
            <div>🔐 3D Secure: 4000 0025 0000 3155</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => testStripeIntegration('pro_monthly')}
            disabled={isLoading}
            className="w-full"
            size="sm"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Test Monthly Pro
          </Button>
          <Button
            onClick={() => testStripeIntegration('pro_annual')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Test Annual Pro
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>💡 <strong>Note:</strong> This will redirect you to Stripe's test checkout page.</p>
          <p>🔒 <strong>Security:</strong> All payments are processed securely by Stripe.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeTest;
