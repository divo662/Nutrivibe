-- Migration: Add subscription fields and tables
-- Date: 2025-01-20

-- 1. Create subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('free', 'pro_monthly', 'pro_annual');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');

-- 2. Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan subscription_plan DEFAULT 'free',
ADD COLUMN subscription_status subscription_status DEFAULT 'active',
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN usage_ai_generations INTEGER DEFAULT 3,
ADD COLUMN usage_ai_generations_reset_date DATE DEFAULT CURRENT_DATE;

-- 3. Create subscriptions table for detailed subscription tracking
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create subscription_usage table for tracking feature usage
CREATE TABLE public.subscription_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_generations_used INTEGER DEFAULT 0,
  ai_generations_limit INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 5. Create billing_history table for payment tracking
CREATE TABLE public.billing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in kobo (₦1 = 100 kobo)
  currency TEXT DEFAULT 'NGN',
  status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending'
  description TEXT,
  billing_reason TEXT, -- 'subscription_create', 'subscription_cycle', 'subscription_update'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create feature_flags table for managing feature access
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL UNIQUE,
  free_tier_enabled BOOLEAN DEFAULT false,
  pro_tier_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Insert default feature flags
INSERT INTO public.feature_flags (feature_name, free_tier_enabled, pro_tier_enabled, description) VALUES
('ai_meal_plans', true, true, 'AI-powered meal plan generation'),
('basic_recipes', true, true, 'Access to basic recipe database'),
('advanced_recipes', false, true, 'Access to full recipe database'),
('calorie_tracking', true, true, 'Basic calorie and nutrition tracking'),
('advanced_analytics', false, true, 'Detailed progress analytics and trends'),
('smart_grocery_lists', false, true, 'Market-optimized shopping lists'),
('voice_ai', false, true, 'Voice-activated meal suggestions'),
('community_forum', false, true, 'Full community interaction'),
('offline_mode', false, true, 'Offline content access'),
('meal_prep_schedules', false, true, 'Meal preparation planning'),
('macro_tracking', false, true, 'Detailed macronutrient tracking'),
('unlimited_sharing', false, true, 'Unlimited meal plan sharing'),
('priority_processing', false, true, 'Priority AI processing'),
('ad_free', false, true, 'Ad-free experience');

-- 8. Create subscription_limits table for plan-specific limits
CREATE TABLE public.subscription_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan subscription_plan NOT NULL,
  feature_name TEXT NOT NULL REFERENCES public.feature_flags(feature_name),
  daily_limit INTEGER,
  monthly_limit INTEGER,
  unlimited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan, feature_name)
);

-- 9. Insert subscription limits
INSERT INTO public.subscription_limits (plan, feature_name, daily_limit, monthly_limit, unlimited) VALUES
-- Free Plan
('free', 'ai_meal_plans', 3, 90, false),
('free', 'basic_recipes', NULL, 50, false),
('free', 'calorie_tracking', NULL, NULL, true),
('free', 'community_forum', NULL, NULL, false), -- view only

-- Pro Monthly
('pro_monthly', 'ai_meal_plans', 20, 600, false),
('pro_monthly', 'advanced_recipes', NULL, NULL, true),
('pro_monthly', 'advanced_analytics', NULL, NULL, true),
('pro_monthly', 'smart_grocery_lists', NULL, NULL, true),
('pro_monthly', 'voice_ai', NULL, NULL, true),
('pro_monthly', 'community_forum', NULL, NULL, true),
('pro_monthly', 'offline_mode', NULL, NULL, true),
('pro_monthly', 'meal_prep_schedules', NULL, NULL, true),
('pro_monthly', 'macro_tracking', NULL, NULL, true),
('pro_monthly', 'unlimited_sharing', NULL, NULL, true),
('pro_monthly', 'priority_processing', NULL, NULL, true),
('pro_monthly', 'ad_free', NULL, NULL, true),

-- Pro Annual
('pro_annual', 'ai_meal_plans', 20, 600, false),
('pro_annual', 'advanced_recipes', NULL, NULL, true),
('pro_annual', 'advanced_analytics', NULL, NULL, true),
('pro_annual', 'smart_grocery_lists', NULL, NULL, true),
('pro_annual', 'voice_ai', NULL, NULL, true),
('pro_annual', 'community_forum', NULL, NULL, true),
('pro_annual', 'offline_mode', NULL, NULL, true),
('pro_annual', 'meal_prep_schedules', NULL, NULL, true),
('pro_annual', 'macro_tracking', NULL, NULL, true),
('pro_annual', 'unlimited_sharing', NULL, NULL, true),
('pro_annual', 'priority_processing', NULL, NULL, true),
('pro_annual', 'ad_free', NULL, NULL, true);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 12. Create RLS policies for subscription_usage table
CREATE POLICY "Users can view their own usage" 
ON public.subscription_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
ON public.subscription_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
ON public.subscription_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 13. Create RLS policies for billing_history table
CREATE POLICY "Users can view their own billing history" 
ON public.billing_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing history" 
ON public.billing_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 14. Create RLS policies for feature_flags table (read-only for all users)
CREATE POLICY "Anyone can view feature flags" 
ON public.feature_flags 
FOR SELECT 
USING (true);

-- 15. Create RLS policies for subscription_limits table (read-only for all users)
CREATE POLICY "Anyone can view subscription limits" 
ON public.subscription_limits 
FOR SELECT 
USING (true);

