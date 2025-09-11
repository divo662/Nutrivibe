-- Database Restructuring Script for NutriVibe Naija
-- This script will restructure the database for better organization and functionality

-- 1. Drop existing tables that are not needed or have wrong structure
DROP TABLE IF EXISTS subscription_usage CASCADE;
DROP TABLE IF EXISTS ai_generations CASCADE;

-- 2. Update the profiles table to ensure all subscription fields are properly set
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS usage_ai_generations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_ai_generations_reset_date DATE DEFAULT CURRENT_DATE;

-- 3. Create a proper subscriptions table for tracking subscription history
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    plan subscription_plan NOT NULL,
    status subscription_status NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create a proper billing_history table
CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL, -- Amount in kobo (₦1 = 100 kobo)
    currency TEXT DEFAULT 'ngn',
    status TEXT NOT NULL,
    description TEXT,
    billing_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create a proper feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT UNIQUE NOT NULL,
    free_tier_enabled BOOLEAN DEFAULT FALSE,
    pro_tier_enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create a proper subscription_limits table
CREATE TABLE IF NOT EXISTS subscription_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan subscription_plan NOT NULL,
    feature_name TEXT NOT NULL REFERENCES feature_flags(feature_name),
    daily_limit INTEGER,
    monthly_limit INTEGER,
    unlimited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ensure meal_plans table has proper structure
ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS plan_date DATE,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS estimated_calories INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 7.1. Create meals table for individual meal storage
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    meal_order INTEGER NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    name TEXT NOT NULL,
    description TEXT,
    calories INTEGER DEFAULT 0,
    protein NUMERIC(5,2) DEFAULT 0,
    carbs NUMERIC(5,2) DEFAULT 0,
    fat NUMERIC(5,2) DEFAULT 0,
    fiber NUMERIC(5,2) DEFAULT 0,
    prep_time INTEGER DEFAULT 0,
    cooking_time INTEGER DEFAULT 0,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    ingredients JSONB DEFAULT '[]',
    instructions JSONB DEFAULT '[]',
    nutritional_notes TEXT,
    cultural_context TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2. Create meal_plan_items table as alternative (if meals table is too complex)
CREATE TABLE IF NOT EXISTS meal_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    meal_type TEXT NOT NULL,
    meal_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ensure recipes table has proper structure
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 9. Ensure shopping_lists table has proper structure
ALTER TABLE shopping_lists 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 10. Ensure shopping_list_items table has proper structure
ALTER TABLE shopping_list_items 
ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS quantity TEXT,
ADD COLUMN IF NOT EXISTS checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 11. Ensure tasks table has proper structure
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS ingredients_summary TEXT,
ADD COLUMN IF NOT EXISTS time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'to_do' CHECK (state IN ('to_do', 'in_progress', 'cancelled', 'done')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 12. Ensure sticky_notes table has proper structure
ALTER TABLE sticky_notes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS content TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS sort_order INTEGER,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 13. Insert default feature flags
INSERT INTO feature_flags (feature_name, free_tier_enabled, pro_tier_enabled, description) VALUES
('ai_meal_plans', TRUE, TRUE, 'AI-powered meal plan generation'),
('ai_recipes', TRUE, TRUE, 'AI-powered recipe generation'),
('ai_shopping_lists', TRUE, TRUE, 'AI-powered shopping list generation'),
('advanced_analytics', FALSE, TRUE, 'Advanced nutrition analytics'),
('voice_features', FALSE, TRUE, 'Voice-activated meal suggestions'),
('offline_mode', FALSE, TRUE, 'Offline access to content'),
('priority_support', FALSE, TRUE, 'Priority customer support'),
('custom_recipe_development', FALSE, TRUE, 'Custom recipe development requests')
ON CONFLICT (feature_name) DO NOTHING;

-- 14. Insert default subscription limits
INSERT INTO subscription_limits (plan, feature_name, daily_limit, monthly_limit, unlimited) VALUES
('free', 'ai_meal_plans', 3, 90, FALSE),
('free', 'ai_recipes', 3, 90, FALSE),
('free', 'ai_shopping_lists', 3, 90, FALSE),
('free', 'advanced_analytics', 0, 0, FALSE),
('free', 'voice_features', 0, 0, FALSE),
('free', 'offline_mode', 0, 0, FALSE),
('free', 'priority_support', 0, 0, FALSE),
('free', 'custom_recipe_development', 0, 0, FALSE),
('pro_monthly', 'ai_meal_plans', 20, 600, FALSE),
('pro_monthly', 'ai_recipes', 20, 600, FALSE),
('pro_monthly', 'ai_shopping_lists', 20, 600, FALSE),
('pro_monthly', 'advanced_analytics', NULL, NULL, TRUE),
('pro_monthly', 'voice_features', NULL, NULL, TRUE),
('pro_monthly', 'offline_mode', NULL, NULL, TRUE),
('pro_monthly', 'priority_support', NULL, NULL, TRUE),
('pro_monthly', 'custom_recipe_development', NULL, NULL, TRUE),
('pro_annual', 'ai_meal_plans', 20, 600, FALSE),
('pro_annual', 'ai_recipes', 20, 600, FALSE),
('pro_annual', 'ai_shopping_lists', 20, 600, FALSE),
('pro_annual', 'advanced_analytics', NULL, NULL, TRUE),
('pro_annual', 'voice_features', NULL, NULL, TRUE),
('pro_annual', 'offline_mode', NULL, NULL, TRUE),
('pro_annual', 'priority_support', NULL, NULL, TRUE),
('pro_annual', 'custom_recipe_development', NULL, NULL, TRUE)
ON CONFLICT (plan, feature_name) DO NOTHING;

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_meal_plan_id ON meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_day_number ON meals(day_number);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_user_id ON sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);

