// AI Services Index
// Export all AI-related services, types, and utilities

// Core AI Service
export { aiService } from './core';

// Specialized Services
export { mealPlanService } from './meal-plan-service';
export { recipeService } from './recipe-service';
export { nutritionService } from './nutrition-service';
export { shoppingListService } from './shopping-list-service';

// Types
export type {
  AIUserProfile,
  AIGenerationRequest,
  AIGenerationResponse,
  AIFeature,
  MealPlanRequest,
  MealPlanResponse,
  RecipeRecommendationRequest,
  RecipeRecommendationResponse,
  NutritionEducationRequest,
  ShoppingListRequest,
  AIServiceConfig,
  AILimits,
  AIUsage,
  AIPromptTemplate,
  AIGenerationHistory,
  AIServiceError,
  MealPlanDay,
  Meal,
  Ingredient,
  NutritionInfo,
  GroceryItem,
  NutritionalSummary,
  Recipe,
  RecipeFilters
} from './types';

// React Hook
export { useAI } from '@/hooks/useAI';
