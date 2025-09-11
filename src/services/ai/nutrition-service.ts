import { aiService } from './core';
import { 
  AIGenerationRequest, 
  AIGenerationResponse, 
  NutritionEducationRequest,
  AIUserProfile 
} from './types';

/**
 * AI Nutrition Education Service for NutriVibe
 * Provides personalized nutrition education in Nigerian context
 */
export class NutritionService {
  
  /**
   * Get personalized nutrition education
   */
  async getNutritionEducation(
    userId: string,
    userProfile: AIUserProfile,
    request: NutritionEducationRequest
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildNutritionPrompt(userProfile, request);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'nutrition_education',
      prompt,
      userProfile,
      additionalContext: {
        topic: request.topic,
        difficulty: request.difficulty,
        culturalContext: request.culturalContext,
        practicalExamples: request.practicalExamples
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Get personalized health advice
   */
  async getHealthAdvice(
    userId: string,
    userProfile: AIUserProfile,
    healthQuestion: string
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildHealthAdvicePrompt(userProfile, healthQuestion);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'nutrition_education',
      prompt,
      userProfile,
      additionalContext: {
        healthQuestion,
        requestType: 'health_advice'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Get meal timing and portion control advice
   */
  async getMealTimingAdvice(
    userId: string,
    userProfile: AIUserProfile,
    schedule: string
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildMealTimingPrompt(userProfile, schedule);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'nutrition_education',
      prompt,
      userProfile,
      additionalContext: {
        schedule,
        requestType: 'meal_timing'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Get supplement and vitamin advice
   */
  async getSupplementAdvice(
    userId: string,
    userProfile: AIUserProfile,
    currentSupplements: string[]
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildSupplementPrompt(userProfile, currentSupplements);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'nutrition_education',
      prompt,
      userProfile,
      additionalContext: {
        currentSupplements,
        requestType: 'supplement_advice'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Build nutrition education prompt
   */
  private buildNutritionPrompt(userProfile: AIUserProfile, request: NutritionEducationRequest): string {
    const { topic, difficulty, culturalContext, practicalExamples } = request;
    
    return `Provide personalized nutrition education about "${topic}" tailored to my needs and cultural background.

**My Profile:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**Education Requirements:**
- Topic: ${topic}
- Difficulty Level: ${difficulty}
- Include Cultural Context: ${culturalContext ? 'Yes' : 'No'}
- Include Practical Examples: ${practicalExamples ? 'Yes' : 'No'}

**Please provide:**

1. **Core Concept Explanation:**
   - Clear, ${difficulty}-level explanation of ${topic}
   - How it relates to my fitness goal (${userProfile.fitness_goal || 'Not specified'})
   - Why it's important for my health journey
   - Common misconceptions and clarifications

2. **Nigerian Cultural Context** (if requested):
   - How ${topic} relates to traditional Nigerian eating habits
   - Cultural foods that support or challenge this concept
   - Traditional cooking methods and their nutritional impact
   - Regional variations across Nigeria

3. **Practical Applications:**
   - How to apply ${topic} to my daily meals
   - Specific Nigerian food examples and modifications
   - Meal planning strategies for my dietary needs
   - Shopping and cooking tips

4. **Personalized Recommendations:**
   - How ${topic} affects my specific dietary restrictions
   - Portion control strategies for my caloric needs
   - Meal timing recommendations for my schedule
   - Progress tracking methods

5. **Local Resources and Alternatives:**
   - Nigerian ingredients that support this concept
   - Local market shopping tips
   - Budget-friendly alternatives
   - Seasonal considerations

**Important Guidelines:**
- Use simple, clear language appropriate for ${difficulty} level
- Include practical, actionable advice
- Consider my dietary restrictions and preferences
- Provide Nigerian cultural context when relevant
- Use local food examples and ingredients
- Ensure advice aligns with my fitness goals
- Include meal prep and cooking tips

Please make the information practical, culturally relevant, and personally applicable to my nutrition journey.`;
  }

  /**
   * Build health advice prompt
   */
  private buildHealthAdvicePrompt(userProfile: AIUserProfile, healthQuestion: string): string {
    
    return `I have a health question: ${healthQuestion}

**My Profile:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**Please provide personalized health advice that:**

1. **Addresses My Specific Question:**
   - Direct answer to my health concern
   - How it relates to my current profile
   - Potential causes and solutions
   - When to seek professional medical help

2. **Considers My Profile:**
   - How my fitness goal affects this issue
   - Dietary restrictions and modifications needed
   - Allergy considerations and alternatives
   - Caloric needs and meal timing

3. **Provides Cultural Context:**
   - Nigerian cultural perspectives on this health topic
   - Traditional remedies and their effectiveness
   - Local food solutions and alternatives
   - Cultural eating patterns and modifications

4. **Offers Practical Solutions:**
   - Specific meal and snack suggestions
   - Cooking and preparation methods
   - Shopping and ingredient recommendations
   - Lifestyle and habit changes

5. **Includes Safety Guidelines:**
   - Warning signs to watch for
   - When to consult healthcare professionals
   - Safe vs. unsafe practices
   - Emergency situations to be aware of

**Important Guidelines:**
- Provide evidence-based advice
- Consider my cultural background
- Include practical, actionable steps
- Address safety and medical concerns
- Use local Nigerian examples
- Ensure advice aligns with my goals
- Include both immediate and long-term solutions

Please provide comprehensive, culturally-aware health advice that addresses my specific question while considering my personal profile and Nigerian cultural context.`;
  }

  /**
   * Build meal timing advice prompt
   */
  private buildMealTimingPrompt(userProfile: AIUserProfile, schedule: string): string {
    
    return `I need advice on meal timing and portion control based on my schedule: ${schedule}

**My Profile:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**Please provide personalized meal timing advice that:**

1. **Optimizes My Schedule:**
   - Best meal times based on my daily routine
   - Pre and post-activity nutrition timing
   - Snack timing for energy maintenance
   - Meal prep scheduling recommendations

2. **Supports My Fitness Goal:**
   - How meal timing affects ${userProfile.fitness_goal || 'my goals'}
   - Pre-workout and post-workout nutrition
   - Recovery meal timing
   - Metabolism optimization strategies

3. **Portion Control Strategies:**
   - How to estimate portions using Nigerian foods
   - Visual portion guides with local examples
   - Plate composition for balanced meals
   - Calorie distribution throughout the day

4. **Cultural Meal Timing:**
   - Traditional Nigerian meal timing patterns
   - Cultural significance of meal timing
   - Local food preparation timing
   - Seasonal eating patterns

5. **Practical Implementation:**
   - Meal prep schedules for my routine
   - Quick meal options for busy times
   - Storage and reheating tips
   - Shopping and planning strategies

**Important Guidelines:**
- Consider my daily schedule and routine
- Provide practical, achievable timing
- Include Nigerian cultural context
- Address my dietary restrictions
- Ensure advice supports my fitness goals
- Include meal prep and planning tips
- Consider local food availability

Please provide practical meal timing and portion control advice that fits my schedule while supporting my health goals and respecting Nigerian cultural eating patterns.`;
  }

  /**
   * Build supplement advice prompt
   */
  private buildSupplementPrompt(userProfile: AIUserProfile, currentSupplements: string[]): string {
    
    return `I need advice about supplements and vitamins. I'm currently taking: ${currentSupplements.join(', ') || 'No supplements'}

**My Profile:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**Please provide personalized supplement advice that:**

1. **Evaluates My Current Supplements:**
   - Effectiveness of what I'm currently taking
   - Potential interactions or side effects
   - Dosage recommendations and timing
   - Quality indicators and brands

2. **Addresses My Specific Needs:**
   - Supplements that support my fitness goal
   - Nutritional gaps in my current diet
   - Allergy-safe supplement options
   - Local availability considerations

3. **Provides Natural Alternatives:**
   - Nigerian foods rich in specific nutrients
   - Traditional remedies and their effectiveness
   - Local ingredient alternatives to supplements
   - Seasonal food sources for vitamins

4. **Safety and Quality Guidelines:**
   - How to choose safe supplements
   - Warning signs and side effects
   - When to consult healthcare professionals
   - Quality testing and certification

5. **Implementation Strategy:**
   - Recommended supplement schedule
   - Meal timing for optimal absorption
   - Storage and handling tips
   - Progress monitoring methods

**Important Guidelines:**
- Prioritize food-based nutrition over supplements
- Consider local supplement availability
- Address safety and quality concerns
- Include Nigerian cultural context
- Ensure advice aligns with my goals
- Provide evidence-based recommendations
- Include both immediate and long-term strategies

Please provide comprehensive supplement advice that considers my current regimen, health goals, and Nigerian cultural context while prioritizing natural, food-based nutrition solutions.`;
  }

  /**
   * Get personalized nutrition quiz
   */
  async getNutritionQuiz(
    userId: string,
    userProfile: AIUserProfile,
    quizType: 'basic' | 'intermediate' | 'advanced'
  ): Promise<AIGenerationResponse> {
    
    const prompt = this.buildQuizPrompt(userProfile, quizType);
    
    const aiRequest: AIGenerationRequest = {
      userId,
      feature: 'nutrition_education',
      prompt,
      userProfile,
      additionalContext: {
        quizType,
        requestType: 'nutrition_quiz'
      }
    };

    return await aiService.generateContent(aiRequest);
  }

  /**
   * Build nutrition quiz prompt
   */
  private buildQuizPrompt(userProfile: AIUserProfile, quizType: string): string {
    
    return `Create a personalized nutrition quiz for me at the ${quizType} level.

**My Profile:**
- Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
- Dietary Preference: ${userProfile.dietary_preference || 'None'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None'}
- Location: ${userProfile.location || 'Nigeria'}
- Caloric Needs: ${userProfile.caloric_needs || 'Not specified'} calories/day

**Please create a ${quizType}-level quiz that:**

1. **Quiz Structure:**
   - 10 multiple-choice questions
   - 5 true/false questions
   - 3 scenario-based questions
   - Difficulty appropriate for ${quizType} level

2. **Content Focus:**
   - Nigerian cuisine and nutrition
   - My specific fitness goal (${userProfile.fitness_goal || 'general health'})
   - Dietary restrictions and alternatives
   - Local ingredient knowledge
   - Cultural food practices

3. **Question Types:**
   - Basic nutrition concepts
   - Nigerian food identification
   - Meal planning scenarios
   - Portion control examples
   - Cultural food significance

4. **Answer Explanations:**
   - Detailed explanations for each answer
   - How answers relate to my profile
   - Practical applications for daily life
   - Cultural context and significance

5. **Learning Outcomes:**
   - What I'll learn from this quiz
   - How to apply knowledge to my goals
   - Next steps for nutrition education
   - Resources for further learning

**Important Guidelines:**
- Make questions relevant to my profile
- Include Nigerian cultural context
- Ensure appropriate difficulty level
- Provide educational explanations
- Include practical applications
- Consider my dietary restrictions
- Make it engaging and informative

Please create an educational, culturally-relevant nutrition quiz that helps me learn while having fun and advancing my nutrition knowledge.`;
  }
}

// Export singleton instance
export const nutritionService = new NutritionService();