-- 16. Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- 17. Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 18. Create RLS policies for meal_plans
CREATE POLICY "Users can view own meal plans" ON meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON meal_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- 18.1. Create RLS policies for meals
CREATE POLICY "Users can view own meals" ON meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON meals
    FOR DELETE USING (auth.uid() = user_id);

-- 18.2. Create RLS policies for meal_plan_items
CREATE POLICY "Users can view own meal plan items" ON meal_plan_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plan items" ON meal_plan_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plan items" ON meal_plan_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plan items" ON meal_plan_items
    FOR DELETE USING (auth.uid() = user_id);

-- 19. Create RLS policies for recipes
CREATE POLICY "Users can view own recipes" ON recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- 20. Create RLS policies for shopping_lists
CREATE POLICY "Users can view own shopping lists" ON shopping_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping lists" ON shopping_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists" ON shopping_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists" ON shopping_lists
    FOR DELETE USING (auth.uid() = user_id);

-- 21. Create RLS policies for shopping_list_items
CREATE POLICY "Users can view own shopping list items" ON shopping_list_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping list items" ON shopping_list_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping list items" ON shopping_list_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping list items" ON shopping_list_items
    FOR DELETE USING (auth.uid() = user_id);

-- 22. Create RLS policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 23. Create RLS policies for sticky_notes
CREATE POLICY "Users can view own sticky notes" ON sticky_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sticky notes" ON sticky_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sticky notes" ON sticky_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sticky notes" ON sticky_notes
    FOR DELETE USING (auth.uid() = user_id);

-- 24. Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 25. Create RLS policies for billing_history
CREATE POLICY "Users can view own billing history" ON billing_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing history" ON billing_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 26. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 27. Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at BEFORE UPDATE ON shopping_list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sticky_notes_updated_at BEFORE UPDATE ON sticky_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 28. Create function to sync subscription data from profiles to subscriptions table
CREATE OR REPLACE FUNCTION sync_subscription_data()
RETURNS TRIGGER AS $$
BEGIN
    -- If subscription data exists in profiles, sync it to subscriptions table
    IF NEW.stripe_subscription_id IS NOT NULL AND NEW.subscription_plan IS NOT NULL THEN
        INSERT INTO subscriptions (
            user_id,
            stripe_subscription_id,
            stripe_customer_id,
            plan,
            status,
            current_period_start,
            current_period_end,
            trial_end,
            cancel_at_period_end,
            canceled_at
        ) VALUES (
            NEW.user_id,
            NEW.stripe_subscription_id,
            NEW.stripe_customer_id,
            NEW.subscription_plan,
            NEW.subscription_status,
            NEW.current_period_start,
            NEW.current_period_end,
            NEW.trial_end,
            NEW.cancel_at_period_end,
            NEW.canceled_at
        )
        ON CONFLICT (stripe_subscription_id) DO UPDATE SET
            plan = EXCLUDED.plan,
            status = EXCLUDED.status,
            current_period_start = EXCLUDED.current_period_start,
            current_period_end = EXCLUDED.current_period_end,
            trial_end = EXCLUDED.trial_end,
            cancel_at_period_end = EXCLUDED.cancel_at_period_end,
            canceled_at = EXCLUDED.canceled_at,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 29. Create trigger to sync subscription data
CREATE TRIGGER sync_subscription_data_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION sync_subscription_data();

