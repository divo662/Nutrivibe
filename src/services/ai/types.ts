// AI Service Types for NutriVibe

export interface AIUserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  fitness_goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic_performance' | null;
  dietary_preference: 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean' | null;
  allergies: string[] | null;
  location: string | null;
  caloric_needs: number | null;
  subscription_plan: 'free' | 'pro_monthly' | 'pro_annual' | null;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | null;
  usage_ai_generations: number | null;
  usage_ai_generations_reset_date: string | null;
}

export interface AIGenerationRequest {
  userId: string;
  feature: AIFeature;
  prompt: string;
  userProfile: AIUserProfile;
  additionalContext?: Record<string, any>;
}

export interface AIGenerationResponse {
  success: boolean;
  content: string;
  tokens: {
    total: number;
    prompt: number;
    completion: number;
  };
  cost: number;
  usage: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
  };
  error?: string;
}

export type AIFeature = 
  | 'meal_plan_generation'
  | 'recipe_recommendation'
  | 'nutrition_education'
  | 'meal_plan_customization'
  | 'grocery_list_optimization'
  | 'shopping_list_generation'
  | 'shopping_list_customization'
  | 'budget_optimization'
  | 'cultural_food_understanding'
  | 'voice_meal_request'
  | 'image_nutrition_analysis';

export interface MealPlanRequest {
  days: number;
  goal: string;
  dietaryRestrictions: string[];
  culturalPreferences: string[];
  budget: 'low' | 'medium' | 'high';
  mealPrepTime: 'quick' | 'moderate' | 'extensive';
}

export interface RecipeRecommendationRequest {
  recipeRequest?: string;
  cuisine: string;
  dietaryRestrictions: string[];
  cookingTime: 'quick' | 'moderate' | 'extensive';
  skillLevel: 'easy' | 'medium' | 'hard';
  ingredients: string[];
}

export interface NutritionEducationRequest {
  topic: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  culturalContext: boolean;
  practicalExamples: boolean;
}

export interface GroceryListRequest {
  mealPlan: any;
  budget: number;
  location: string;
  shoppingPreferences: string[];
  storageCapacity: 'small' | 'medium' | 'large';
}

export interface ShoppingListRequest {
  mealPlan: string[];
  budget: 'low' | 'medium' | 'high';
  location: string;
  preferences: string[];
}

export interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface AILimits {
  free: {
    daily: number;
    monthly: number;
  };
  pro_monthly: {
    daily: number;
    monthly: number;
  };
  pro_annual: {
    daily: number;
    monthly: number;
  };
}

export interface AIUsage {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  canGenerate: boolean;
  nextReset: string;
}

export interface AIPromptTemplate {
  system: string;
  user: string;
  variables: string[];
}

export interface AIGenerationHistory {
  id: string;
  user_id: string;
  feature: AIFeature;
  prompt: string;
  response: string;
  tokens_used: number;
  cost: number;
  created_at: string;
  user_profile_snapshot: Partial<AIUserProfile>;
}

export interface AIServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

// Response types for specific AI features
export interface MealPlanResponse {
  days: MealPlanDay[];
  groceryList: GroceryItem[];
  mealPrepTips: string[];
  nutritionalSummary: NutritionalSummary;
  culturalNotes: string[];
}

export interface MealPlanDay {
  day: number;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  culturalContext: string;
  preparationTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: 'protein' | 'carbohydrate' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'spice';
  localAlternative?: string;
  estimatedCost: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedCost: number;
  storage: 'pantry' | 'refrigerator' | 'freezer';
  priority: 'essential' | 'important' | 'optional';
  localMarket: boolean;
}

export interface NutritionalSummary {
  dailyAverage: NutritionInfo;
  weeklyTotal: NutritionInfo;
  goalAlignment: number; // percentage
  recommendations: string[];
}

export interface RecipeRecommendationResponse {
  recipes: Recipe[];
  totalCount: number;
  filters: RecipeFilters;
  culturalContext: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  preparationTime: number;
  cookingTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  culturalNotes: string;
  localAlternatives: string[];
  tags: string[];
}

export interface RecipeFilters {
  dietaryRestrictions: string[];
  cookingTime: string;
  skillLevel: string;
  cuisine: string;
  maxCalories?: number;
}
