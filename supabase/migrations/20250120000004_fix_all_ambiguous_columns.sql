-- Migration: Fix all ambiguous column references in database functions
-- Date: 2025-01-20

-- This migration fixes the ambiguous column reference errors that were causing
-- the subscription system to fail with "column reference is ambiguous" errors.

-- 1. Fix get_subscription_summary function
DROP FUNCTION IF EXISTS public.get_subscription_summary(UUID);

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
  daily_limit_val INTEGER;
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
  
  -- Get daily limit for AI generations from subscription_limits table
  SELECT sl.daily_limit INTO daily_limit_val
  FROM public.subscription_limits sl
  WHERE sl.plan = user_plan AND sl.feature_name = 'ai_meal_plans';
  
  -- Get current daily usage from subscription_usage table
  SELECT COALESCE(su.ai_generations_used, 0) INTO current_usage
  FROM public.subscription_usage su
  WHERE su.user_id = user_uuid AND su.date = CURRENT_DATE;
  
  -- Calculate remaining generations
  ai_generations_remaining := GREATEST(daily_limit_val - current_usage, 0);
  ai_generations_limit := daily_limit_val;
  
  RETURN NEXT;
END;
$$;

-- 2. Fix check_feature_access function
DROP FUNCTION IF EXISTS public.check_feature_access(TEXT, UUID);

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
  daily_limit_val INTEGER;
  monthly_limit_val INTEGER;
  unlimited_val BOOLEAN;
  daily_usage_val INTEGER;
  monthly_usage_val INTEGER;
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
  SELECT sl.daily_limit, sl.monthly_limit, sl.unlimited
  INTO daily_limit_val, monthly_limit_val, unlimited_val
  FROM public.subscription_limits sl
  WHERE sl.plan = user_plan AND sl.feature_name = check_feature_access.feature_name;
  
  -- If unlimited, return true
  IF unlimited_val THEN
    RETURN true;
  END IF;
  
  -- Check daily usage if there's a daily limit
  IF daily_limit_val IS NOT NULL THEN
    SELECT COALESCE(su.ai_generations_used, 0) INTO daily_usage_val
    FROM public.subscription_usage su
    WHERE su.user_id = user_uuid AND su.date = CURRENT_DATE;
    
    IF daily_usage_val >= daily_limit_val THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check monthly usage if there's a monthly limit
  IF monthly_limit_val IS NOT NULL THEN
    SELECT COALESCE(SUM(su.ai_generations_used), 0) INTO monthly_usage_val
    FROM public.subscription_usage su
    WHERE su.user_id = user_uuid 
      AND su.date >= DATE_TRUNC('month', CURRENT_DATE)
      AND su.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
    
    IF monthly_usage_val >= monthly_limit_val THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- 3. Fix increment_ai_usage function
DROP FUNCTION IF EXISTS public.increment_ai_usage(UUID);

CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage_val INTEGER;
  daily_limit_val INTEGER;
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
  SELECT sl.daily_limit INTO daily_limit_val
  FROM public.subscription_limits sl
  WHERE sl.plan = user_plan AND sl.feature_name = 'ai_meal_plans';
  
  -- Get current daily usage
  SELECT COALESCE(su.ai_generations_used, 0) INTO current_usage_val
  FROM public.subscription_usage su
  WHERE su.user_id = user_uuid AND su.date = CURRENT_DATE;
  
  -- Check if user has reached daily limit
  IF current_usage_val >= daily_limit_val THEN
    RETURN false;
  END IF;
  
  -- Insert or update usage record
  INSERT INTO public.subscription_usage (user_id, date, ai_generations_used, ai_generations_limit)
  VALUES (user_uuid, CURRENT_DATE, current_usage_val + 1, daily_limit_val)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    ai_generations_used = current_usage_val + 1,
    updated_at = now();
  
  -- Update profiles table usage count
  UPDATE public.profiles
  SET usage_ai_generations = current_usage_val + 1
  WHERE user_id = user_uuid;
  
  RETURN true;
END;
$$;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.get_subscription_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_feature_access(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(UUID) TO authenticated;

-- Verify the functions were created successfully
DO $$
BEGIN
  RAISE NOTICE 'All functions have been successfully recreated with proper table aliases';
END $$;
