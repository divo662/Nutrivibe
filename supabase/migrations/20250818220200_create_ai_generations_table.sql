-- Create AI generations table to store all generated content
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN (
    'meal_plan_generation', 
    'recipe_recommendation', 
    'nutrition_education', 
    'health_advice', 
    'meal_plan_customization',
    'grocery_list_optimization',
    'cultural_food_understanding',
    'recipe_alternatives',
    'recipes_by_ingredients',
    'nutrition_quiz',
    'meal_timing_advice',
    'supplement_advice'
  )),
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(10, 8) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_feature ON ai_generations(feature);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_feature ON ai_generations(user_id, feature);

-- Enable RLS
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI generations" ON ai_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI generations" ON ai_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI generations" ON ai_generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI generations" ON ai_generations
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ai_generations_updated_at
  BEFORE UPDATE ON ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_generations_updated_at();

-- Create a view for easier querying of user's AI content
CREATE OR REPLACE VIEW user_ai_content AS
SELECT 
  ag.id,
  ag.user_id,
  ag.feature,
  ag.title,
  ag.content,
  ag.metadata,
  ag.tokens_used,
  ag.cost,
  ag.status,
  ag.created_at,
  ag.updated_at,
  p.full_name as user_name,
  p.subscription_plan
FROM ai_generations ag
JOIN profiles p ON ag.user_id = p.user_id
WHERE ag.status = 'active';

-- Grant permissions on the view
GRANT SELECT ON user_ai_content TO authenticated;
