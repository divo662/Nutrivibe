import React, { useState, useCallback, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Zap, Trash2, Eye, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * AI Features Demo Component
 * Demonstrates all AI capabilities in NutriVibe
 */
export const AIFeaturesDemo: React.FC = () => {
  const { toast } = useToast();
  const ai = useAI();
  const { user } = useAuth();
  
  // Form states
  const [mealPlanDays, setMealPlanDays] = useState(7);
  const [mealPlanGoal, setMealPlanGoal] = useState('weight_loss');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState('Traditional Nigerian');
  const [healthQuestion, setHealthQuestion] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState('');
  const [nutritionTopic, setNutritionTopic] = useState('');

  // Add dietary restriction
  const addDietaryRestriction = (restriction: string) => {
    if (restriction && !dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  // Remove dietary restriction
  const removeDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
  };

  // Generate meal plan
  const handleGenerateMealPlan = async () => {
    await ai.generateMealPlan({
      days: mealPlanDays,
      goal: mealPlanGoal,
      dietaryRestrictions,
      culturalPreferences: ['Traditional Nigerian'],
      budget: 'medium',
      mealPrepTime: 'moderate'
    });
  };

  // Get recipe recommendations
  const handleGetRecipes = async () => {
    await ai.getRecipeRecommendations({
      cuisine,
      dietaryRestrictions,
      cookingTime: 'moderate',
      skillLevel: 'intermediate',
      ingredients: []
    });
  };

  // Get health advice
  const handleGetHealthAdvice = async () => {
    if (!healthQuestion.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter your health question",
        variant: "destructive"
      });
      return;
    }
    await ai.getHealthAdvice(healthQuestion);
  };

  // Get recipes by ingredients
  const handleGetRecipesByIngredients = async () => {
    const ingredients = availableIngredients.split(',').map(i => i.trim()).filter(i => i);
    if (ingredients.length === 0) {
      toast({
        title: "Ingredients Required",
        description: "Please enter available ingredients",
        variant: "destructive"
      });
      return;
    }
    await ai.getRecipesByIngredients(ingredients);
  };

  // Get nutrition education
  const handleGetNutritionEducation = async () => {
    if (!nutritionTopic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a nutrition topic",
        variant: "destructive"
      });
      return;
    }
    await ai.getNutritionEducation({
      topic: nutritionTopic,
      difficulty: 'intermediate',
      culturalContext: true,
      practicalExamples: true
    });
  };

  // Format markdown content for display
  const formatMarkdown = (content: string): string => {
    if (!content) return '';
    
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-green-800 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-green-700 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-green-600 mt-8 mb-4">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 text-gray-700">$1. $2</li>')
      
      // Wrap lists in ul/ol tags
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc space-y-1 my-3">$1</ul>')
      
      // Code blocks
      .replace(/```(.*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 my-3 overflow-x-auto">$1</pre>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">$1</code>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-green-600 hover:text-green-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags
      .replace(/^(.+)$/gm, '<p class="mb-3">$1</p>')
      .replace(/<p class="mb-3"><\/p>/g, '')
      .replace(/<p class="mb-3"><\/p>/g, '');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200 shadow-lg">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          🧠 NutriVibe AI Features
        </h1>
        <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed">
          Experience the power of AI-powered nutrition guidance tailored to your Nigerian lifestyle, 
          dietary preferences, and fitness goals. Get personalized meal plans, recipe recommendations, 
          and expert nutrition advice in seconds!
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            🍽️ Personalized Meal Plans
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            🥘 Nigerian Recipes
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            📚 Nutrition Education
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            🏥 Health Advice
          </Badge>
        </div>
      </div>

      {/* Usage Status */}
      {ai.state.usage && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">⚡ AI Usage Status</CardTitle>
                <CardDescription className="text-blue-100">
                  Track your AI feature usage and limits
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Usage */}
              <div className="text-center p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {ai.state.usage.dailyUsed}/{ai.state.usage.dailyLimit}
                </div>
                <div className="text-sm text-blue-800 font-medium">Daily Usage</div>
                <div className="mt-3">
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((ai.state.usage.dailyUsed / ai.state.usage.dailyLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Monthly Usage */}
              <div className="text-center p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600 mb-2">
                  {ai.state.usage.monthlyUsed}/{ai.state.usage.monthlyLimit}
                </div>
                <div className="text-sm text-indigo-800 font-medium">Monthly Usage</div>
                <div className="mt-3">
                  <div className="w-full bg-indigo-100 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((ai.state.usage.monthlyUsed / ai.state.usage.monthlyLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Next Reset */}
              <div className="text-center p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
                <div className="text-lg font-bold text-blue-600 mb-2">
                  {new Date(ai.state.usage.nextReset).toLocaleDateString()}
                </div>
                <div className="text-sm text-blue-800 font-medium">Next Reset</div>
                <div className="mt-3">
                  <div className="text-xs text-blue-600">
                    {Math.ceil((new Date(ai.state.usage.nextReset).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {ai.state.error && (
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <div className="h-5 w-5 text-white">⚠️</div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">❌ Error Occurred</CardTitle>
                <CardDescription className="text-red-100">
                  Something went wrong with your AI request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-white rounded-lg border border-red-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-xl">🚨</div>
                <div className="text-red-700 font-medium">
                  {ai.state.error}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={ai.resetState}
              >
                🔄 Try Again
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => window.location.reload()}
              >
                🔃 Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Response Display */}
      {ai.state.response && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">✨ AI Response Generated</CardTitle>
                  <CardDescription className="text-green-100">
                    Your personalized AI-powered nutrition content is ready!
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-green-100 mb-1">Cost & Usage</div>
                <div className="text-sm font-semibold">
                  ${ai.state.response.cost.toFixed(6)}
                </div>
                <div className="text-xs text-green-100">
                  {ai.state.response.tokens.total} tokens
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-white rounded-lg border border-green-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-100">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">AI Generated Content</span>
                </div>
              </div>
              <div className="p-6">
                <div className="prose prose-green max-w-none">
                  <div 
                    className="text-gray-800 leading-relaxed text-base"
                    dangerouslySetInnerHTML={{ 
                      __html: formatMarkdown(ai.state.response.content) 
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => navigator.clipboard.writeText(ai.state.response?.content || '')}
              >
                📋 Copy to Clipboard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => window.print()}
              >
                🖨️ Print
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={ai.resetState}
              >
                🔄 Generate New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meal Plan Generation */}
        <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <div className="text-2xl">🍽️</div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">AI Meal Plan Generator</CardTitle>
                <CardDescription className="text-orange-100">
                  Generate personalized meal plans based on your profile
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Number of Days</label>
              <Select value={mealPlanDays.toString()} onValueChange={(value) => setMealPlanDays(parseInt(value))}>
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Fitness Goal</label>
              <Select value={mealPlanGoal} onValueChange={setMealPlanGoal}>
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="athletic_performance">Athletic Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Dietary Restrictions</label>
              <div className="flex gap-2 mt-2">
                {dietaryRestrictions.map(restriction => (
                  <Badge key={restriction} variant="secondary" className="cursor-pointer" onClick={() => removeDietaryRestriction(restriction)}>
                    {restriction} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input 
                  placeholder="Add restriction" 
                  onKeyPress={(e) => e.key === 'Enter' && addDietaryRestriction(e.currentTarget.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-lg"
                />
                <Button 
                  size="sm" 
                  onClick={() => addDietaryRestriction('Vegetarian')}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                >
                  Add
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleGenerateMealPlan} 
              disabled={ai.state.loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {ai.state.loading ? <LoadingSpinner className="mr-2" /> : null}
              🚀 Generate Meal Plan
            </Button>
          </CardContent>
        </Card>

        {/* Recipe Recommendations */}
        <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <div className="text-2xl">🥘</div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">AI Recipe Recommendations</CardTitle>
                <CardDescription className="text-purple-100">
                  Get personalized Nigerian recipe suggestions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Cuisine Focus</label>
              <Select value={cuisine} onValueChange={setCuisine}>
                <SelectTrigger className="border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Traditional Nigerian">Traditional Nigerian</SelectItem>
                  <SelectItem value="Modern Nigerian">Modern Nigerian</SelectItem>
                  <SelectItem value="West African">West African</SelectItem>
                  <SelectItem value="Fusion">Nigerian Fusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Dietary Restrictions</label>
              <div className="text-sm text-gray-600">
                Using: {dietaryRestrictions.join(', ') || 'None'}
              </div>
            </div>

            <Button 
              onClick={handleGetRecipes} 
              disabled={ai.state.loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {ai.state.loading ? <LoadingSpinner className="mr-2" /> : null}
              🎯 Get Recipe Recommendations
            </Button>
          </CardContent>
        </Card>

        {/* Health Advice */}
        <Card className="border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <div className="text-2xl">🏥</div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">AI Health Advisor</CardTitle>
                <CardDescription className="text-red-100">
                  Get personalized health and nutrition advice
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Your Health Question</label>
              <Textarea 
                placeholder="Ask me anything about nutrition, health, or Nigerian cuisine..."
                value={healthQuestion}
                onChange={(e) => setHealthQuestion(e.target.value)}
                rows={3}
                className="border-2 border-red-200 focus:border-red-400 focus:ring-red-400 rounded-lg"
              />
            </div>

            <Button 
              onClick={handleGetHealthAdvice} 
              disabled={ai.state.loading}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {ai.state.loading ? <LoadingSpinner className="mr-2" /> : null}
              💡 Get Health Advice
            </Button>
          </CardContent>
        </Card>

        {/* Recipe by Ingredients */}
        <Card className="border-2 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <div className="text-2xl">🛒</div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">Recipe by Ingredients</CardTitle>
                <CardDescription className="text-teal-100">
                  Find recipes using ingredients you have
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Available Ingredients</label>
              <Textarea 
                placeholder="Enter ingredients separated by commas (e.g., rice, beans, tomatoes)"
                value={availableIngredients}
                onChange={(e) => setAvailableIngredients(e.target.value)}
                rows={3}
                className="border-2 border-teal-200 focus:border-teal-400 focus:ring-teal-400 rounded-lg"
              />
            </div>

            <Button 
              onClick={handleGetRecipesByIngredients} 
              disabled={ai.state.loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {ai.state.loading ? <LoadingSpinner className="mr-2" /> : null}
              🔍 Find Recipes
            </Button>
          </CardContent>
        </Card>

        {/* Nutrition Education */}
        <Card className="border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <div className="text-2xl">📚</div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">AI Nutrition Educator</CardTitle>
                <CardDescription className="text-indigo-100">
                  Learn about nutrition in Nigerian context
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nutrition Topic</label>
              <Input 
                placeholder="e.g., protein, carbohydrates, vitamins, meal timing"
                value={nutritionTopic}
                onChange={(e) => setNutritionTopic(e.target.value)}
                className="border-2 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 rounded-lg"
              />
            </div>

            <Button 
              onClick={handleGetNutritionEducation} 
              disabled={ai.state.loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {ai.state.loading ? <LoadingSpinner className="mr-2" /> : null}
              📖 Learn About Nutrition
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <div className="text-2xl">⚡</div>
              </div>
              <div>
                <CardTitle className="text-white text-xl">Quick AI Actions</CardTitle>
                <CardDescription className="text-yellow-100">
                  Quick access to common AI features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button 
              variant="outline" 
              onClick={() => ai.getNutritionQuiz('basic')}
              disabled={ai.state.loading}
              className="w-full border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              🧠 Take Nutrition Quiz
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => ai.getMealTimingAdvice('I work 9-5 and exercise in the evening')}
              disabled={ai.state.loading}
              className="w-full border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              ⏰ Get Meal Timing Advice
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => ai.getSupplementAdvice(['Vitamin D', 'Omega-3'])}
              disabled={ai.state.loading}
              className="w-full border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              💊 Supplement Advice
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Saved Generations */}
      <Card className="border-2 border-emerald-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <div className="text-2xl">💾</div>
            </div>
            <div>
              <CardTitle className="text-white text-xl">Saved AI Generations</CardTitle>
              <CardDescription className="text-emerald-100">
                Your previously generated meal plans, recipes, and nutrition advice
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <SavedGenerations userId={user?.id} />
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={ai.resetState}
          className="mx-auto px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
        >
          🔄 Reset AI State
        </Button>
      </div>
    </div>
  );
};

/**
 * Component to display user's saved AI generations
 */
const SavedGenerations: React.FC<{ userId?: string }> = ({ userId }) => {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null);
  const { toast } = useToast();

  // Fetch saved generations
  const fetchGenerations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
      toast({
        title: "Error",
        description: "Failed to load saved generations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Archive a generation
  const archiveGeneration = async (generationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_generations')
        .update({ status: 'archived' })
        .eq('id', generationId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Generation archived successfully",
      });

      // Refresh the list
      fetchGenerations();
    } catch (error) {
      console.error('Error archiving generation:', error);
      toast({
        title: "Error",
        description: "Failed to archive generation",
        variant: "destructive"
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get feature icon
  const getFeatureIcon = (feature: string) => {
    const icons: Record<string, string> = {
      'meal_plan_generation': '🍽️',
      'recipe_recommendation': '🥘',
      'nutrition_education': '📚',
      'health_advice': '🏥',
      'meal_plan_customization': '✏️',
      'grocery_list_optimization': '🛒',
      'cultural_food_understanding': '🌍',
      'recipe_alternatives': '🔄',
      'recipes_by_ingredients': '🔍',
      'nutrition_quiz': '🧠',
      'meal_timing_advice': '⏰',
      'supplement_advice': '💊'
    };
    return icons[feature] || '🤖';
  };

  // Get feature name
  const getFeatureName = (feature: string) => {
    const names: Record<string, string> = {
      'meal_plan_generation': 'Meal Plan',
      'recipe_recommendation': 'Recipe',
      'nutrition_education': 'Nutrition',
      'health_advice': 'Health Advice',
      'meal_plan_customization': 'Customization',
      'grocery_list_optimization': 'Grocery List',
      'cultural_food_understanding': 'Cultural Guide',
      'recipe_alternatives': 'Alternatives',
      'recipes_by_ingredients': 'By Ingredients',
      'nutrition_quiz': 'Quiz',
      'meal_timing_advice': 'Timing',
      'supplement_advice': 'Supplements'
    };
    return names[feature] || 'AI Generation';
  };

  // Format markdown content for display
  const formatMarkdown = (content: string): string => {
    if (!content) return '';
    
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-green-800 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-green-700 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-green-600 mt-8 mb-4">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 text-gray-700">$1. $2</li>')
      
      // Wrap lists in ul/ol tags
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc space-y-1 my-3">$1</ul>')
      
      // Code blocks
      .replace(/```(.*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 my-3 overflow-x-auto">$1</pre>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">$1</code>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-green-600 hover:text-green-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags
      .replace(/^(.+)$/gm, '<p class="mb-3">$1</p>')
      .replace(/<p class="mb-3"><\/p>/g, '')
      .replace(/<p class="mb-3"><\/p>/g, '');
  };

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to view your saved generations</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-2">Loading your saved generations...</p>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-semibold mb-2">No saved generations yet</h3>
        <p className="text-gray-500">
          Your AI-generated content will appear here once you start using the features above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Generation List */}
      <div className="grid gap-4">
        {generations.map((generation) => (
          <div
            key={generation.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">
                  {getFeatureIcon(generation.feature)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getFeatureName(generation.feature)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {generation.tokens_used} tokens
                    </span>
                    <span className="text-xs text-gray-500">
                      ${generation.cost.toFixed(6)}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {generation.title || 'Untitled Generation'}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(generation.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {generation.metadata?.model || 'Unknown Model'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedGeneration(generation)}
                  className="h-8 px-3"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => archiveGeneration(generation.id)}
                  className="h-8 px-3 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Generation Detail Modal */}
      {selectedGeneration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getFeatureIcon(selectedGeneration.feature)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedGeneration.title || 'Untitled Generation'}
                    </h3>
                    <p className="text-emerald-100">
                      {getFeatureName(selectedGeneration.feature)} • {formatDate(selectedGeneration.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedGeneration(null)}
                  className="text-white border-white hover:bg-white hover:text-emerald-600"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div 
                className="prose prose-green max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: formatMarkdown(selectedGeneration.content)
                }}
              />
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tokens Used:</span>
                    <p className="text-gray-600">{selectedGeneration.tokens_used}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Cost:</span>
                    <p className="text-gray-600">${selectedGeneration.cost.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Model:</span>
                    <p className="text-gray-600">{selectedGeneration.metadata?.model || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Generated:</span>
                    <p className="text-gray-600">{formatDate(selectedGeneration.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
