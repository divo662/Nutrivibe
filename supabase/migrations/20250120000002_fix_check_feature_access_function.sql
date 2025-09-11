-- Migration: Fix ambiguous column references in check_feature_access function
-- Date: 2025-01-20

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.check_feature_access(TEXT, UUID);

-- Recreate the function with proper table aliases to avoid ambiguous column references
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_feature_access(TEXT, UUID) TO authenticated;
