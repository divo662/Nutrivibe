import { supabase } from '@/integrations/supabase/client';
import { 
  AIGenerationRequest, 
  AIGenerationResponse, 
  AIServiceConfig, 
  AIUsage, 
  AIServiceError,
  AIFeature,
  AIUserProfile
} from './types';

/**
 * Core AI Service for NutriVibe
 * Handles communication with Groq API, usage tracking, and user authentication
 */
export class AIService {
  private config: AIServiceConfig;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Load configuration from environment variables
    const isDevelopment = import.meta.env.DEV;
    
    this.config = {
      apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
      baseUrl: isDevelopment ? '/api/groq/openai/v1' : 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile', // Use a currently available production model
      maxTokens: 4000,
      temperature: 0.1, // Keep low temperature for better instruction following
      retryAttempts: 3,
      retryDelay: 1000
    };

    this.baseUrl = this.config.baseUrl;
    this.apiKey = this.config.apiKey;
  }

  /**
   * Generate AI content based on user request
   */
  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      // Check if user can generate content
      const usage = await this.checkUserUsage(request.userId, request.feature);
      if (!usage.canGenerate) {
        return {
          success: false,
          content: '',
          tokens: { total: 0, prompt: 0, completion: 0 },
          cost: 0,
          usage: {
            dailyUsed: usage.dailyUsed,
            dailyLimit: usage.dailyLimit,
            monthlyUsed: usage.monthlyUsed,
            monthlyLimit: usage.monthlyLimit
          },
          error: 'Daily or monthly AI generation limit reached. Upgrade to Pro for unlimited access.'
        };
      }

      // Build the prompt with user context
      const prompt = this.buildPrompt(request);
      
      console.log('🚀 Final prompt being sent to API:', prompt.substring(0, 200) + '...');
      
      // Make API call to Groq
      const response = await this.callGroqAPI(prompt, request.feature);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate content');
      }

      // Update usage tracking
      await this.updateUserUsage(request.userId, request.feature, response.tokens.total);

      // Save generation history
      await this.saveGenerationHistory(request, response);

      return {
        success: true,
        content: response.content,
        tokens: response.tokens,
        cost: response.cost,
        usage: {
          dailyUsed: usage.dailyUsed + 1,
          dailyLimit: usage.dailyLimit,
          monthlyUsed: usage.monthlyUsed + 1,
          monthlyLimit: usage.monthlyLimit
        }
      };

    } catch (error) {
      console.error('AI generation failed:', error);
      return {
        success: false,
        content: '',
        tokens: { total: 0, prompt: 0, completion: 0 },
        cost: 0,
        usage: { dailyUsed: 0, dailyLimit: 0, monthlyUsed: 0, monthlyLimit: 0 },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if user can generate AI content based on subscription limits
   */
  async checkUserUsage(userId: string, feature: AIFeature): Promise<AIUsage> {
    try {
      // Get user profile with subscription info
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        throw new Error('User profile not found');
      }

      // Define limits based on subscription plan
      const limits = this.getSubscriptionLimits(profile.subscription_plan || 'free');
      
      // Use profiles table for daily usage (simplified approach)
      const dailyUsed = 0; // TODO: Implement daily tracking
      const dailyLimit = limits.daily;
      const monthlyUsed = profile.usage_ai_generations || 0;
      const monthlyLimit = limits.monthly;

      const canGenerate = dailyUsed < dailyLimit && monthlyUsed < monthlyLimit;

      return {
        dailyUsed,
        dailyLimit,
        monthlyUsed,
        monthlyLimit,
        canGenerate,
        nextReset: this.getNextResetDate(profile.usage_ai_generations_reset_date)
      };

    } catch (error) {
      console.error('Error checking user usage:', error);
      // Default to free tier limits if error
      return {
        dailyUsed: 0,
        dailyLimit: 3,
        monthlyUsed: 0,
        monthlyLimit: 50,
        canGenerate: true,
        nextReset: new Date().toISOString()
      };
    }
  }

  /**
   * Update user usage after successful generation
   */
  private async updateUserUsage(userId: string, feature: AIFeature, tokensUsed: number): Promise<void> {
    try {
      // Get current monthly usage from profiles table (existing table)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('usage_ai_generations')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      const currentMonthlyUsage = profile?.usage_ai_generations || 0;
      const newMonthlyUsage = currentMonthlyUsage + 1;

      // Update monthly usage in profiles table
      const { error: monthlyError } = await supabase
        .from('profiles')
        .update({
          usage_ai_generations: newMonthlyUsage
        })
        .eq('user_id', userId);

      if (monthlyError) {
        console.error('Error updating monthly usage:', monthlyError);
      }

    } catch (error) {
      console.error('Error updating user usage:', error);
    }
  }

  /**
   * Save generation history for analytics and user reference
   */
  private async saveGenerationHistory(request: AIGenerationRequest, response: any): Promise<void> {
    try {
      // Generate a title based on the feature and content
      const title = this.generateTitle(request.feature, request.prompt);
      
      // Extract metadata from the request
      const metadata = {
        prompt: request.prompt,
        userProfile: {
          fitnessGoal: request.userProfile.fitness_goal,
          dietaryPreference: request.userProfile.dietary_preference,
          allergies: request.userProfile.allergies,
          location: request.userProfile.location,
          caloricNeeds: request.userProfile.caloric_needs
        },
        additionalContext: request.additionalContext || {},
        model: this.config.model,
        temperature: this.config.temperature
      };

      // For now, we'll skip saving to database since the table doesn't exist
      // This can be re-enabled once the database tables are created
      console.log('Generation history saving disabled - table not available');
      
      // TODO: Re-enable this once ai_generations table is created
      /*
      // Save to ai_generations table
      const { error } = await supabase
        .from('ai_generations')
        .insert({
          user_id: request.userId,
          feature: request.feature,
          title: title,
          content: response.content,
          metadata: metadata,
          tokens_used: response.tokens.total,
          cost: response.cost
        });

      if (error) {
        console.error('Error saving AI generation to database:', error);
      } else {
        console.log('AI Generation saved to database successfully');
      }
      */
    } catch (error) {
      console.error('Error saving generation history:', error);
    }
  }

  /**
   * Generate a title for the AI generation based on feature and prompt
   */
  private generateTitle(feature: AIFeature, prompt: string): string {
    const featureNames = {
      'meal_plan_generation': 'Meal Plan',
      'recipe_recommendation': 'Recipe Recommendation',
      'nutrition_education': 'Nutrition Education',
      'health_advice': 'Health Advice',
      'meal_plan_customization': 'Meal Plan Customization',
      'grocery_list_optimization': 'Grocery List',
      'cultural_food_understanding': 'Cultural Food Guide',
      'recipe_alternatives': 'Recipe Alternatives',
      'recipes_by_ingredients': 'Recipes by Ingredients',
      'nutrition_quiz': 'Nutrition Quiz',
      'meal_timing_advice': 'Meal Timing Advice',
      'supplement_advice': 'Supplement Advice'
    };

    const featureName = featureNames[feature] || 'AI Generation';
    const promptPreview = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    
    return `${featureName}: ${promptPreview}`;
  }

  /**
   * Build contextual prompt based on user profile and request
   */
  private buildPrompt(request: AIGenerationRequest): string {
    const { userProfile, feature, prompt, additionalContext } = request;
    
    console.log('🔍 buildPrompt called with feature:', feature);
    console.log('🔍 Custom prompt from service:', prompt.substring(0, 100) + '...');
    
    // For features where we want the service prompt verbatim, bypass NutriVibe system prompt
    if (
      feature === 'recipe_recommendation' ||
      feature === 'shopping_list_generation' ||
      feature === 'shopping_list_customization' ||
      feature === 'budget_optimization'
    ) {
      console.log('✅ Using custom recipe prompt directly');
      return prompt; // Use the custom prompt from recipe service without modification
    }
    
    // Base system prompt for other features
    let systemPrompt = `You are NutriVibe, an AI nutritionist specializing in Nigerian cuisine and healthy eating. 
You provide practical, culturally-aware advice with clear structure and actionable steps.

User Profile:
- Name: ${userProfile.full_name || 'User'}
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day
- Cultural Context: Nigerian cuisine and local ingredients

Instructions:
- Always consider the user's cultural background and preferences
- Provide practical, actionable advice
- Use local Nigerian ingredients when possible
- Consider the user's dietary restrictions and allergies
- Provide clear nutritional information
- Include meal prep tips and cultural context`;

    // Add feature-specific instructions
    switch (feature) {
      case 'meal_plan_generation':
        systemPrompt += '\n\nFor meal plans, provide:\n- Daily meal breakdown with calories\n- Nigerian recipe names and ingredients\n- Grocery shopping list\n- Meal prep tips\n- Cultural food substitutions if needed';
        break;
      case 'nutrition_education':
        systemPrompt += '\n\nFor nutrition education, provide:\n- Simple explanations with Nigerian food examples\n- Practical applications for daily life\n- Cultural context and local alternatives';
        break;
    }

    // Add additional context if provided
    if (additionalContext) {
      systemPrompt += `\n\nAdditional Context: ${JSON.stringify(additionalContext)}`;
    }

    return systemPrompt;
  }

  /**
   * Make API call to Groq
   */
  private async callGroqAPI(prompt: string, feature: AIFeature): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🚀 Making API call to: ${this.baseUrl}/chat/completions (attempt ${attempt})`);
        console.log(`🔑 Using API key: ${this.apiKey.substring(0, 10)}...`);
        
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: "system",
                content: prompt
              }
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            stream: false
          })
        });

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error Response:`, errorText);
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ API call successful, received ${data.choices?.[0]?.message?.content?.length || 0} characters`);
        
        if (data.choices && data.choices[0]) {
          const tokens = data.usage;
          const cost = this.calculateCost(tokens.total_tokens);
          
          return {
            success: true,
            content: data.choices[0].message.content,
            tokens: {
              total: tokens.total_tokens,
              prompt: tokens.prompt_tokens,
              completion: tokens.completion_tokens
            },
            cost
          };
        } else {
          throw new Error('Invalid response format from Groq API');
        }

      } catch (error) {
        lastError = error;
        console.error(`❌ API call attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.retryAttempts) {
          console.log(`🔄 Retrying in ${this.config.retryDelay * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get feature-specific prompt
   */
  private getFeaturePrompt(feature: AIFeature): string {
    switch (feature) {
      case 'meal_plan_generation':
        return 'Generate a personalized meal plan based on my profile and preferences.';
      case 'recipe_recommendation':
        return 'Recommend healthy Nigerian recipes based on my dietary preferences and goals.';
      case 'nutrition_education':
        return 'Explain nutrition concepts in the context of Nigerian cuisine and my goals.';
      case 'meal_plan_customization':
        return 'Help me customize my existing meal plan based on my feedback.';
      case 'grocery_list_optimization':
        return 'Create an optimized grocery shopping list for my meal plan.';
      case 'cultural_food_understanding':
        return 'Explain the nutritional benefits and cultural significance of Nigerian foods.';
      default:
        return 'Provide helpful nutrition advice based on my profile.';
    }
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: number): number {
    // Groq pricing: $0.0000005 per token
    return tokens * 0.0000005;
  }

  /**
   * Get subscription limits based on plan
   */
  private getSubscriptionLimits(plan: string): { daily: number; monthly: number } {
    switch (plan) {
      case 'pro_monthly':
      case 'pro_annual':
        return { daily: 20, monthly: 500 };
      case 'free':
      default:
        return { daily: 3, monthly: 50 };
    }
  }

  /**
   * Get next reset date for usage tracking
   */
  private getNextResetDate(resetDate: string | null): string {
    if (resetDate) {
      return resetDate;
    }
    
    // Default to next month if no reset date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString();
  }

  /**
   * Get user's saved AI generations
   * NOTE: Temporarily disabled - ai_generations table not available
   */
  async getUserGenerations(userId: string, feature?: AIFeature): Promise<any[]> {
    console.log('getUserGenerations disabled - ai_generations table not available');
    return [];
  }

  /**
   * Archive a generation (soft delete)
   * NOTE: Temporarily disabled - ai_generations table not available
   */
  async archiveGeneration(generationId: string, userId: string): Promise<boolean> {
    console.log('archiveGeneration disabled - ai_generations table not available');
    return false;
  }

  /**
   * Reset user usage (called monthly or when subscription changes)
   */
  async resetUserUsage(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          usage_ai_generations: 0,
          usage_ai_generations_reset_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting user usage:', error);
      }
    } catch (error) {
      console.error('Error resetting user usage:', error);
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
