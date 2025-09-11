import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AIPersistenceService } from '@/services/aiPersistenceService';
import { 
  Calendar, 
  Clock, 
  Target, 
  Utensils, 
  ShoppingCart, 
  Lightbulb, 
  RefreshCw, 
  TrendingUp,
  MapPin,
  Heart,
  Zap,
  ChefHat,
  Leaf,
  Scale,
  Timer
} from 'lucide-react';

interface MealPlanData {
  summary?: string;
  nutritionalGoals?: string;
  raw?: string; // For backward compatibility with old data format
  days?: Array<{
    day: string;
    date?: string;
    totalCalories: number;
    meals: Array<{
      mealType: string;
      name: string;
      description: string;
      calories: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      prepTime?: number;
      cookingTime?: number;
      difficulty?: string;
      ingredients: string[];
      instructions: string[];
      nutritionalNotes?: string;
      culturalContext?: string;
    }>;
  }>;
  shoppingList?: {
    categories: Array<{
      category: string;
      items: Array<{
        name: string;
        quantity: string;
        notes?: string;
      }>;
    }>;
  };
  mealPrepTips?: string[];
  culturalNotes?: string[];
  substitutions?: Array<{
    original: string;
    alternative: string;
    reason: string;
  }>;
  weeklyNutritionalSummary?: {
    averageCalories: number;
    proteinRange: string;
    carbRange: string;
    fatRange: string;
    fiberRange: string;
  };
}

interface StructuredMealPlanDisplayProps {
  mealPlanData: any;
  title?: string;
}

