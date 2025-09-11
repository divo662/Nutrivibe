-- New Additions to Database Restructuring Script
-- This file contains only the NEW additions that were made to database-restructure.sql
-- Run this AFTER running the main database-restructure.sql script

-- 1. Add new columns to meal_plans table
ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS estimated_calories INTEGER DEFAULT 0;

-- 2. Create meals table for individual meal storage
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

-- 3. Create meal_plan_items table as alternative (if meals table is too complex)
CREATE TABLE IF NOT EXISTS meal_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    meal_type TEXT NOT NULL,
    meal_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for meals table
CREATE INDEX IF NOT EXISTS idx_meals_meal_plan_id ON meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_day_number ON meals(day_number);

-- 5. Create RLS policies for meals table
CREATE POLICY "Users can view own meals" ON meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON meals
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for meal_plan_items table
CREATE POLICY "Users can view own meal plan items" ON meal_plan_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plan items" ON meal_plan_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plan items" ON meal_plan_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plan items" ON meal_plan_items
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create trigger for meals table updated_at
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable RLS on new tables
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

-- 9. Add comments to new tables
COMMENT ON TABLE meals IS 'Individual meals within meal plans with detailed nutritional information';
COMMENT ON TABLE meal_plan_items IS 'Alternative meal storage structure for meal plans';

-- 10. Display completion status
SELECT 'New database additions completed successfully!' as status;
