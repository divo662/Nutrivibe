-- Migration: Fix ambiguous column references in increment_ai_usage function
-- Date: 2025-01-20

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.increment_ai_usage(UUID);

-- Recreate the function with proper table aliases to avoid ambiguous column references
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(UUID) TO authenticated;