const StructuredMealPlanDisplay: React.FC<StructuredMealPlanDisplayProps> = ({ 
  mealPlanData, 
  title = "Meal Plan" 
}) => {
  console.log('StructuredMealPlanDisplay received data:', typeof mealPlanData, mealPlanData?.substring?.(0, 200));
  
  // Try to parse the data if it's a string
  let data: MealPlanData;
  let isRawMarkdown = false;
  
  if (typeof mealPlanData === 'string') {
    try {
      // Try to parse as JSON first
      data = JSON.parse(mealPlanData);
      console.log('Parsed as JSON:', data);
    } catch {
      // If it's not JSON, try to parse as markdown using the service
      console.log('Attempting to parse markdown content...');
      const parsedData = AIPersistenceService.parseMarkdownMealPlan(mealPlanData);
      if (parsedData && parsedData.days && parsedData.days.length > 0) {
        console.log('Successfully parsed markdown:', parsedData);
        data = parsedData;
      } else {
        console.log('Failed to parse markdown, falling back to raw display');
        isRawMarkdown = true;
      }
    }
  } else {
    data = mealPlanData;
    console.log('Data is object:', data);
  }

  // Handle the case where data is stored in the old format with 'raw' field
  if (data && data.raw && typeof data.raw === 'string') {
    isRawMarkdown = true;
    mealPlanData = data.raw;
  }

  // If we have raw markdown, or we can derive markdown from structured data, render it with proper formatting
  let markdownSource: string | null = null;
  if (!isRawMarkdown && data && Array.isArray(data.days) && data.days.length > 0) {
    markdownSource = buildMarkdownFromStructuredData(title, data);
  }

  if (isRawMarkdown || markdownSource) {
    const markdownToRender = isRawMarkdown ? (typeof mealPlanData === 'string' ? mealPlanData : '') : (markdownSource as string);
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-3">
            <Utensils className="h-8 w-8" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose prose-lg max-w-none">
            {/* Convert markdown to HTML-like structure */}
            <div className="space-y-6">
              {markdownToRender.split('\n').map((line: string, index: number) => {
                const trimmedLine = line.trim();
                
                // Handle headers
                if (trimmedLine.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-3xl font-bold text-primary border-b-2 border-primary/20 pb-2">
                      {trimmedLine.substring(2)}
                    </h1>
                  );
                }
                
                if (trimmedLine.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
                      {trimmedLine.substring(3)}
                    </h2>
                  );
                }
                
                if (trimmedLine.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-xl font-semibold text-gray-700 mt-4 mb-2">
                      {trimmedLine.substring(4)}
                    </h3>
                  );
                }
                
                // Handle bullet points
                if (trimmedLine.startsWith('* **') || trimmedLine.startsWith('- **')) {
                  const content = trimmedLine.substring(trimmedLine.indexOf('**') + 2, trimmedLine.lastIndexOf('**'));
                  const remaining = trimmedLine.substring(trimmedLine.lastIndexOf('**') + 2);
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="font-semibold text-blue-800">{content}</span>
                        <span className="text-gray-700">{remaining}</span>
                      </div>
                    </div>
                  );
                }
                
                if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                  return (
                    <div key={index} className="flex items-start gap-3 p-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{trimmedLine.substring(2)}</span>
                    </div>
                  );
                }
                
                // Handle numbered lists
                if (/^\d+\./.test(trimmedLine)) {
                  const number = trimmedLine.match(/^\d+/)?.[0];
                  const content = trimmedLine.substring(trimmedLine.indexOf('.') + 1).trim();
                  return (
                    <div key={index} className="flex items-start gap-3 p-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs font-bold">
                        {number}
                      </Badge>
                      <span className="text-gray-700">{content}</span>
                    </div>
                  );
                }
                
                // Handle bold text
                if (trimmedLine.includes('**') && trimmedLine.includes('**')) {
                  const parts = trimmedLine.split('**');
                  return (
                    <p key={index} className="text-gray-700">
                      {parts.map((part, partIndex) => 
                        partIndex % 2 === 1 ? (
                          <strong key={partIndex} className="font-semibold text-gray-800">{part}</strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                }
                
                // Handle separators
                if (trimmedLine === '---') {
                  return <Separator key={index} className="my-6" />;
                }
                
                // Handle regular text
                if (trimmedLine && !trimmedLine.startsWith('+')) {
                  return (
                    <p key={index} className="text-gray-700 leading-relaxed">
                      {trimmedLine}
                    </p>
                  );
                }
                
                // Handle ingredient details (lines starting with +)
                if (trimmedLine.startsWith('+ ')) {
                  return (
                    <div key={index} className="flex items-start gap-3 ml-6 p-1">
                      <span className="text-green-600 font-medium">+</span>
                      <span className="text-gray-600 text-sm">{trimmedLine.substring(2)}</span>
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have structured data, render it (legacy visual renderer - normally we convert to markdown above)
  if (data.days && Array.isArray(data.days)) {
    console.log('Rendering structured data with', data.days.length, 'days');
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
              <Utensils className="h-8 w-8" />
              {title}
            </CardTitle>
            {data.summary && (
              <p className="text-lg text-muted-foreground mt-2">
                {data.summary}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Nutritional Goals */}
        {data.nutritionalGoals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-blue-600" />
                Nutritional Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{data.nutritionalGoals}</p>
            </CardContent>
          </Card>
        )}

        {/* Daily Meal Plans */}
        <div className="space-y-6">
          {data.days.map((day, dayIndex) => (
            <Card key={dayIndex} className="border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-primary" />
                    <span>{day.day}</span>
                    {day.date && (
                      <Badge variant="secondary" className="ml-2">
                        {new Date(day.date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-green-600" />
                    <Badge variant="outline" className="font-semibold">
                      {day.totalCalories} calories
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  {day.meals.map((meal, mealIndex) => (
                    <div key={mealIndex} className="border rounded-lg p-4 bg-muted/30">
                      {/* Meal Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getMealTypeColor(meal.mealType)}`}>
                            {getMealTypeIcon(meal.mealType)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{meal.name}</h3>
                            <p className="text-sm text-muted-foreground">{meal.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="text-lg px-3 py-1">
                            {meal.calories} cal
                          </Badge>
                        </div>
                      </div>

                      {/* Nutritional Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {meal.protein && (
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-sm text-muted-foreground">Protein</div>
                            <div className="font-semibold text-blue-600">{meal.protein}g</div>
                          </div>
                        )}
                        {meal.carbs && (
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-sm text-muted-foreground">Carbs</div>
                            <div className="font-semibold text-green-600">{meal.carbs}g</div>
                          </div>
                        )}
                        {meal.fat && (
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-sm text-muted-foreground">Fat</div>
                            <div className="font-semibold text-orange-600">{meal.fat}g</div>
                          </div>
                        )}
                        {meal.fiber && (
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-center p-2 bg-background rounded">
                              <div className="text-sm text-muted-foreground">Fiber</div>
                              <div className="font-semibold text-purple-600">{meal.fiber}g</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Meal Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Ingredients */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-green-600" />
                            Ingredients
                          </h4>
                          <ul className="space-y-2">
                            {meal.ingredients.map((ingredient, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm">{ingredient}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Instructions */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <ChefHat className="h-4 w-4 text-orange-600" />
                            Instructions
                          </h4>
                          <ol className="space-y-2">
                            {meal.instructions.map((instruction, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </Badge>
                                <span className="text-sm">{instruction}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t grid md:grid-cols-3 gap-4 text-sm">
                        {meal.prepTime && (
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-blue-600" />
                            <span>Prep: {meal.prepTime} min</span>
                          </div>
                        )}
                        {meal.cookingTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span>Cook: {meal.cookingTime} min</span>
                          </div>
                        )}
                        {meal.difficulty && (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <span>Difficulty: {meal.difficulty}</span>
                          </div>
                        )}
                      </div>

                      {/* Nutritional Notes */}
                      {meal.nutritionalNotes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-2">💡 Nutritional Notes</h5>
                          <p className="text-sm text-blue-700">{meal.nutritionalNotes}</p>
                        </div>
                      )}

                      {/* Cultural Context */}
                      {meal.culturalContext && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <h5 className="font-semibold text-green-800 mb-2">🌍 Cultural Context</h5>
                          <p className="text-sm text-green-700">{meal.culturalContext}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Shopping List */}
        {data.shoppingList && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Shopping List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.shoppingList.categories.map((category, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2">{category.category}</h4>
                    <ul className="space-y-2">
                      {category.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <input type="checkbox" className="rounded" />
                          <div className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({item.quantity})</span>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meal Prep Tips */}
        {data.mealPrepTips && data.mealPrepTips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Meal Prep Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {data.mealPrepTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cultural Notes */}
        {data.culturalNotes && data.culturalNotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-purple-600" />
                Cultural Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.culturalNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Substitutions */}
        {data.substitutions && data.substitutions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Substitutions & Alternatives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.substitutions.map((sub, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-red-600">{sub.original}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-green-600">{sub.alternative}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Nutritional Summary */}
        {data.weeklyNutritionalSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Weekly Nutritional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {data.weeklyNutritionalSummary.averageCalories}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Calories/Day</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {data.weeklyNutritionalSummary.proteinRange}
                  </div>
                  <div className="text-sm text-muted-foreground">Protein Range</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {data.weeklyNutritionalSummary.carbRange}
                  </div>
                  <div className="text-sm text-muted-foreground">Carb Range</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {data.weeklyNutritionalSummary.fatRange}
                  </div>
                  <div className="text-sm text-muted-foreground">Fat Range</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">
                    {data.weeklyNutritionalSummary.fiberRange}
                  </div>
                  <div className="text-sm text-muted-foreground">Fiber Range</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Fallback for other data types
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
            {typeof mealPlanData === 'string' ? mealPlanData : JSON.stringify(mealPlanData, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions
function buildMarkdownFromStructuredData(title: string, data: MealPlanData): string {
  const lines: string[] = [];
  const safe = (v: unknown) => (v === undefined || v === null ? '' : String(v));

  lines.push(`# ${safe(title)}`);
  if (data.summary) {
    lines.push('', safe(data.summary));
  }

  if (data.nutritionalGoals) {
    lines.push('', '## Nutritional Goals', safe(data.nutritionalGoals));
  }

  if (Array.isArray(data.days)) {
    for (const day of data.days) {
      const dateLabel = day.date ? ` (${new Date(day.date).toLocaleDateString()})` : '';
      lines.push('', `## ${safe(day.day)}${dateLabel}`);
      lines.push(`- **Total Calories**: ${safe(day.totalCalories)}`);

      if (Array.isArray(day.meals)) {
        for (const meal of day.meals) {
          const header = `### ${capitalize(safe(meal.mealType))}: ${safe(meal.name)} (${safe(meal.calories)} cal)`;
          lines.push('', header);
          if (meal.description) lines.push(safe(meal.description));

          const nutritionBits: string[] = [];
          if (meal.protein) nutritionBits.push(`Protein ${meal.protein}g`);
          if (meal.carbs) nutritionBits.push(`Carbs ${meal.carbs}g`);
          if (meal.fat) nutritionBits.push(`Fat ${meal.fat}g`);
          if (meal.fiber) nutritionBits.push(`Fiber ${meal.fiber}g`);
          if (nutritionBits.length) lines.push(`- **Macros**: ${nutritionBits.join(' • ')}`);

          const metaBits: string[] = [];
          if (meal.prepTime) metaBits.push(`Prep ${meal.prepTime} min`);
          if (meal.cookingTime) metaBits.push(`Cook ${meal.cookingTime} min`);
          if (meal.difficulty) metaBits.push(`Difficulty ${meal.difficulty}`);
          if (metaBits.length) lines.push(`- **Details**: ${metaBits.join(' • ')}`);

          if (Array.isArray(meal.ingredients) && meal.ingredients.length) {
            lines.push('- **Ingredients:**');
            for (const ing of meal.ingredients) {
              lines.push(`  - ${safe(ing)}`);
            }
          }

          if (Array.isArray(meal.instructions) && meal.instructions.length) {
            lines.push('- **Instructions:**');
            meal.instructions.forEach((step, idx) => {
              lines.push(`  ${idx + 1}. ${safe(step)}`);
            });
          }

          if (meal.nutritionalNotes) lines.push(`- **Nutritional Notes**: ${safe(meal.nutritionalNotes)}`);
          if (meal.culturalContext) lines.push(`- **Cultural Context**: ${safe(meal.culturalContext)}`);
        }
      }
    }
  }

  if (data.shoppingList && Array.isArray(data.shoppingList.categories) && data.shoppingList.categories.length) {
    lines.push('', '## Shopping List');
    for (const category of data.shoppingList.categories) {
      lines.push(`- **${safe(category.category)}**`);
      for (const item of category.items) {
        const parts = [`${safe(item.name)}`, `(${safe(item.quantity)})`];
        const notes = item.notes ? ` - ${safe(item.notes)}` : '';
        lines.push(`  - ${parts.join(' ')}${notes}`);
      }
    }
  }

  if (Array.isArray(data.mealPrepTips) && data.mealPrepTips.length) {
    lines.push('', '## Meal Prep Tips');
    for (const tip of data.mealPrepTips) lines.push(`- ${safe(tip)}`);
  }

  if (Array.isArray(data.culturalNotes) && data.culturalNotes.length) {
    lines.push('', '## Cultural Notes');
    for (const note of data.culturalNotes) lines.push(`- ${safe(note)}`);
  }

  if (Array.isArray(data.substitutions) && data.substitutions.length) {
    lines.push('', '## Substitutions & Alternatives');
    for (const sub of data.substitutions) {
      lines.push(`- **${safe(sub.original)}** → **${safe(sub.alternative)}**`);
      if (sub.reason) lines.push(`  - ${safe(sub.reason)}`);
    }
  }

  if (data.weeklyNutritionalSummary) {
    const s = data.weeklyNutritionalSummary;
    lines.push('', '## Weekly Nutritional Summary');
    lines.push(`- **Avg Calories/Day**: ${safe(s.averageCalories)}`);
    lines.push(`- **Protein Range**: ${safe(s.proteinRange)}`);
    lines.push(`- **Carb Range**: ${safe(s.carbRange)}`);
    lines.push(`- **Fat Range**: ${safe(s.fatRange)}`);
    lines.push(`- **Fiber Range**: ${safe(s.fiberRange)}`);
  }

  return lines.join('\n');
}

function capitalize(input: string): string {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function getMealTypeColor(mealType: string): string {
  const colors: { [key: string]: string } = {
    breakfast: 'bg-yellow-100 text-yellow-800',
    lunch: 'bg-green-100 text-green-800',
    dinner: 'bg-blue-100 text-blue-800',
    snack: 'bg-purple-100 text-purple-800',
    dessert: 'bg-pink-100 text-pink-800'
  };
  return colors[mealType.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

function getMealTypeIcon(mealType: string) {
  const icons: { [key: string]: React.ReactNode } = {
    breakfast: <span className="text-lg">🌅</span>,
    lunch: <span className="text-lg">🍽️</span>,
    dinner: <span className="text-lg">🌙</span>,
    snack: <span className="text-lg">🍎</span>,
    dessert: <span className="text-lg">🍰</span>
  };
  return icons[mealType.toLowerCase()] || <span className="text-lg">🍴</span>;
}

export default StructuredMealPlanDisplay;
