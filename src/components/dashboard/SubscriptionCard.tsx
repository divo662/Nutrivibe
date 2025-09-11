import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionService } from '@/services/subscriptionService';
import { Crown, Zap, Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SubscriptionCard = () => {
  const { subscription, plans, upgradeToPro, cancelSubscription, reactivateSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!subscription) {
    return null;
  }

  const currentPlan = plans.find(plan => plan.id === subscription.plan);
  const isProPlan = SubscriptionService.isProPlan(subscription.plan);
  const isTrial = subscription.status === 'trialing';
  const isCanceled = subscription.cancelAtPeriodEnd || subscription.status === 'canceled';

  const handleUpgrade = async (planId: string) => {
    try {
      setIsLoading(true);
      await upgradeToPro(planId);
    } catch (error) {
      toast({
        title: "Upgrade failed",
        description: "There was an error processing your upgrade. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await cancelSubscription();
      toast({
        title: "Subscription canceled",
        description: "Your subscription will end at the current billing period.",
      });
    } catch (error) {
      toast({
        title: "Cancel failed",
        description: "There was an error canceling your subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setIsLoading(true);
      await reactivateSubscription();
      toast({
        title: "Subscription reactivated",
        description: "Your subscription has been reactivated successfully.",
      });
    } catch (error) {
      toast({
        title: "Reactivation failed",
        description: "There was an error reactivating your subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled':
      case 'past_due':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'trialing':
        return <Zap className="h-4 w-4" />;
      case 'canceled':
      case 'past_due':
      case 'unpaid':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const aiUsagePercentage = (subscription.aiGenerationsRemaining / subscription.aiGenerationsLimit) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProPlan ? (
              <Crown className="h-5 w-5 text-yellow-600" />
            ) : (
              <Zap className="h-5 w-5 text-blue-600" />
            )}
            <CardTitle className="text-lg">
              {currentPlan?.name || 'Free Plan'}
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={getStatusColor(subscription.status)}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon(subscription.status)}
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </div>
          </Badge>
        </div>
        <CardDescription>
          {isProPlan 
            ? 'You have access to all premium features'
            : 'Upgrade to unlock premium features and unlimited AI generations'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Generations Today</span>
            <span className="font-medium">
              {subscription.aiGenerationsRemaining} / {subscription.aiGenerationsLimit}
            </span>
          </div>
          <Progress value={aiUsagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {subscription.aiGenerationsRemaining > 0 
              ? `${subscription.aiGenerationsRemaining} generations remaining today`
              : 'Daily limit reached. Upgrade to Pro for more generations!'
            }
          </p>
        </div>

        {/* Subscription Details */}
        {isProPlan && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Period</span>
              <span>{formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}</span>
            </div>
            {subscription.trialEnd && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trial Ends</span>
                <span>{formatDate(subscription.trialEnd)}</span>
              </div>
            )}
            {isCanceled && (
              <div className="flex items-center justify-between text-orange-600">
                <span>Access Until</span>
                <span>{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isProPlan ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleUpgrade('pro_monthly')}
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? 'Processing...' : 'Upgrade to Pro'}
              </Button>
              <Button
                onClick={() => handleUpgrade('pro_annual')}
                disabled={isLoading}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {isLoading ? 'Processing...' : 'Annual (Save ₦5,000)'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {isCanceled ? (
                <Button
                  onClick={handleReactivate}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? 'Processing...' : 'Reactivate Subscription'}
                </Button>
              ) : (
                <Button
                  onClick={handleCancel}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? 'Processing...' : 'Cancel Subscription'}
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => window.open('/billing', '_blank')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          )}
        </div>

        {/* Feature Access Summary */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Your Plan Includes:</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>AI Meal Plans</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Recipe Database</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Calorie Tracking</span>
            </div>
            {isProPlan ? (
              <>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Voice AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Offline Mode</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Upgrade for more features</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