-- 30. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 31. Create a view for easy subscription summary access
CREATE OR REPLACE VIEW subscription_summary_view AS
SELECT 
    p.user_id,
    p.subscription_plan as plan,
    p.subscription_status as status,
    p.current_period_start,
    p.current_period_end,
    p.trial_end,
    p.cancel_at_period_end,
    p.canceled_at,
    p.usage_ai_generations,
    p.usage_ai_generations_reset_date,
    CASE 
        WHEN p.subscription_plan IN ('pro_monthly', 'pro_annual') THEN 20
        ELSE 3
    END as daily_ai_limit,
    CASE 
        WHEN p.subscription_plan IN ('pro_monthly', 'pro_annual') THEN 20 - COALESCE(p.usage_ai_generations, 0)
        ELSE 3 - COALESCE(p.usage_ai_generations, 0)
    END as ai_generations_remaining
FROM profiles p;

-- 32. Grant access to the view
GRANT SELECT ON subscription_summary_view TO authenticated;

-- 33. Create a function to get subscription summary (replaces the missing RPC)
CREATE OR REPLACE FUNCTION get_subscription_summary()
RETURNS TABLE (
    plan subscription_plan,
    status subscription_status,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN,
    ai_generations_remaining INTEGER,
    ai_generations_limit INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ssv.plan,
        ssv.status,
        ssv.current_period_start,
        ssv.current_period_end,
        ssv.trial_end,
        ssv.cancel_at_period_end,
        GREATEST(0, ssv.ai_generations_remaining) as ai_generations_remaining,
        ssv.daily_ai_limit as ai_generations_limit
    FROM subscription_summary_view ssv
    WHERE ssv.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 34. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_subscription_summary() TO authenticated;

-- 35. Create a function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan subscription_plan;
    feature_enabled BOOLEAN;
BEGIN
    -- Get user's subscription plan
    SELECT subscription_plan INTO user_plan
    FROM profiles
    WHERE user_id = auth.uid();
    
    -- Check if feature is enabled for user's plan
    SELECT 
        CASE 
            WHEN user_plan = 'free' THEN free_tier_enabled
            WHEN user_plan IN ('pro_monthly', 'pro_annual') THEN pro_tier_enabled
            ELSE FALSE
        END INTO feature_enabled
    FROM feature_flags
    WHERE feature_name = check_feature_access.feature_name;
    
    RETURN COALESCE(feature_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 36. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_feature_access(TEXT) TO authenticated;

-- 37. Create a function to increment AI usage
CREATE OR REPLACE FUNCTION increment_ai_usage()
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    daily_limit INTEGER;
    user_plan subscription_plan;
BEGIN
    -- Get user's subscription plan and current usage
    SELECT 
        subscription_plan,
        COALESCE(usage_ai_generations, 0),
        CASE 
            WHEN subscription_plan IN ('pro_monthly', 'pro_annual') THEN 20
            ELSE 3
        END
    INTO user_plan, current_usage, daily_limit
    FROM profiles
    WHERE user_id = auth.uid();
    
    -- Check if we need to reset daily usage
    IF usage_ai_generations_reset_date != CURRENT_DATE THEN
        -- New day, reset usage
        UPDATE profiles 
        SET 
            usage_ai_generations = 1,
            usage_ai_generations_reset_date = CURRENT_DATE
        WHERE user_id = auth.uid();
        RETURN TRUE;
    ELSE
        -- Same day, check if limit reached
        IF current_usage >= daily_limit THEN
            RETURN FALSE; -- Limit reached
        ELSE
            -- Increment usage
            UPDATE profiles 
            SET usage_ai_generations = current_usage + 1
            WHERE user_id = auth.uid();
            RETURN TRUE;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 38. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_ai_usage() TO authenticated;

-- 39. Final cleanup and verification
COMMENT ON TABLE profiles IS 'User profiles with subscription and usage information';
COMMENT ON TABLE meal_plans IS 'AI-generated and user-created meal plans';
COMMENT ON TABLE recipes IS 'AI-generated and user-created recipes';
COMMENT ON TABLE shopping_lists IS 'Shopping lists for meal plans';
COMMENT ON TABLE shopping_list_items IS 'Individual items in shopping lists';
COMMENT ON TABLE tasks IS 'Nutrition and meal prep tasks';
COMMENT ON TABLE sticky_notes IS 'Personal notes and reminders';
COMMENT ON TABLE subscriptions IS 'Subscription history and management';
COMMENT ON TABLE billing_history IS 'Payment and billing history';
COMMENT ON TABLE feature_flags IS 'Feature availability by subscription tier';
COMMENT ON TABLE subscription_limits IS 'Usage limits by subscription tier';

-- 40. Display final status
SELECT 'Database restructuring completed successfully!' as status;
