-- Add AI usage tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro_monthly', 'pro_annual')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
ADD COLUMN IF NOT EXISTS usage_ai_generations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_ai_generations_reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month');

-- Create index for faster queries on subscription plan
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON public.profiles(subscription_plan);

-- Create index for faster queries on AI usage
CREATE INDEX IF NOT EXISTS idx_profiles_ai_usage ON public.profiles(usage_ai_generations);

-- Update existing profiles to have default values
UPDATE public.profiles 
SET 
  subscription_plan = COALESCE(subscription_plan, 'free'),
  subscription_status = COALESCE(subscription_status, 'active'),
  usage_ai_generations = COALESCE(usage_ai_generations, 0),
  usage_ai_generations_reset_date = COALESCE(usage_ai_generations_reset_date, NOW() + INTERVAL '1 month')
WHERE subscription_plan IS NULL 
   OR subscription_status IS NULL 
   OR usage_ai_generations IS NULL 
   OR usage_ai_generations_reset_date IS NULL;
