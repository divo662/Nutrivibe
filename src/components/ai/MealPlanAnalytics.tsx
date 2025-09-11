import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Apple, 
  Calendar, 
  BarChart3,
  Leaf,
  Zap,
  Heart
} from 'lucide-react';

interface MealPlanAnalyticsProps {
  mealPlans: any[];
  userProfile: any;
}

export default function MealPlanAnalytics({ mealPlans, userProfile }: MealPlanAnalyticsProps) {
  // Calculate analytics from meal plan data
  const calculateAnalytics = () => {
    if (!mealPlans.length) return null;
    
    console.log('Calculating analytics for meal plans:', mealPlans);
    console.log('User profile:', userProfile);

    let totalCalories = 0;
    let totalDays = 0;
    let uniqueIngredients = new Set<string>();
    let mealVariety = new Set<string>();
    let culturalDiversity = new Set<string>();

    mealPlans.forEach(plan => {
      try {
        let data = plan.data;
        
        // Handle different data formats
        if (typeof data === 'string') {
          // Try to parse as JSON first
          try {
            data = JSON.parse(data);
          } catch {
            // If JSON parsing fails, treat as raw markdown
            data = { raw: data };
          }
        }
        
        // Extract data from raw markdown if available
        if (data.raw) {
          const markdownContent = data.raw;
          
          // Extract calories from markdown content
          const calorieMatches = markdownContent.match(/(\d+)\s*calories?/gi);
          if (calorieMatches) {
            calorieMatches.forEach(match => {
              const calories = parseInt(match.match(/\d+/)?.[0] || '0');
              totalCalories += calories;
            });
          }
          
          // Also look for calorie information in meal descriptions
          const mealCalorieMatches = markdownContent.match(/\((\d+)\s*calories?\)/gi);
          if (mealCalorieMatches) {
            mealCalorieMatches.forEach(match => {
              const calories = parseInt(match.match(/\d+/)?.[0] || '0');
              totalCalories += calories;
            });
          }
          
          // Extract ingredients from bullet points and shopping list
          const ingredientMatches = markdownContent.match(/^\s*[\*\-]\s*(.+)$/gm);
          if (ingredientMatches) {
            ingredientMatches.forEach(match => {
              const ingredient = match.replace(/^\s*[\*\-]\s*/, '').trim();
              if (ingredient && 
                  !ingredient.toLowerCase().includes('calories') && 
                  !ingredient.toLowerCase().includes('tip') &&
                  !ingredient.toLowerCase().includes('prep') &&
                  ingredient.length > 2) {
                uniqueIngredients.add(ingredient.toLowerCase());
              }
            });
          }
          
          // Also extract ingredients from the shopping list section
          const shoppingListMatch = markdownContent.match(/Grocery Shopping List:(.*?)(?=\*\*|$)/s);
          if (shoppingListMatch) {
            const shoppingList = shoppingListMatch[1];
            const shoppingItems = shoppingList.match(/^\s*[\*\-]\s*(.+)$/gm);
            if (shoppingItems) {
              shoppingItems.forEach(item => {
                const ingredient = item.replace(/^\s*[\*\-]\s*/, '').trim();
                if (ingredient && ingredient.length > 2) {
                  uniqueIngredients.add(ingredient.toLowerCase());
                }
              });
            }
          }
          
          // Extract meal types
          const mealTypeMatches = markdownContent.match(/^(Breakfast|Lunch|Dinner|Snack):/gmi);
          if (mealTypeMatches) {
            mealTypeMatches.forEach(match => {
              mealVariety.add(match.replace(':', '').trim());
            });
          }
          
          // Count days
          const dayMatches = markdownContent.match(/^Day\s+\d+/gmi);
          if (dayMatches) {
            totalDays += dayMatches.length;
          } else {
            // If no explicit days, estimate based on meal types
            const mealCount = (markdownContent.match(/^(Breakfast|Lunch|Dinner|Snack):/gmi) || []).length;
            totalDays += Math.ceil(mealCount / 4); // Assume 4 meals per day
          }
          
          // Extract cultural context from Nigerian ingredients
          const nigerianIngredients = [
            'jollof', 'egusi', 'ogbono', 'akara', 'moi moi', 'suya', 'plantain',
            'yam', 'cassava', 'palm oil', 'coconut', 'pepper soup', 'banga soup'
          ];
          
          nigerianIngredients.forEach(ingredient => {
            if (markdownContent.toLowerCase().includes(ingredient)) {
              culturalDiversity.add('Nigerian');
            }
          });
          
          // Add other cultural indicators
          if (markdownContent.toLowerCase().includes('quinoa') || markdownContent.toLowerCase().includes('avocado')) {
            culturalDiversity.add('International');
          }
          
        } else if (data.days) {
          // Handle structured data if available
          data.days.forEach((day: any) => {
            if (day.totalCalories) totalCalories += day.totalCalories;
            totalDays++;
            
            if (day.meals) {
              day.meals.forEach((meal: any) => {
                if (meal.calories) totalCalories += meal.calories;
                if (meal.ingredients) {
                  meal.ingredients.forEach((ingredient: string) => {
                    uniqueIngredients.add(ingredient.toLowerCase());
                  });
                }
                if (meal.name) mealVariety.add(meal.name);
                if (meal.culturalContext) culturalDiversity.add(meal.culturalContext);
              });
            }
          });
        }
        
        // Extract calories from plan metadata if available
        if (plan.estimated_calories && plan.estimated_calories > 0) {
          totalCalories += plan.estimated_calories;
        }
        
        // Extract days from plan metadata if available
        if (plan.total_days && plan.total_days > 0) {
          totalDays += plan.total_days;
        }
        
        // If we still don't have calories, use a default estimate based on the plan
        if (totalCalories === 0 && plan.data) {
          // Estimate calories based on typical meal plan structure
          const estimatedCaloriesPerDay = 2000; // Default estimate
          const estimatedDays = plan.total_days || 3; // Default to 3 days
          totalCalories += estimatedCaloriesPerDay * estimatedDays;
        }
        
      } catch (error) {
        console.error('Error parsing meal plan data:', error);
      }
    });

    // Calculate averages
    const avgCalories = totalDays > 0 ? totalCalories / totalDays : 0;
    const ingredientDiversity = uniqueIngredients.size;
    const mealDiversity = mealVariety.size;
    const culturalDiversityScore = culturalDiversity.size;

    const result = {
      avgCalories: Math.round(avgCalories),
      ingredientDiversity,
      mealDiversity,
      culturalDiversityScore,
      totalPlans: mealPlans.length,
      totalDays,
      totalCalories
    };
    
    console.log('Analytics result:', result);
    console.log('Unique ingredients found:', Array.from(uniqueIngredients));
    console.log('Meal types found:', Array.from(mealVariety));
    console.log('Cultural diversity found:', Array.from(culturalDiversity));
    
    return result;
  };

  const analytics = calculateAnalytics();

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Meal Plan Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Generate your first meal plan to see analytics and insights
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress towards fitness goals
  const calculateGoalProgress = () => {
    if (!userProfile?.fitness_goal) return null;

    const goal = userProfile.fitness_goal;
    const currentCalories = analytics.avgCalories;
    
    let targetCalories = 2000; // Default
    let progress = 0;
    
    switch (goal) {
      case 'weight_loss':
        targetCalories = 1800;
        progress = Math.min(100, (currentCalories / targetCalories) * 100);
        break;
      case 'muscle_gain':
        targetCalories = 2500;
        progress = Math.min(100, (currentCalories / targetCalories) * 100);
        break;
      case 'maintenance':
        targetCalories = 2000;
        progress = Math.min(100, (currentCalories / targetCalories) * 100);
        break;
      default:
        return null;
    }

    // Ensure progress is at least 1% if we have any calories
    if (currentCalories > 0 && progress === 0) {
      progress = 1;
    }

    return { targetCalories, progress, goal };
  };

  const goalProgress = calculateGoalProgress();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Meal Plan Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalPlans}</div>
              <div className="text-sm text-gray-600">Total Plans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.avgCalories > 0 ? analytics.avgCalories : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">
                {analytics.totalDays > 0 ? `Avg Calories (${analytics.totalDays} days)` : 'Avg Calories'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.ingredientDiversity}</div>
              <div className="text-sm text-gray-600">Unique Ingredients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.mealDiversity}</div>
              <div className="text-sm text-gray-600">Meal Types</div>
            </div>
          </div>
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
              <div>Debug: Total Calories: {analytics.totalCalories}, Total Days: {analytics.totalDays}</div>
              <div>Cultural Diversity: {analytics.culturalDiversityScore} types</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Progress */}
      {goalProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress: {goalProgress.goal.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Calorie Target</span>
              <span className="text-sm text-gray-600">
                {analytics.avgCalories} / {goalProgress.targetCalories} cal
              </span>
            </div>
            <Progress value={goalProgress.progress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              {goalProgress.progress >= 100 ? 'Target exceeded!' : `${Math.round(goalProgress.progress)}% of target`}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diversity Scoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Meal Diversity Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ingredient Variety</span>
              <Badge variant={analytics.ingredientDiversity > 20 ? 'default' : 'secondary'}>
                {analytics.ingredientDiversity > 20 ? 'Excellent' : 'Good'}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, (analytics.ingredientDiversity / 30) * 100)} 
              className="h-2" 
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Meal Variety</span>
              <Badge variant={analytics.mealDiversity > 15 ? 'default' : 'secondary'}>
                {analytics.mealDiversity > 15 ? 'Excellent' : 'Good'}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, (analytics.mealDiversity / 20) * 100)} 
              className="h-2" 
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cultural Diversity</span>
              <Badge variant={analytics.culturalDiversityScore > 3 ? 'default' : 'secondary'}>
                {analytics.culturalDiversityScore > 3 ? 'Excellent' : 'Good'}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, (analytics.culturalDiversityScore / 5) * 100)} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.ingredientDiversity < 20 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Apple className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Increase Ingredient Variety</p>
                <p className="text-sm text-blue-600">
                  Try adding more diverse ingredients to improve nutritional balance
                </p>
              </div>
            </div>
          )}
          
          {analytics.mealDiversity < 15 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Explore New Meal Types</p>
                <p className="text-sm text-green-600">
                  Consider trying different cuisines and cooking methods
                </p>
              </div>
            </div>
          )}
          
          {goalProgress && goalProgress.progress < 80 && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <Target className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Adjust Calorie Intake</p>
                <p className="text-sm text-orange-600">
                  Your current intake is {Math.round(goalProgress.progress)}% of your {goalProgress.goal} goal
                </p>
              </div>
            </div>
          )}
          
          {analytics.totalPlans >= 5 && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-purple-800">Great Consistency!</p>
                <p className="text-sm text-purple-600">
                  You've created {analytics.totalPlans} meal plans. Keep up the great work!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

