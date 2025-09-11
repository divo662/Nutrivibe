import { ProfileRow, MealPlanRequest } from './types';
import { AIService } from './core';

const aiService = new AIService();

export class MealPlanService {
  async generateMealPlan(
    userId: string,
    profile: ProfileRow,
    options: MealPlanRequest
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const prompt = this.buildMealPlanPrompt(profile, options);
      
      const response = await aiService.generateContent({
      userId,
      feature: 'meal_plan_generation',
      prompt,
        userProfile: profile as any,
      additionalContext: {
          options
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Generation failed');
      }

      return { success: true, content: response.content };
    } catch (error) {
      console.error('Error generating meal plan:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async customizeMealPlan(
    userId: string,
    profile: ProfileRow,
    currentMealPlan: string,
    customizationRequest: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const prompt = this.buildCustomizationPrompt(profile, currentMealPlan, customizationRequest);
      
      const response = await aiService.generateContent({
      userId,
      feature: 'meal_plan_customization',
      prompt,
        userProfile: profile as any,
      additionalContext: {
        currentMealPlan,
          customizationRequest
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Customization failed');
      }

      return { success: true, content: response.content };
    } catch (error) {
      console.error('Error customizing meal plan:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async generateBudgetOptimizedPlan(
    userId: string,
    profile: ProfileRow,
    options: MealPlanRequest & { budget: 'low' | 'medium' | 'high' }
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const prompt = this.buildBudgetOptimizationPrompt(profile, options);
      
      const response = await aiService.generateContent({
        userId,
        feature: 'meal_plan_generation',
        prompt,
        userProfile: profile as any,
        additionalContext: {
          options,
          budgetFocus: options.budget
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Budget optimization failed');
      }

      return { success: true, content: response.content };
    } catch (error) {
      console.error('Error generating budget meal plan:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async generateQuickMealPlan(
    userId: string,
    profile: ProfileRow,
    options: MealPlanRequest & { mealPrepTime: 'quick' | 'moderate' | 'extensive' }
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const prompt = this.buildQuickMealPlanPrompt(profile, options);
      
      const response = await aiService.generateContent({
      userId,
        feature: 'meal_plan_generation',
      prompt,
        userProfile: profile as any,
      additionalContext: {
          options,
          timeFocus: options.mealPrepTime
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Quick meal plan generation failed');
      }

      return { success: true, content: response.content };
    } catch (error) {
      console.error('Error generating quick meal plan:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private buildMealPlanPrompt(profile: ProfileRow, options: MealPlanRequest): string {
    const budgetText = {
      low: 'budget-friendly (₦500-₦1000 per day)',
      medium: 'moderate budget (₦1000-₦2000 per day)',
      high: 'premium ingredients (₦2000+ per day)'
    }[options.budget];

    const prepTimeText = {
      quick: 'quick preparation (15-30 minutes)',
      moderate: 'moderate preparation (30-60 minutes)',
      extensive: 'detailed preparation (60+ minutes)'
    }[options.mealPrepTime];

    return `Create a ${options.days}-day meal plan for ${profile.full_name} with the following requirements:

## **Profile Information**
- **Fitness Goal**: ${profile.fitness_goal}
- **Dietary Preference**: ${profile.dietary_preference}
- **Allergies**: ${profile.allergies?.join(', ') || 'None'}
- **Location**: ${profile.location}
- **Daily Calories**: ${profile.caloric_needs} calories
- **Budget**: ${budgetText}
- **Prep Time**: ${prepTimeText}

## **IMPORTANT: Profile-Based Substitutions**
If any requested meals or ingredients conflict with the user's dietary preferences or allergies, you MUST:
1. Clearly explain WHY you're making substitutions
2. Provide suitable alternatives that align with their profile
3. Explain the nutritional benefits of the substitutions
4. Ensure the alternatives still achieve their fitness goals

For example, if they request meat but their profile shows "vegetarian", explain:
"Since your profile indicates you follow a vegetarian diet, I've replaced [meat item] with [vegetarian alternative] because [reason]. This substitution provides [nutritional benefits] while maintaining the protein content needed for your ${profile.fitness_goal} goal."

## **Requirements**
- Focus on Nigerian cuisine and local ingredients
- Ensure nutritional balance for ${profile.fitness_goal}
- Include detailed cooking instructions
- Provide accurate calorie counts per meal
- Suggest local ingredient alternatives
- Include meal prep tips and storage advice
- Start with a brief explanation of any profile-based substitutions made

## **Output Format**
Please structure your response with clear markdown formatting:

# 🍽️ **${options.days}-Day Meal Plan for ${profile.full_name}**

## 📊 **Nutritional Overview**
- **Daily Target**: ${profile.caloric_needs} calories
- **Goal**: ${profile.fitness_goal}
- **Dietary**: ${profile.dietary_preference}
- **Budget**: ${budgetText}

---

## **Day 1 - [Day Name]**
### 🌅 **Breakfast** (XX calories)
**Ingredients:**
- Ingredient 1 (quantity)
- Ingredient 2 (quantity)

**Instructions:**
1. Step 1
2. Step 2

**Nutritional Notes:** Protein: XXg, Carbs: XXg, Fat: XXg

### 🍽️ **Lunch** (XX calories)
[Same structure as breakfast]

### 🍎 **Snack** (XX calories)
[Same structure as breakfast]

### 🌙 **Dinner** (XX calories)
[Same structure as breakfast]

**Daily Total: XXX calories**

---

[Repeat for each day]

## 🛒 **Shopping List**
### **Proteins**
- Item 1 (quantity needed for ${options.days} days)
- Item 2 (quantity needed for ${options.days} days)

### **Vegetables**
- Item 1 (quantity needed for ${options.days} days)
- Item 2 (quantity needed for ${options.days} days)

### **Grains & Staples**
- Item 1 (quantity needed for ${options.days} days)
- Item 2 (quantity needed for ${options.days} days)

### **Dairy & Alternatives**
- Item 1 (quantity needed for ${options.days} days)
- Item 2 (quantity needed for ${options.days} days)

### **Spices & Seasonings**
- Item 1 (quantity needed for ${options.days} days)
- Item 2 (quantity needed for ${options.days} days)

## 💡 **Meal Prep Tips**
- Tip 1
- Tip 2
- Tip 3

## 🔄 **Substitutions & Alternatives**
- **For [allergy/restriction]**: Use [alternative] instead of [original]
- **Budget-friendly**: [cheaper alternative] instead of [expensive item]
- **Quick prep**: [pre-made option] instead of [from scratch]

## 📈 **Weekly Nutritional Summary**
- **Average Daily Calories**: XXX
- **Protein Range**: XX-XXg
- **Carb Range**: XX-XXg
- **Fat Range**: XX-XXg
- **Fiber Range**: XX-XXg

## 🌟 **Cultural Notes**
- Note about Nigerian cuisine traditions
- Local ingredient benefits
- Seasonal considerations

---

**Generated on**: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Please ensure all meals are practical, culturally appropriate, and nutritionally balanced.`;
  }

  private buildCustomizationPrompt(profile: ProfileRow, currentMealPlan: string, customizationRequest: string): string {
    return `I have an existing meal plan that I'd like to customize. Here's the current plan:

${currentMealPlan}

## **Customization Request**
${customizationRequest}

## **User Profile Context**
- **Fitness Goal**: ${profile.fitness_goal}
- **Dietary Preference**: ${profile.dietary_preference}
- **Allergies**: ${profile.allergies?.join(', ') || 'None'}
- **Location**: ${profile.location}

## **IMPORTANT: Profile-Based Changes**
When making changes based on the customization request, always explain:
1. WHY you're making each change
2. How the change aligns with their dietary preferences/allergies
3. The nutritional impact of any substitutions
4. How the change addresses their specific request

## **Requirements**
- Maintain the same markdown structure and formatting
- Keep the same level of detail and organization
- Ensure all changes align with the original nutritional goals
- Preserve the Nigerian cuisine focus and local ingredients
- Update any affected sections (shopping list, prep tips, etc.)
- Start with a clear explanation of the changes made and why they were necessary

Please provide the updated meal plan with the requested changes while maintaining the same professional format and structure.`;
  }

  private buildBudgetOptimizationPrompt(profile: ProfileRow, options: MealPlanRequest & { budget: 'low' | 'medium' | 'high' }): string {
    const budgetText = {
      low: 'budget-friendly (₦500-₦1000 per day)',
      medium: 'moderate budget (₦1000-₦2000 per day)',
      high: 'premium ingredients (₦2000+ per day)'
    }[options.budget];

    return `Create a ${options.days}-day budget-optimized meal plan for ${profile.full_name} with the following requirements:

## **Profile Information**
- **Fitness Goal**: ${profile.fitness_goal}
- **Dietary Preference**: ${profile.dietary_preference}
- **Allergies**: ${profile.allergies?.join(', ') || 'None'}
- **Location**: ${profile.location}
- **Daily Calories**: ${profile.caloric_needs} calories
- **Budget Focus**: ${budgetText}
- **Prep Time**: ${options.mealPrepTime}

## **Budget Optimization Requirements**
- Focus on cost-effective ingredients
- Suggest bulk buying opportunities
- Include seasonal produce recommendations
- Provide money-saving meal prep tips
- Suggest affordable protein alternatives
- Include cost breakdown per meal

## **Output Format**
Use the same detailed markdown structure as the main meal plan generator, but with additional budget-focused sections:

- **Cost per meal** estimates
- **Bulk buying tips**
- **Seasonal savings**
- **Leftover utilization ideas**
- **Budget-friendly substitutions**

Please ensure the plan is both affordable and nutritionally complete.`;
  }

  private buildQuickMealPlanPrompt(profile: ProfileRow, options: MealPlanRequest & { mealPrepTime: 'quick' | 'moderate' | 'extensive' }): string {
    const prepTimeText = {
      quick: 'quick preparation (15-30 minutes)',
      moderate: 'moderate preparation (30-60 minutes)',
      extensive: 'detailed preparation (60+ minutes)'
    }[options.mealPrepTime];

    return `Create a ${options.days}-day time-efficient meal plan for ${profile.full_name} with the following requirements:

## **Profile Information**
- **Fitness Goal**: ${profile.fitness_goal}
- **Dietary Preference**: ${profile.dietary_preference}
- **Allergies**: ${profile.allergies?.join(', ') || 'None'}
- **Location**: ${profile.location}
- **Daily Calories**: ${profile.caloric_needs} calories
- **Budget**: ${options.budget}
- **Prep Time Focus**: ${prepTimeText}

## **Time Efficiency Requirements**
- Minimize cooking time per meal
- Include make-ahead options
- Suggest time-saving kitchen hacks
- Provide batch cooking strategies
- Include quick-cook ingredient alternatives
- Add meal prep timeline

## **Output Format**
Use the same detailed markdown structure as the main meal plan generator, but with additional time-focused sections:

- **Prep time per meal**
- **Make-ahead instructions**
- **Batch cooking tips**
- **Quick-cook alternatives**
- **Meal prep timeline**
- **Storage and reheating tips**

Please ensure the plan is both time-efficient and nutritionally balanced.`;
  }
}

export const mealPlanService = new MealPlanService();
