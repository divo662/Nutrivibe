-- Migration: Fix ambiguous column reference in get_subscription_summary function
-- Date: 2025-01-20

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_subscription_summary(UUID);

-- Recreate the function with proper table aliases to avoid ambiguous column references
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_subscription_summary(UUID) TO authenticated;
