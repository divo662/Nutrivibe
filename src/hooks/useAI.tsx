import { useState, useCallback, useContext } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  mealPlanService, 
  recipeService, 
  nutritionService 
} from '@/services/ai';
import { 
  AIGenerationResponse, 
  MealPlanRequest, 
  RecipeRecommendationRequest, 
  NutritionEducationRequest,
  AIUserProfile,
  AIUsage
} from '@/services/ai/types';
import { useToast } from './use-toast';

interface AIState {
  loading: boolean;
  error: string | null;
  response: AIGenerationResponse | null;
  usage: AIUsage | null;
}

interface UseAI {
  // State
  state: AIState;
  
  // Meal Plan Services
  generateMealPlan: (request: MealPlanRequest) => Promise<void>;
  customizeMealPlan: (currentPlan: any, feedback: string) => Promise<void>;
  generateGroceryList: (mealPlan: any, budget: number, location: string) => Promise<void>;
  
  // Recipe Services
  getRecipeRecommendations: (request: RecipeRecommendationRequest) => Promise<void>;
  getRecipeAlternatives: (originalRecipe: string, reason: string) => Promise<void>;
  getCulturalFoodUnderstanding: (foods: string[]) => Promise<void>;
  getRecipesByIngredients: (ingredients: string[]) => Promise<void>;
  
  // Nutrition Services
  getNutritionEducation: (request: NutritionEducationRequest) => Promise<void>;
  getHealthAdvice: (healthQuestion: string) => Promise<void>;
  getMealTimingAdvice: (schedule: string) => Promise<void>;
  getSupplementAdvice: (currentSupplements: string[]) => Promise<void>;
  getNutritionQuiz: (quizType: 'basic' | 'intermediate' | 'advanced') => Promise<void>;
  
  // Utility
  resetState: () => void;
  checkUsage: () => Promise<AIUsage | null>;
}

/**
 * AI Service Hook for NutriVibe
 * Provides easy access to all AI features with state management
 */
