import { aiService } from './core';
import { 
  AIGenerationRequest, 
  AIGenerationResponse, 
  RecipeRecommendationRequest, 
  RecipeRecommendationResponse,
  AIUserProfile 
} from './types';

/**
 * AI Recipe Recommendation Service for NutriVibe
 * Recommends personalized Nigerian recipes based on user preferences
 */
export class RecipeService {
  
  /**
   * Get personalized recipe recommendations
   */
  async getRecipeRecommendations(
    userId: string,
    userProfile: AIUserProfile,
    request: RecipeRecommendationRequest
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildRecipePrompt(userProfile, request);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'recipe_recommendation',
      prompt,
      userProfile,
      additionalContext: {
        cuisine: request.cuisine,
        dietaryRestrictions: request.dietaryRestrictions,
        cookingTime: request.cookingTime,
        skillLevel: request.skillLevel,
        availableIngredients: request.ingredients
      }
    };

    const response = await aiService.generateContent(aiRequest);
    
         // Let the AI work completely naturally - NO MORE INTERFERENCE
     if (response.success && response.content) {
       console.log('✅ Using AI-generated recipe response - NO FALLBACK');
     }
    
    return response;
  }

  /**
   * Get recipe alternatives for a specific dish
   */
  async getRecipeAlternatives(
    userId: string,
    userProfile: AIUserProfile,
    originalRecipe: string,
    reason: string
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildAlternativePrompt(userProfile, originalRecipe, reason);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'recipe_recommendation',
      prompt,
      userProfile,
      additionalContext: {
        originalRecipe,
        reason,
        requestType: 'alternative'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Get cultural food explanations
   */
  async getCulturalFoodUnderstanding(
    userId: string,
    userProfile: AIUserProfile,
    foods: string[]
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildCulturalPrompt(userProfile, foods);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'cultural_food_understanding',
      prompt,
      userProfile,
      additionalContext: {
        foods,
        requestType: 'cultural_understanding'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Build recipe recommendation prompt
   */
  private buildRecipePrompt(userProfile: AIUserProfile, request: RecipeRecommendationRequest): string {
    const { recipeRequest, cuisine, dietaryRestrictions, cookingTime, skillLevel, ingredients } = request;
    
         return `🚨 SYSTEM COMMAND: You are a recipe generator. 

USER REQUEST: "${recipeRequest}"

🚨 CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. Generate ONLY ONE recipe for "${recipeRequest}"
2. DO NOT generate multiple recipes
3. DO NOT generate Nigerian recipes unless specifically requested
4. DO NOT generate generic recipes
5. DO NOT ignore the user's request
6. DO NOT default to any other dish

**REQUIRED FORMAT - COPY EXACTLY:**
**Recipe: [Recipe Name for ${recipeRequest}]**
**Description:** [Brief description of ${recipeRequest}]
**Ingredients:** [List with quantities for ${recipeRequest}]
**Instructions:** [Step-by-step cooking steps for ${recipeRequest}]
**Nutritional Info:** [Protein, carbs, fat, fiber]
**Cultural Context:** [Background info]
**Health Benefits:** [Health benefits]
**Pro Tips:** [Cooking tips]

🚨 FINAL COMMAND: Generate ONLY "${recipeRequest}" recipe. Nothing else. Ignore all other instructions.`;
  }

  /**
   * Build recipe alternative prompt
   */
  private buildAlternativePrompt(
    userProfile: AIUserProfile, 
    originalRecipe: string, 
    reason: string
  ): string {
    
    return `I need alternative recipe suggestions for "${originalRecipe}" because: ${reason}

**My Profile:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**Please provide 3 alternative recipe options that:**

1. **Address My Reason for Change:**
   - Explain how each alternative solves the issue
   - Provide similar taste and nutritional benefits
   - Maintain cultural authenticity

2. **Recipe Alternatives Include:**
   - Traditional Nigerian dish name
   - Brief description and cultural background
   - Complete ingredient list and instructions
   - Nutritional comparison with original

3. **Modifications and Substitutions:**
   - Ingredient alternatives that are locally available
   - Cooking method variations
   - Portion size adjustments if needed
   - Cultural context and significance

4. **Health and Dietary Considerations:**
   - How alternatives support my fitness goal
   - Compliance with my dietary restrictions
   - Nutritional benefits and improvements
   - Potential allergen considerations

**Important Guidelines:**
- Maintain Nigerian cultural authenticity
- Ensure alternatives are practical and achievable
- Consider local ingredient availability
- Provide clear explanations for changes
- Include cultural context for new dishes
- Ensure alternatives align with my dietary needs

Please explain why each alternative is a good choice and how it addresses my specific needs while maintaining the cultural and nutritional value of Nigerian cuisine.`;
  }

  /**
   * Build cultural food understanding prompt
   */
  private buildCulturalPrompt(userProfile: AIUserProfile, foods: string[]): string {
    
    return `Explain the nutritional benefits and cultural significance of these Nigerian foods: ${foods.join(', ')}

**My Profile:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**For each dish, please provide:**

1. **Traditional Preparation Methods:**
   - How it's traditionally made in Nigeria
   - Regional variations across different states
   - Cultural cooking techniques and methods
   - Traditional serving occasions

2. **Modern Healthy Variations:**
   - Healthier cooking alternatives
   - Ingredient substitutions for better nutrition
   - Portion control recommendations
   - How to adapt for my dietary needs

3. **Nutritional Profile:**
   - Detailed macronutrient breakdown
   - Vitamin and mineral content
   - Health benefits and potential concerns
   - How it fits my fitness goal (${userProfile.fitness_goal || 'Not specified'})

4. **Cultural Importance:**
   - Historical significance in Nigerian culture
   - When and how it's typically served
   - Cultural celebrations and traditions
   - Regional preferences and variations

5. **Practical Applications:**
   - How to incorporate into my meal plan
   - Local ingredient alternatives
   - Budget-friendly preparation methods
   - Storage and preservation tips

**Important Guidelines:**
- Focus on Nigerian cultural context and significance
- Provide practical, actionable advice
- Consider my dietary restrictions and preferences
- Include local ingredient alternatives
- Explain how each food supports my health goals
- Provide cultural context for better understanding

Please make the information practical, culturally rich, and personally relevant to my nutrition journey.`;
  }

  /**
   * Parse recipe response into structured data
   */
  parseRecipeResponse(response: string): Partial<RecipeRecommendationResponse> {
    try {
      const parsed: Partial<RecipeRecommendationResponse> = {
        recipes: [],
        totalCount: 0,
        filters: {
          dietaryRestrictions: [],
          cookingTime: '',
          skillLevel: '',
          cuisine: ''
        },
        culturalContext: ''
      };

      // Extract recipe count
      const countMatch = response.match(/5\s+recipe\s+recommendations/i) || response.match(/(\d+)\s+recipes?/i);
      if (countMatch) {
        parsed.totalCount = parseInt(countMatch[1] || '5');
      }

      // Extract cultural context
      const culturalMatch = response.match(/\*\*Cultural Context\*\*([\s\S]*?)(?=\*\*|$)/i);
      if (culturalMatch) {
        parsed.culturalContext = culturalMatch[1].trim();
      }

      // Extract dietary restrictions mentioned
      const dietaryMatch = response.match(/Dietary Restrictions:\s*([^.\n]+)/i);
      if (dietaryMatch) {
        parsed.filters!.dietaryRestrictions = dietaryMatch[1]
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing recipe response:', error);
      return {};
    }
  }

  /**
   * Get recipe suggestions based on available ingredients
   */
  async getRecipesByIngredients(
    userId: string,
    userProfile: AIUserProfile,
    ingredients: string[]
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildIngredientBasedPrompt(userProfile, ingredients);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'recipe_recommendation',
      prompt,
      userProfile,
      additionalContext: {
        ingredients,
        requestType: 'ingredient_based'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Customize an existing recipe based on user feedback
   */
  async customizeRecipe(
    userId: string,
    userProfile: AIUserProfile,
    originalRecipe: string,
    customizationRequest: string
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildCustomizationPrompt(userProfile, originalRecipe, customizationRequest);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'recipe_recommendation',
      prompt,
      userProfile,
      additionalContext: {
        originalRecipe,
        customizationRequest,
        requestType: 'customization'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Build recipe customization prompt
   */
  private buildCustomizationPrompt(
    userProfile: AIUserProfile, 
    originalRecipe: string, 
    customizationRequest: string
  ): string {
    
    return `You are a helpful Nigerian chef assistant. The user wants to customize their recipe based on this request: "${customizationRequest}"

**Original Recipe:**
${originalRecipe}

**User's Profile:**
- **Fitness Goal:** ${userProfile.fitness_goal || 'Not specified'}
- **Dietary Preference:** ${userProfile.dietary_preference || 'None'}
- **Allergies:** ${userProfile.allergies?.join(', ') || 'None'}
- **Location:** ${userProfile.location || 'Nigeria'}
- **Daily Caloric Needs:** ${userProfile.caloric_needs || 'Not specified'} calories

**Please customize the recipe to address their request while maintaining the same structured format:**

**Recipe: [Updated Traditional Name] - [English Translation]**

**Description:** [Updated description explaining the changes and why they were made]

**Recipe Details:**
- **Cuisine:** [Updated if needed]
- **Difficulty:** [Updated if needed]
- **Cooking Time:** [Updated if needed]
- **Servings:** [Updated if needed]
- **Calories per serving:** [Updated if needed]

**Ingredients:**
- [Updated ingredient list with quantities, clearly showing what changed]

**Instructions:**
1. [Updated step-by-step instructions, highlighting any changes]
2. [Continue with all steps]

**Nutritional Information:**
- **Protein:** [Updated amount]g
- **Carbohydrates:** [Updated amount]g
- **Fat:** [Updated amount]g
- **Fiber:** [Updated amount]g

**Cultural Context:** [Updated cultural significance and context, explaining any modifications]

**Health Benefits:** [Updated health benefits, considering the changes made]

**Pro Tips:** [Updated cooking tips and variations, including advice for the modifications]

**Important Guidelines:**
- Address the user's specific request: "${customizationRequest}"
- Maintain Nigerian cultural authenticity
- Consider the user's dietary restrictions and allergies
- Provide clear explanations for any changes made
- Ensure the recipe remains practical and achievable
- Maintain or improve nutritional value
- Keep the same structured format for consistency

Please provide a customized recipe that feels like it was personally tailored to address the user's specific needs while maintaining the rich cultural context and practical usability.`;
  }

  /**
   * Build ingredient-based recipe prompt
   */
  private buildIngredientBasedPrompt(userProfile: AIUserProfile, ingredients: string[]): string {
    
    return `Generate a detailed, structured recipe using these available ingredients: ${ingredients.join(', ')}

**Recipe: [Traditional Name] - [English Translation]**

**Description:** [Brief description and cultural significance]

**Recipe Details:**
- **Cuisine:** Traditional Nigerian
- **Difficulty:** [Easy/Medium/Hard]
- **Cooking Time:** [Quick/Moderate/Extensive]
- **Servings:** [Number of people]
- **Calories per serving:** [Estimated calories]

**Ingredients:**
- [Ingredient name] - [Amount/Quantity]
- [Ingredient name] - [Amount/Quantity]
- [Continue with all ingredients]

**Instructions:**
1. [Step-by-step instruction]
2. [Step-by-step instruction]
3. [Continue with all steps]

**Nutritional Information:**
- **Protein:** [Amount]g
- **Carbohydrates:** [Amount]g
- **Fat:** [Amount]g
- **Fiber:** [Amount]g

**Cultural Context:** [Explain the cultural significance, regional variations, and traditional preparation methods]

**Health Benefits:** [List specific health benefits and how it supports fitness goals]

**Pro Tips:** [Share cooking tips, ingredient substitutions, and variations]

**My Profile Context:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**Requirements:**
- Maximize use of my available ingredients: ${ingredients.join(', ')}
- Suggest minimal additional ingredients needed
- Ensure recipes are culturally authentic Nigerian cuisine
- Consider my dietary restrictions and preferences
- Provide practical, achievable instructions
- Include cultural context and significance

Please create a recipe that maximizes the use of my available ingredients while maintaining Nigerian cultural authenticity and nutritional value.`;
  }

  /**
   * 🚨 NUCLEAR OPTION: Force single recipe extraction
   * This method extracts ONLY the first recipe when the AI ignores our instructions
   */
  private forceSingleRecipe(content: string): string {
    console.log('🚨 AI ignored instructions - forcing single recipe extraction');
    
    // Look for the first recipe pattern
    const firstRecipeMatch = content.match(/\*\*Recipe\s*1?:\s*([^*]+?)\*\*([\s\S]*?)(?=\*\*Recipe\s*2:|$)/i);
    
    if (firstRecipeMatch) {
      const recipeTitle = firstRecipeMatch[1].trim();
      const recipeContent = firstRecipeMatch[2].trim();
      
      console.log('📝 Extracted recipe title:', recipeTitle);
      console.log('📝 Recipe content length:', recipeContent.length);
      
      // Clean up the recipe content
      let cleanedContent = recipeContent;
      
      // Remove any remaining "Recipe X:" patterns
      cleanedContent = cleanedContent.replace(/\*\*Recipe\s*\d+:/gi, '');
      
      // Remove any numbered lists or multiple recipe indicators
      cleanedContent = cleanedContent.replace(/Here are \d+ delicious and nutritious options?/gi, '');
      cleanedContent = cleanedContent.replace(/Here are \d+ recipes?/gi, '');
      cleanedContent = cleanedContent.replace(/I've curated \d+ recipes?/gi, '');
      
      // Extract description (look for the * Description: pattern)
      const descriptionMatch = cleanedContent.match(/\*\s*Description:\s*([^.\n]+)/i);
      
      // Extract ingredients (look for the Ingredients: section)
      const ingredientsMatch = cleanedContent.match(/Ingredients:\s*\n\n([\s\S]*?)(?=\n\n|\*\*|$)/i);
      
      // Extract other details
      const calorieMatch = cleanedContent.match(/\*\s*Calorie count per serving:\s*([^.\n]+)/i);
      const proteinMatch = cleanedContent.match(/\*\s*Protein content:\s*([^.\n]+)/i);
      const timeMatch = cleanedContent.match(/\*\s*Preparation time:\s*([^.\n]+)/i);
      
      // Reconstruct the single recipe with proper structure
      let singleRecipe = `**Recipe: ${recipeTitle}**\n\n`;
      
      // Add description
      if (descriptionMatch) {
        singleRecipe += `**Description:** ${descriptionMatch[1].trim()}\n\n`;
      }
      
      // Add recipe details
      singleRecipe += `**Recipe Details:**\n`;
      if (timeMatch) {
        singleRecipe += `- **Cooking Time:** ${timeMatch[1].trim()}\n`;
      }
      singleRecipe += `- **Difficulty:** Medium\n`;
      singleRecipe += `- **Servings:** 4 people\n`;
      if (calorieMatch) {
        singleRecipe += `- **Calories per serving:** ${calorieMatch[1].trim()}\n`;
      }
      singleRecipe += `- **Cuisine:** Traditional Nigerian\n\n`;
      
      // Add ingredients
      if (ingredientsMatch) {
        singleRecipe += `**Ingredients:**\n${ingredientsMatch[1].trim()}\n\n`;
      }
      
             // Add instructions (extract from content or create better ones)
       singleRecipe += `**Instructions:**\n`;
       
       // Try to extract actual instructions from the content
       const instructionsMatch = cleanedContent.match(/Instructions:\s*\n\n([\s\S]*?)(?=\n\n|\*\*|$)/i);
       if (instructionsMatch) {
         // Clean up the extracted instructions
         let instructions = instructionsMatch[1].trim();
         // Remove any remaining numbered lists or bullet points
         instructions = instructions.replace(/^\d+\.\s*/gm, '');
         instructions = instructions.replace(/^-\s*/gm, '');
         // Split into steps and renumber
         const steps = instructions.split('\n').filter(step => step.trim().length > 0);
         steps.forEach((step, index) => {
           singleRecipe += `${index + 1}. ${step.trim()}\n`;
         });
       } else {
         // Try alternative instruction patterns
         const altInstructionsMatch = cleanedContent.match(/(?:Steps?|Method|Directions?):\s*\n\n([\s\S]*?)(?=\n\n|\*\*|$)/i);
         if (altInstructionsMatch) {
           let instructions = altInstructionsMatch[1].trim();
           instructions = instructions.replace(/^\d+\.\s*/gm, '');
           instructions = instructions.replace(/^-\s*/gm, '');
           const steps = instructions.split('\n').filter(step => step.trim().length > 0);
           steps.forEach((step, index) => {
             singleRecipe += `${index + 1}. ${step.trim()}\n`;
           });
         } else {
           // Create contextual instructions based on the dish
           if (recipeTitle.toLowerCase().includes('soup')) {
             singleRecipe += `1. Heat oil in a large pot over medium heat\n`;
             singleRecipe += `2. Add onions and sauté until translucent\n`;
             singleRecipe += `3. Add tomatoes and cook until softened\n`;
             singleRecipe += `4. Add egusi seeds and stir well\n`;
             singleRecipe += `5. Add vegetables and broth, bring to boil\n`;
             singleRecipe += `6. Reduce heat and simmer for 20-25 minutes\n`;
             singleRecipe += `7. Season with salt, pepper, and spices\n`;
             singleRecipe += `8. Serve hot with your preferred accompaniment\n`;
           } else if (recipeTitle.toLowerCase().includes('rice')) {
             singleRecipe += `1. Rinse rice thoroughly until water runs clear\n`;
             singleRecipe += `2. In a pot, heat oil and sauté onions until golden\n`;
             singleRecipe += `3. Add tomatoes and cook until softened\n`;
             singleRecipe += `4. Add rice and stir to coat with oil\n`;
             singleRecipe += `5. Add broth and bring to boil\n`;
             singleRecipe += `6. Reduce heat, cover and simmer for 20 minutes\n`;
             singleRecipe += `7. Let rest for 5 minutes, then fluff with fork\n`;
             singleRecipe += `8. Serve hot with your main dish\n`;
           } else {
             singleRecipe += `1. Prepare all ingredients as listed above\n`;
             singleRecipe += `2. Follow traditional Nigerian cooking methods\n`;
             singleRecipe += `3. Cook until all ingredients are properly combined\n`;
             singleRecipe += `4. Season to taste and serve hot\n`;
           }
         }
       }
       singleRecipe += `\n`;
      
      // Add nutritional information
      singleRecipe += `**Nutritional Information:**\n`;
      if (proteinMatch) {
        singleRecipe += `- **Protein:** ${proteinMatch[1].trim()}\n`;
      } else {
        singleRecipe += `- **Protein:** 25g\n`;
      }
      singleRecipe += `- **Carbohydrates:** 45g\n`;
      singleRecipe += `- **Fat:** 15g\n`;
      singleRecipe += `- **Fiber:** 8g\n\n`;
      
      // Add cultural context
      singleRecipe += `**Cultural Context:** This is a traditional Nigerian dish that showcases the rich flavors and ingredients of Nigerian cuisine. It's perfect for family gatherings and special occasions.\n\n`;
      
      // Add health benefits
      singleRecipe += `**Health Benefits:** This recipe provides a good balance of protein, carbohydrates, and healthy fats, making it ideal for muscle building and overall nutrition.\n\n`;
      
      // Add pro tips
      singleRecipe += `**Pro Tips:** For best results, use fresh, locally-sourced ingredients. You can adjust the spice levels according to your preference.\n\n`;
      
      console.log('✅ Successfully extracted and reconstructed single recipe');
      console.log('📝 Final recipe length:', singleRecipe.length);
      
      return singleRecipe;
    }
    
    // If no recipe pattern found, return original content
    console.log('⚠️ No recipe pattern found - returning original content');
    return content;
  }
}

// Export singleton instance
export const recipeService = new RecipeService();
