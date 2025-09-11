import { aiService } from './core';
import { 
  AIGenerationRequest, 
  AIGenerationResponse, 
  ShoppingListRequest, 
  AIUserProfile 
} from './types';

/**
 * AI Shopping List Service for NutriVibe
 * Generates optimized shopping lists based on meal plans and preferences
 */
export class ShoppingListService {
  
  /**
   * Generate an optimized shopping list
   */
  async generateShoppingList(
    userId: string,
    userProfile: AIUserProfile,
    request: ShoppingListRequest
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildShoppingListPrompt(userProfile, request);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'shopping_list_generation',
      prompt,
      userProfile,
      additionalContext: {
        mealPlan: request.mealPlan,
        budget: request.budget,
        location: request.location,
        preferences: request.preferences
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Customize an existing shopping list based on user feedback
   */
  async customizeShoppingList(
    userId: string,
    userProfile: AIUserProfile,
    currentShoppingList: any,
    feedback: string
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildCustomizationPrompt(userProfile, currentShoppingList, feedback);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'shopping_list_customization',
      prompt,
      userProfile,
      additionalContext: {
        currentShoppingList,
        feedback,
        customizationType: 'shopping_list'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Generate a budget-optimized shopping list
   */
  async generateBudgetOptimizedList(
    userId: string,
    userProfile: AIUserProfile,
    mealPlan: any,
    budget: number,
    location: string
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildBudgetOptimizationPrompt(userProfile, mealPlan, budget, location);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'budget_optimization',
      prompt,
      userProfile,
      additionalContext: {
        mealPlan,
        budget,
        location,
        optimizationType: 'budget'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Build the main shopping list generation prompt
   */
  private buildShoppingListPrompt(userProfile: AIUserProfile, request: ShoppingListRequest): string {
    const { mealPlan, budget, location, preferences } = request;
    
    return `Generate an optimized shopping list for a user in ${location || 'Nigeria'} with the following requirements:

User Profile:
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'No restrictions'}
- Allergies: ${userProfile.allergies?.length ? userProfile.allergies.join(', ') : 'None'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'}

Shopping Requirements:
- Meals to prepare: ${mealPlan.join(', ')}
- Budget: ${budget} range
- Location: ${location || 'Nigeria'}
- Preferences: ${preferences.join(', ')}

IMPORTANT: If the user's requested meals contain ingredients that conflict with their dietary preferences or allergies, you MUST:
1. Clearly explain WHY you're making substitutions
2. Provide suitable alternatives that align with their profile
3. Explain the nutritional benefits of the substitutions
4. Ensure the alternatives still achieve the same meal goals

For example, if they request "chicken" but their profile shows "vegetarian", explain:
"Since your profile indicates you follow a vegetarian diet, I've replaced chicken with [alternative] because [reason]. This substitution provides [nutritional benefits] while maintaining the protein content needed for your muscle gain goal."

Please create a comprehensive shopping list that:
1. Includes all necessary ingredients for the specified meals (with substitutions as needed)
2. Is optimized for the ${location || 'Nigerian'} market
3. Respects dietary restrictions and allergies (with clear explanations for any changes)
4. Fits within the ${budget} budget range
5. Groups items by category (proteins, vegetables, grains, etc.)
6. Includes approximate quantities and Nigerian market prices where possible
7. Suggests local alternatives for hard-to-find ingredients
8. Provides shopping tips for the best deals in ${location || 'Nigeria'}

Start your response with a brief explanation of any substitutions made based on the user's profile, then provide the organized shopping list with categories and helpful notes.`;
  }

  /**
   * Build the customization prompt
   */
  private buildCustomizationPrompt(userProfile: AIUserProfile, currentShoppingList: any, feedback: string): string {
    return `Customize the following shopping list based on user feedback:

Current Shopping List:
${JSON.stringify(currentShoppingList, null, 2)}

User Feedback:
${feedback}

User Profile:
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'No restrictions'}
- Allergies: ${userProfile.allergies?.length ? userProfile.allergies.join(', ') : 'None'}
- Location: ${userProfile.location || 'Nigeria'}

IMPORTANT: When making changes based on the feedback, always explain:
1. WHY you're making each change
2. How the change aligns with their dietary preferences/allergies
3. The nutritional impact of any substitutions
4. How the change addresses their specific feedback

Please update the shopping list to address the feedback while maintaining:
1. All necessary ingredients for the meals
2. Dietary restrictions and allergy considerations
3. Budget optimization
4. Local market availability in ${userProfile.location || 'Nigeria'}

Start your response with a clear explanation of the changes made and why they were necessary, then provide the updated shopping list with detailed explanations of each modification.`;
  }

  /**
   * Build the budget optimization prompt
   */
  private buildBudgetOptimizationPrompt(userProfile: AIUserProfile, mealPlan: any, budget: number, location: string): string {
    return `Create a budget-optimized shopping list for a user with a budget of ₦${budget} in ${location}:

User Profile:
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'No restrictions'}
- Allergies: ${userProfile.allergies?.length ? userProfile.allergies.join(', ') : 'None'}

Meal Plan:
${JSON.stringify(mealPlan, null, 2)}

Budget: ₦${budget}

IMPORTANT: If any ingredients in the meal plan need to be substituted due to budget constraints or dietary preferences, clearly explain:
1. WHY you're making the substitution
2. How the alternative fits within the budget
3. The nutritional benefits of the budget-friendly option
4. How it aligns with their dietary preferences/allergies

Please create a shopping list that:
1. Stays within the ₦${budget} budget
2. Prioritizes essential ingredients
3. Suggests budget-friendly alternatives (with clear explanations for substitutions)
4. Includes local market shopping tips for ${location}
5. Groups items by priority (essential vs. optional)
6. Provides cost estimates for each item
7. Suggests bulk buying opportunities where applicable
8. Recommends seasonal ingredients for better prices

Start your response with an explanation of any budget-driven substitutions made, then format as a prioritized shopping list with cost estimates and money-saving tips.`;
  }
}

export const shoppingListService = new ShoppingListService();