export const useAI = (): UseAI => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<AIState>({
    loading: false,
    error: null,
    response: null,
    usage: null
  });

  // Get user profile for AI context
  const getUserProfile = useCallback(async (): Promise<AIUserProfile | null> => {
    if (!user) return null;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        throw new Error('Failed to fetch user profile');
      }

      return profile as AIUserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Profile Error",
        description: "Failed to load your profile for AI personalization",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Check AI usage limits
  const checkUsage = useCallback(async (): Promise<AIUsage | null> => {
    if (!user) return null;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_plan, usage_ai_generations, usage_ai_generations_reset_date')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        throw new Error('Failed to fetch usage info');
      }

      // Get current daily usage
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyUsage } = await supabase
        .from('subscription_usage')
        .select('ai_generations_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      // Define limits based on subscription plan
      const getLimits = (plan: string) => {
        switch (plan) {
          case 'pro_monthly':
          case 'pro_annual':
            return { daily: 20, monthly: 500 };
          case 'free':
          default:
            return { daily: 3, monthly: 50 };
        }
      };

      const limits = getLimits(profile.subscription_plan || 'free');
      const dailyUsed = dailyUsage?.ai_generations_used || 0;
      const monthlyUsed = profile.usage_ai_generations || 0;

      const usage: AIUsage = {
        dailyUsed,
        dailyLimit: limits.daily,
        monthlyUsed,
        monthlyLimit: limits.monthly,
        canGenerate: dailyUsed < limits.daily && monthlyUsed < limits.monthly,
        nextReset: profile.usage_ai_generations_reset_date || new Date().toISOString()
      };

      return usage;
    } catch (error) {
      console.error('Error checking usage:', error);
      return null;
    }
  }, [user]);

  // Generic AI generation wrapper
  const generateAI = useCallback(async (
    generator: () => Promise<AIGenerationResponse>
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use AI features",
        variant: "destructive"
      });
      return;
    }

    // Check usage before proceeding
    const usage = await checkUsage();
    if (usage && !usage.canGenerate) {
      setState(prev => ({
        ...prev,
        error: 'Daily or monthly AI generation limit reached. Upgrade to Pro for unlimited access.',
        usage
      }));
      
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your AI generation limit. Upgrade to Pro for unlimited access.",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await generator();
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          response,
          usage: response.usage
        }));

        toast({
          title: "AI Generation Complete",
          description: "Your personalized content is ready!",
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'AI generation failed',
          usage: response.usage
        }));

        toast({
          title: "AI Generation Failed",
          description: response.error || 'Failed to generate content',
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast({
        title: "AI Generation Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [user, toast, checkUsage]);

  // Meal Plan Services
  const generateMealPlan = useCallback(async (request: MealPlanRequest) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await mealPlanService.generateMealPlan(user!.id, profile, request);
    });
  }, [generateAI, getUserProfile, user]);

  const customizeMealPlan = useCallback(async (currentPlan: any, feedback: string) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await mealPlanService.customizeMealPlan(user!.id, profile, currentPlan, feedback);
    });
  }, [generateAI, getUserProfile, user]);

  const generateGroceryList = useCallback(async (mealPlan: any, budget: number, location: string) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await mealPlanService.generateGroceryList(user!.id, profile, mealPlan, budget, location);
    });
  }, [generateAI, getUserProfile, user]);

  // Recipe Services
  const getRecipeRecommendations = useCallback(async (request: RecipeRecommendationRequest) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await recipeService.getRecipeRecommendations(user!.id, profile, request);
    });
  }, [generateAI, getUserProfile, user]);

  const getRecipeAlternatives = useCallback(async (originalRecipe: string, reason: string) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await recipeService.getRecipeAlternatives(user!.id, profile, originalRecipe, reason);
    });
  }, [generateAI, getUserProfile, user]);

  const getCulturalFoodUnderstanding = useCallback(async (foods: string[]) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await recipeService.getCulturalFoodUnderstanding(user!.id, profile, foods);
    });
  }, [generateAI, getUserProfile, user]);

  const getRecipesByIngredients = useCallback(async (ingredients: string[]) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await recipeService.getRecipesByIngredients(user!.id, profile, ingredients);
    });
  }, [generateAI, getUserProfile, user]);

  // Nutrition Services
  const getNutritionEducation = useCallback(async (request: NutritionEducationRequest) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await nutritionService.getNutritionEducation(user!.id, profile, request);
    });
  }, [generateAI, getUserProfile, user]);

  const getHealthAdvice = useCallback(async (healthQuestion: string) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await nutritionService.getHealthAdvice(user!.id, profile, healthQuestion);
    });
  }, [generateAI, getUserProfile, user]);

  const getMealTimingAdvice = useCallback(async (schedule: string) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await nutritionService.getMealTimingAdvice(user!.id, profile, schedule);
    });
  }, [generateAI, getUserProfile, user]);

  const getSupplementAdvice = useCallback(async (currentSupplements: string[]) => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await nutritionService.getSupplementAdvice(user!.id, profile, currentSupplements);
    });
  }, [generateAI, getUserProfile, user]);

  const getNutritionQuiz = useCallback(async (quizType: 'basic' | 'intermediate' | 'advanced') => {
    await generateAI(async () => {
      const profile = await getUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      return await nutritionService.getNutritionQuiz(user!.id, profile, quizType);
    });
  }, [generateAI, getUserProfile, user]);

  // Utility functions
  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      response: null,
      usage: null
    });
  }, []);

  return {
    state,
    generateMealPlan,
    customizeMealPlan,
    generateGroceryList,
    getRecipeRecommendations,
    getRecipeAlternatives,
    getCulturalFoodUnderstanding,
    getRecipesByIngredients,
    getNutritionEducation,
    getHealthAdvice,
    getMealTimingAdvice,
    getSupplementAdvice,
    getNutritionQuiz,
    resetState,
    checkUsage
  };
};
