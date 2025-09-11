-- Fix new user usage bug
-- This migration fixes the issue where new users were created with 3 AI generations already "used"
-- Date: 2025-01-21

-- Fix existing users who have usage_ai_generations = 3 but no actual usage
-- This happens when users were created with the wrong default value
UPDATE public.profiles 
SET 
  usage_ai_generations = 0,
  usage_ai_generations_reset_date = CURRENT_DATE
WHERE 
  usage_ai_generations = 3 
  AND usage_ai_generations_reset_date IS NULL;

-- Also fix any users who have null reset dates but 0 usage (should be set to today)
UPDATE public.profiles 
SET 
  usage_ai_generations_reset_date = CURRENT_DATE
WHERE 
  usage_ai_generations_reset_date IS NULL 
  AND usage_ai_generations = 0;

-- Update the default value for new users to be 0 instead of 3
-- This ensures future users are created with 0 usage
ALTER TABLE public.profiles 
ALTER COLUMN usage_ai_generations SET DEFAULT 0;

-- Add a comment to document the fix
COMMENT ON COLUMN public.profiles.usage_ai_generations IS 'Daily AI generation usage count. Should start at 0 for new users.';
COMMENT ON COLUMN public.profiles.usage_ai_generations_reset_date IS 'Date when usage was last reset. Should be set to current date for new users.';
