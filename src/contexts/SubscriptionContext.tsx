import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionService, SubscriptionSummary, SubscriptionPlan } from '@/services/subscriptionService';
import { loadStripe } from '@stripe/stripe-js';

interface SubscriptionContextType {
  subscription: SubscriptionSummary | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  upgradeToPro: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  checkFeatureAccess: (featureName: string) => Promise<boolean>;
  incrementAIUsage: () => Promise<boolean>;
  getUsageStats: () => Promise<{
    dailyUsage: number;
    monthlyUsage: number;
    dailyLimit: number;
    monthlyLimit: number;
  }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Load subscription data when user changes
  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fix any new user usage bugs first
      await SubscriptionService.fixNewUserUsageBug();
      
      // Load plans and subscription data in parallel
      const [plansData, subscriptionData] = await Promise.all([
        SubscriptionService.getPlans(),
        SubscriptionService.getSubscriptionSummary()
      ]);

      setPlans(plansData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      
      // Set default free plan if there's an error
      const defaultSubscription = {
        plan: 'free' as const,
        status: 'active' as const,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        aiGenerationsRemaining: 3,
        aiGenerationsLimit: 3
      };
      
      setSubscription(defaultSubscription);
      
      // Also set default plans if plans failed to load
      if (!plans.length) {
        setPlans([
          {
            id: 'free',
            name: 'Free',
            price: 0,
            interval: 'month' as const,
            features: ['Basic features']
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced version of loadSubscriptionData to prevent rapid successive calls
  const debouncedLoadSubscriptionData = useCallback(
    debounce(loadSubscriptionData, 1000), // Wait 1 second between calls
    [user]
  );

  const refreshSubscription = async () => {
    if (!user) return;
    
    try {
      const subscriptionData = await SubscriptionService.getSubscriptionSummary();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  const upgradeToPro = async (planId: string) => {
    if (!user) return;

    try {
      const successUrl = `${window.location.origin}/stripe-success`;
      const cancelUrl = `${window.location.origin}/dashboard?upgrade=cancelled`;

      const { sessionId } = await SubscriptionService.createCheckoutSession({
        planId,
        successUrl,
        cancelUrl,
        customerEmail: user.email || ''
      });

      // Load Stripe and redirect to checkout
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error('Failed to load Stripe');
      }
    } catch (error) {
      console.error('Error upgrading to pro:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    try {
      await SubscriptionService.cancelSubscription();
      await refreshSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  };

  const reactivateSubscription = async () => {
    try {
      await SubscriptionService.reactivateSubscription();
      await refreshSubscription();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  };

  const checkFeatureAccess = async (featureName: string): Promise<boolean> => {
    try {
      return await SubscriptionService.checkFeatureAccess(featureName);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  const incrementAIUsage = async (): Promise<boolean> => {
    try {
      const success = await SubscriptionService.incrementAIUsage();
      if (success) {
        await refreshSubscription();
      }
      return success;
    } catch (error) {
      console.error('Error incrementing AI usage:', error);
      return false;
    }
  };

  const getUsageStats = async () => {
    try {
      return await SubscriptionService.getUsageStats();
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        dailyUsage: 0,
        monthlyUsage: 0,
        dailyLimit: 3,
        monthlyLimit: 90
      };
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    plans,
    loading,
    refreshSubscription,
    upgradeToPro,
    cancelSubscription,
    reactivateSubscription,
    checkFeatureAccess,
    incrementAIUsage,
    getUsageStats,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
