-- Missing database tables for NutriVibe AI service
-- Run this to fix the database errors

-- Table for tracking AI generation usage
CREATE TABLE IF NOT EXISTS public.subscription_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing AI generation history
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    user_profile_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON public.subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_feature ON public.subscription_usage(feature);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_created_at ON public.subscription_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON public.ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_feature ON public.ai_generations(feature);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON public.ai_generations(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_usage
CREATE POLICY "Users can view their own subscription usage" ON public.subscription_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription usage" ON public.subscription_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription usage" ON public.subscription_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for ai_generations
CREATE POLICY "Users can view their own AI generations" ON public.ai_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI generations" ON public.ai_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON public.subscription_usage TO authenticated;
GRANT ALL ON public.ai_generations TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
