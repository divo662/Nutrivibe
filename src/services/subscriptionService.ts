import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in kobo (₦1 = 100 kobo)
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  savings?: number;
}

export interface CreateCheckoutSessionParams {
  planId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
}

export interface SubscriptionSummary {
  plan: 'free' | 'pro_monthly' | 'pro_annual';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  aiGenerationsRemaining: number;
  aiGenerationsLimit: number;
}

export class SubscriptionService {
  private static readonly STRIPE_API_URL = 'https://kkwuifmmnrvzyxduzxkw.supabase.co/functions/v1'; // Supabase Edge Functions

  // Get available subscription plans
  static async getPlans(): Promise<SubscriptionPlan[]> {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
          'Basic meal plans (3 meals/day)',
          'Limited recipe database (50 recipes)',
          'Basic calorie tracking',
          'Community access (view only)',
          'Basic grocery lists',
          '3 AI generations per day'
        ]
      },
      {
        id: 'pro_monthly',
        name: 'Pro Monthly',
        price: 250000, // ₦2,500 in kobo
        interval: 'month',
        features: [
          'Advanced meal plans with customization',
          'Full recipe database (500+ Nigerian & global)',
          'Smart grocery lists with market optimization',
          'Advanced progress analytics & trends',
          'Voice-activated meal suggestions',
          'Community forum posting & interaction',
          'Unlimited plan sharing',
          'Ad-free experience',
          'Offline mode for all content',
          'Priority AI processing',
          '20 AI generations per day',
          'Meal prep schedules',
          'Macro tracking & optimization'
        ],
        popular: true
      },
      {
        id: 'pro_annual',
        name: 'Pro Annual',
        price: 2500000, // ₦25,000 in kobo
        interval: 'year',
        features: [
          'Everything in Pro Monthly plan',
          '2 months free (₦5,000 savings)',
          'Priority customer support',
          'Early access to new features',
          'Advanced nutrition coaching tips',
          'Exclusive webinars & content',
          'Custom recipe development requests'
        ],
        savings: 500000 // ₦5,000 savings in kobo
      }
    ];
  }

  // Create Stripe checkout session
  static async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ sessionId: string }> {
    try {
      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.STRIPE_API_URL}/stripe-create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      return { sessionId: data.sessionId };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Verify Stripe checkout session and update database
  static async verifyCheckoutSession(sessionId: string): Promise<any> {
    try {
      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.STRIPE_API_URL}/stripe-verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify checkout session');
      }

      return response.json();
    } catch (error) {
      console.error('Error verifying checkout session:', error);
      throw error;
    }
  }

  // Get user's subscription summary
  static async getSubscriptionSummary(): Promise<SubscriptionSummary> {
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get subscription data from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        // Return default free plan if no profile exists
        return {
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          aiGenerationsRemaining: 3,
          aiGenerationsLimit: 3
        };
      }

      // Determine plan and limits based on subscription data
      const plan = profile.subscription_plan || 'free';
      const status = profile.subscription_status || 'active';
      
      // Set AI generation limits based on plan
      let dailyLimit = 3; // Free plan default
      let monthlyLimit = 90;
      
      if (plan === 'pro_monthly' || plan === 'pro_annual') {
        dailyLimit = 20; // Pro plan gets 20 per day
        monthlyLimit = 600; // 20 * 30 days
      }

      // Calculate remaining generations
      const currentUsage = profile.usage_ai_generations || 0;
      const resetDate = profile.usage_ai_generations_reset_date;
      
      // Check if we need to reset daily usage
      const today = new Date().toISOString().split('T')[0];
      let dailyUsage = 0;
      
      // Handle new users or users with null reset date
      if (!resetDate) {
        // New user or user without reset date - initialize with 0 usage
        dailyUsage = 0;
        await supabase
          .from('profiles')
          .update({ 
            usage_ai_generations: 0,
            usage_ai_generations_reset_date: today
          })
          .eq('user_id', session.user.id);
      } else if (resetDate === today) {
        // Same day, use current usage
        dailyUsage = currentUsage;
      } else {
        // New day, reset usage
        dailyUsage = 0;
        // Update the reset date
        await supabase
          .from('profiles')
          .update({ 
            usage_ai_generations: 0,
            usage_ai_generations_reset_date: today
          })
          .eq('user_id', session.user.id);
      }

      const aiGenerationsRemaining = Math.max(0, dailyLimit - dailyUsage);

      return {
        plan: plan as 'free' | 'pro_monthly' | 'pro_annual',
        status: status as 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing',
        currentPeriodStart: profile.current_period_start || new Date().toISOString(),
        currentPeriodEnd: profile.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trialEnd: profile.trial_end || undefined,
        cancelAtPeriodEnd: profile.cancel_at_period_end || false,
        aiGenerationsRemaining,
        aiGenerationsLimit: dailyLimit
      };
    } catch (error) {
      console.error('Error getting subscription summary:', error);
      
      // Return default free plan on error
      return {
        plan: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        aiGenerationsRemaining: 3,
        aiGenerationsLimit: 3
      };
    }
  }

  // Check if user has access to a specific feature
  static async checkFeatureAccess(featureName: string): Promise<boolean> {
    try {
      // For AI features, check usage limits instead of blocking entirely
      if (featureName.startsWith('ai_')) {
        const usageStats = await this.getUsageStats();
        
        // Free users get 3 AI generations per day
        if (usageStats.dailyUsage < usageStats.dailyLimit) {
          return true;
        }
        
        // Pro users get unlimited access
        const subscription = await this.getSubscriptionSummary();
        if (subscription.plan !== 'free') {
          return true;
        }
        
        return false;
      }
      
      // For non-AI features, use the database function
      const { data, error } = await supabase.rpc('check_feature_access', {
        feature_name: featureName
      });

      if (error) {
        throw error;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Fallback: allow access for free users to basic features
      return true;
    }
  }

  // Increment AI usage
  static async incrementAIUsage(): Promise<boolean> {
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get current usage from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('usage_ai_generations, usage_ai_generations_reset_date')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile for usage increment:', profileError);
        throw profileError;
      }

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Check if we need to reset daily usage
      const today = new Date().toISOString().split('T')[0];
      let currentUsage = 0;
      
      // Handle new users or users with null reset date
      if (!profile.usage_ai_generations_reset_date) {
        // New user or user without reset date - start with 1
        currentUsage = 1;
      } else if (profile.usage_ai_generations_reset_date === today) {
        // Same day, increment current usage
        currentUsage = (profile.usage_ai_generations || 0) + 1;
      } else {
        // New day, start with 1
        currentUsage = 1;
      }

      // Update the usage count and reset date
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          usage_ai_generations: currentUsage,
          usage_ai_generations_reset_date: today
        })
        .eq('user_id', session.user.id);

      if (updateError) {
        console.error('Error updating AI usage:', updateError);
        throw updateError;
      }

      console.log(`AI usage incremented to ${currentUsage} for user ${session.user.id}`);
      return true;
    } catch (error) {
      console.error('Error incrementing AI usage:', error);
      return false;
    }
  }

  // Get user's billing history
  static async getBillingHistory(): Promise<Tables<'billing_history'>[]> {
    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting billing history:', error);
      return [];
    }
  }

  // Cancel subscription
  static async cancelSubscription(): Promise<void> {
    try {
      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.STRIPE_API_URL}/stripe-cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  static async reactivateSubscription(): Promise<void> {
    try {
      const response = await fetch(`${this.STRIPE_API_URL}/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Update subscription (change plan)
  static async updateSubscription(newPlanId: string): Promise<void> {
    try {
      const response = await fetch(`${this.STRIPE_API_URL}/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: newPlanId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Get subscription usage statistics
  static async getUsageStats(): Promise<{
    dailyUsage: number;
    monthlyUsage: number;
    dailyLimit: number;
    monthlyLimit: number;
  }> {
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get usage data from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('usage_ai_generations, usage_ai_generations_reset_date, subscription_plan')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile for usage stats:', profileError);
        throw profileError;
      }

      if (!profile) {
        return {
          dailyUsage: 0,
          monthlyUsage: 0,
          dailyLimit: 3,
          monthlyLimit: 90
        };
      }

      // Determine limits based on subscription plan
      let dailyLimit = 3; // Free plan default
      let monthlyLimit = 90;
      
      if (profile.subscription_plan === 'pro_monthly' || profile.subscription_plan === 'pro_annual') {
        dailyLimit = 20; // Pro plan gets 20 per day
        monthlyLimit = 600; // 20 * 30 days
      }

      // Check if we need to reset daily usage
      const today = new Date().toISOString().split('T')[0];
      let dailyUsage = 0;
      
      // Handle new users or users with null reset date
      if (!profile.usage_ai_generations_reset_date) {
        // New user or user without reset date - initialize with 0 usage
        dailyUsage = 0;
        await supabase
          .from('profiles')
          .update({ 
            usage_ai_generations: 0,
            usage_ai_generations_reset_date: today
          })
          .eq('user_id', session.user.id);
      } else if (profile.usage_ai_generations_reset_date === today) {
        // Same day, use current usage
        dailyUsage = profile.usage_ai_generations || 0;
      } else {
        // New day, reset usage
        dailyUsage = 0;
        // Update the reset date and reset usage
        await supabase
          .from('profiles')
          .update({ 
            usage_ai_generations: 0,
            usage_ai_generations_reset_date: today
          })
          .eq('user_id', session.user.id);
      }

      // For monthly usage, we'll estimate based on daily usage
      // In a production system, you might want to track this more precisely
      const monthlyUsage = dailyUsage; // Simplified for now

      return {
        dailyUsage,
        monthlyUsage,
        dailyLimit,
        monthlyLimit
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        dailyUsage: 0,
        monthlyUsage: 0,
        dailyLimit: 3,
        monthlyLimit: 90
      };
    }
  }

  // Format price from kobo to naira
  static formatPrice(priceInKobo: number): string {
    const priceInNaira = priceInKobo / 100;
    return `₦${priceInNaira.toLocaleString()}`;
  }

  // Get plan name from plan ID
  static getPlanName(planId: string): string {
    switch (planId) {
      case 'free':
        return 'Free';
      case 'pro_monthly':
        return 'Pro Monthly';
      case 'pro_annual':
        return 'Pro Annual';
      default:
        return 'Unknown Plan';
    }
  }

  // Check if plan is pro
  static isProPlan(plan: string): boolean {
    return plan === 'pro_monthly' || plan === 'pro_annual';
  }

  // Fix usage for users affected by the new user bug
  static async fixNewUserUsageBug(): Promise<void> {
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Check if user has the bug (usage = 3 but no reset date or old reset date)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('usage_ai_generations, usage_ai_generations_reset_date')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Fix if user has 3 usage but no reset date (new user bug)
      if (profile.usage_ai_generations === 3 && !profile.usage_ai_generations_reset_date) {
        await supabase
          .from('profiles')
          .update({ 
            usage_ai_generations: 0,
            usage_ai_generations_reset_date: today
          })
          .eq('user_id', session.user.id);
        
        console.log('Fixed new user usage bug for user:', session.user.id);
      }
    } catch (error) {
      console.error('Error fixing new user usage bug:', error);
    }
  }
}