-- 16. Create function to check feature access
CREATE OR REPLACE FUNCTION public.check_feature_access(
  feature_name TEXT,
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan subscription_plan;
  feature_enabled BOOLEAN;
  daily_limit INTEGER;
  monthly_limit INTEGER;
  unlimited BOOLEAN;
  daily_usage INTEGER;
  monthly_usage INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan INTO user_plan
  FROM public.profiles
  WHERE user_id = user_uuid;
  
  -- Default to free if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Check if feature is enabled for user's plan
  SELECT 
    CASE 
      WHEN user_plan = 'free' THEN free_tier_enabled
      ELSE pro_tier_enabled
    END INTO feature_enabled
  FROM public.feature_flags
  WHERE feature_name = check_feature_access.feature_name;
  
  -- If feature is not enabled, return false
  IF NOT feature_enabled THEN
    RETURN false;
  END IF;
  
  -- Get plan limits for the feature
  SELECT daily_limit, monthly_limit, unlimited
  INTO daily_limit, monthly_limit, unlimited
  FROM public.subscription_limits
  WHERE plan = user_plan AND feature_name = check_feature_access.feature_name;
  
  -- If unlimited, return true
  IF unlimited THEN
    RETURN true;
  END IF;
  
  -- Check daily usage if there's a daily limit
  IF daily_limit IS NOT NULL THEN
    SELECT COALESCE(ai_generations_used, 0) INTO daily_usage
    FROM public.subscription_usage
    WHERE user_id = user_uuid AND date = CURRENT_DATE;
    
    IF daily_usage >= daily_limit THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check monthly usage if there's a monthly limit
  IF monthly_limit IS NOT NULL THEN
    SELECT COALESCE(SUM(ai_generations_used), 0) INTO monthly_usage
    FROM public.subscription_usage
    WHERE user_id = user_uuid 
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
      AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
    
    IF monthly_usage >= monthly_limit THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- 17. Create function to increment AI usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER;
  daily_limit INTEGER;
  user_plan subscription_plan;
BEGIN
  -- Get user's plan
  SELECT subscription_plan INTO user_plan
  FROM public.profiles
  WHERE user_id = user_uuid;
  
  -- Default to free if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Get daily limit for AI generations
  SELECT daily_limit INTO daily_limit
  FROM public.subscription_limits
  WHERE plan = user_plan AND feature_name = 'ai_meal_plans';
  
  -- Get current daily usage
  SELECT COALESCE(ai_generations_used, 0) INTO current_usage
  FROM public.subscription_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  -- Check if user has reached daily limit
  IF current_usage >= daily_limit THEN
    RETURN false;
  END IF;
  
  -- Insert or update usage record
  INSERT INTO public.subscription_usage (user_id, date, ai_generations_used, ai_generations_limit)
  VALUES (user_uuid, CURRENT_DATE, current_usage + 1, daily_limit)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    ai_generations_used = current_usage + 1,
    updated_at = now();
  
  -- Update profiles table usage count
  UPDATE public.profiles
  SET usage_ai_generations = current_usage + 1
  WHERE user_id = user_uuid;
  
  RETURN true;
END;
$$;

-- 18. Create function to reset daily usage (runs at midnight)
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset AI generations usage for all users
  UPDATE public.profiles
  SET usage_ai_generations = 0
  WHERE subscription_plan = 'free';
  
  -- Update subscription_usage table
  UPDATE public.subscription_usage
  SET ai_generations_used = 0
  WHERE date = CURRENT_DATE;
END;
$$;

-- 19. Create function to get user's subscription summary
CREATE OR REPLACE FUNCTION public.get_subscription_summary(
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  plan subscription_plan,
  status subscription_status,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  ai_generations_remaining INTEGER,
  ai_generations_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan subscription_plan;
  daily_limit INTEGER;
  current_usage INTEGER;
BEGIN
  -- Get user's subscription details
  SELECT 
    p.subscription_plan,
    p.subscription_status,
    p.current_period_start,
    p.current_period_end,
    p.trial_end,
    p.cancel_at_period_end
  INTO user_plan, status, current_period_start, current_period_end, trial_end, cancel_at_period_end
  FROM public.profiles p
  WHERE p.user_id = user_uuid;
  
  -- Default to free if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
    status := 'active';
    current_period_start := now();
    current_period_end := now() + INTERVAL '1 month';
    trial_end := NULL;
    cancel_at_period_end := false;
  END IF;
  
  -- Get daily limit for AI generations
  SELECT daily_limit INTO daily_limit
  FROM public.subscription_limits
  WHERE plan = user_plan AND feature_name = 'ai_meal_plans';
  
  -- Get current daily usage
  SELECT COALESCE(ai_generations_used, 0) INTO current_usage
  FROM public.subscription_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  -- Calculate remaining generations
  ai_generations_remaining := GREATEST(daily_limit - current_usage, 0);
  ai_generations_limit := daily_limit;
  
  RETURN NEXT;
END;
$$;

-- 20. Create indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_usage_user_date ON public.subscription_usage(user_id, date);
CREATE INDEX idx_billing_history_user_id ON public.billing_history(user_id);
CREATE INDEX idx_profiles_subscription_plan ON public.profiles(subscription_plan);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- 21. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON public.subscription_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 22. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscription_usage TO authenticated;
GRANT ALL ON public.billing_history TO authenticated;
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT SELECT ON public.subscription_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_feature_access(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_summary(UUID) TO authenticated;

-- 23. Update existing profiles to have default subscription values
UPDATE public.profiles 
SET 
  subscription_plan = 'free',
  subscription_status = 'active',
  usage_ai_generations = 0,
  usage_ai_generations_reset_date = CURRENT_DATE
WHERE subscription_plan IS NULL;

-- 24. Insert default usage records for existing users
INSERT INTO public.subscription_usage (user_id, date, ai_generations_used, ai_generations_limit)
SELECT 
  user_id,
  CURRENT_DATE,
  0,
  3
FROM public.profiles
WHERE user_id NOT IN (
  SELECT user_id FROM public.subscription_usage WHERE date = CURRENT_DATE
);
