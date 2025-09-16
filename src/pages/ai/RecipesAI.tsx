import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { RecipeService } from '@/services/ai/recipe-service';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AIPersistenceService } from '@/services/aiPersistenceService';
import AppShell from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Zap, AlertTriangle, ChefHat, Eye, Plus, MessageCircle, Send, Save, Edit3, Utensils, Clock, Target, Star, Trash2, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StructuredRecipeDisplay from '@/components/ai/StructuredRecipeDisplay';
import { ImageExportService } from '@/services/imageExportService';

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  fitness_goal: string | null;
  dietary_preference: string | null;
  allergies: string[] | null;
  location: string | null;
  caloric_needs: number | null;
};

type Recipe = {
  id: string;
  title: string;
  summary?: string;
  cuisine?: string;
  difficulty?: string;
  cooking_time?: string;
  created_at: string;
  data: any;
  image_url?: string | null;
};

type ChatMessage = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
};

const RecipesAI: React.FC = () => {
  const { user } = useAuth();
  const { checkFeatureAccess, incrementAIUsage, getUsageStats, subscription } = useSubscription();
  
  // Initialize recipe service
  const recipeService = new RecipeService();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [recipeRequest, setRecipeRequest] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [cuisine, setCuisine] = useState('Nigerian');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [cookingTime, setCookingTime] = useState<'quick'|'moderate'|'extensive'>('moderate');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [usageStats, setUsageStats] = useState({
    dailyUsage: 0,
    monthlyUsage: 0,
    dailyLimit: 3,
    monthlyLimit: 90
  });
  
  // New state for recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [viewMode, setViewMode] = useState<'generate' | 'view' | 'edit' | 'preview'>('generate');

  // Chat interface state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('user_id,full_name,fitness_goal,dietary_preference,allergies,location,caloric_needs')
        .eq('user_id', user.id)
        .single();
      setProfile(data as ProfileRow);
      
      // Load usage stats
      try {
        const stats = await getUsageStats();
        setUsageStats(stats);
      } catch (error) {
        console.error('Error loading usage stats:', error);
      }

      // Load existing recipes
      await loadRecipes();
    })();
  }, [user, getUsageStats]);

  const loadRecipes = async () => {
    if (!user) return;
    setLoadingRecipes(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, user_id, title, summary, cuisine, difficulty, cooking_time, created_at, data, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecipes((data as any) || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id);
      if (error) throw error;
      await loadRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleExportImage = async () => {
    try {
      if (!previewRef.current) return;
      const dataUrl = await ImageExportService.nodeToPng(previewRef.current, {
        pixelRatio: 2,
        backgroundColor: '#f7faf9'
      });
      ImageExportService.triggerDownload(dataUrl, `${selectedRecipe?.title || 'recipe'}.png`);

      if (user && selectedRecipe?.id) {
        const url = await ImageExportService.uploadToSupabase(user.id, selectedRecipe.id, dataUrl);
        if (url) {
          await supabase.from('recipes').update({ image_url: url }).eq('id', selectedRecipe.id);
          await loadRecipes();
        }
      }
    } catch (err) {
      console.error('Export image failed:', err);
    }
  };

  // Ensure we have a hosted image URL without forcing a download
  const ensureHostedImageUrl = async (): Promise<string | null> => {
    if (!user || !selectedRecipe?.id) return null;
    if (selectedRecipe.image_url) return selectedRecipe.image_url;
    if (!previewRef.current) return null;
    try {
      const dataUrl = await ImageExportService.nodeToPng(previewRef.current, {
        pixelRatio: 2,
        backgroundColor: '#f7faf9'
      });
      const url = await ImageExportService.uploadToSupabase(user.id, selectedRecipe.id, dataUrl);
      if (url) {
        await supabase.from('recipes').update({ image_url: url }).eq('id', selectedRecipe.id);
        // Optimistically update local state so actions can use the URL immediately
        setSelectedRecipe({ ...selectedRecipe, image_url: url } as any);
        await loadRecipes();
      }
      return url ?? null;
    } catch (e) {
      console.error('Failed to ensure hosted image:', e);
      return null;
    }
  };

  const handleDownloadImage = async () => {
    let url = selectedRecipe?.image_url;
    if (!url) url = await ensureHostedImageUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRecipe?.title || 'recipe'}.png`;
    a.click();
  };

  // Removed copy/share per request

  const handleGenerate = async () => {
    if (!user || !profile) return;
    
    // Check if user has reached their daily limit
    if (usageStats.dailyUsage >= usageStats.dailyLimit) {
      alert('You have reached your daily AI generation limit. Upgrade to Pro for unlimited access!');
      return;
    }

    setLoading(true);
    setContent('');
    setSavedId(null);
    try {
      const res = await recipeService.getRecipeRecommendations(user.id, {
        id: profile.user_id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        fitness_goal: (profile.fitness_goal as any) || null,
        dietary_preference: (profile.dietary_preference as any) || null,
        allergies: profile.allergies,
        location: profile.location,
        caloric_needs: profile.caloric_needs,
        subscription_plan: null,
        subscription_status: null,
        usage_ai_generations: null,
        usage_ai_generations_reset_date: null,
      }, {
        recipeRequest: recipeRequest.trim(),
        ingredients: ingredients.split(',').map(s=>s.trim()).filter(Boolean),
        cuisine,
        dietaryRestrictions: dietaryRestrictions.split(',').map(s=>s.trim()).filter(Boolean),
        cookingTime,
        skillLevel: difficulty
      });

      if (!res.success) throw new Error(res.error || 'Generation failed');
      setContent(res.content);
      await incrementAIUsage();
      
      // Refresh usage stats
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !content) return;
    const id = await AIPersistenceService.saveRecipe(user.id, `AI Recipe - ${cuisine}`, content);
    setSavedId(id);
    // verify
    const { data } = await supabase.from('recipes').select('id').eq('id', id).single();
    setVerified(!!data);
    
    // Reload recipes to show the new one
    await loadRecipes();
    
    // Reset to view mode
    setViewMode('view');
  };

  const handleEditRecipe = () => {
    setViewMode('edit');
    setEditingContent(content);
    setOriginalContent(content);
    setChatMessages([
      {
        id: '1',
        type: 'ai',
        content: `👨‍🍳 **Hello! I'm your personal Nigerian chef assistant!** 

I'm here to help you perfect your recipe. Here's what I can do for you:

**🍳 Recipe Modifications:**
• Adjust ingredients or quantities
• Make it easier or more challenging
• Change cooking time or techniques
• Add or remove cooking steps
• Modify for your dietary needs

**🌶️ Flavor & Style:**
• Add more Nigerian spices and flavors
• Change the cuisine style
• Adjust the heat level
• Include cultural variations

**🥗 Health & Nutrition:**
• Make it healthier
• Adjust for your fitness goals
• Add nutritional tips
• Include ingredient substitutions

**💡 Examples of what you can ask:**
• "Make this recipe more beginner-friendly"
• "Add more Nigerian spices and heat"
• "Reduce the cooking time to 30 minutes"
• "Make it vegetarian-friendly"
• "Include more protein for muscle building"
• "Add traditional Nigerian cooking techniques"

**What would you like me to help you with today?** 🚀`,
        timestamp: new Date()
      }
    ]);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Use the recipe customization service
      const res = await recipeService.customizeRecipe(user!.id, {
        id: profile!.user_id,
        user_id: profile!.user_id,
        full_name: profile!.full_name,
        fitness_goal: (profile!.fitness_goal as any) || null,
        dietary_preference: (profile!.dietary_preference as any) || null,
        allergies: profile!.allergies,
        location: profile!.location,
        caloric_needs: profile!.caloric_needs,
        subscription_plan: null,
        subscription_status: null,
        usage_ai_generations: null,
        usage_ai_generations_reset_date: null,
      }, editingContent, chatInput);

      if (res.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: res.content,
          timestamp: new Date()
        };

        setChatMessages(prev => [...prev, aiMessage]);
        
        // Update the editing content with the new version
        setEditingContent(res.content);
      } else {
        throw new Error(res.error || 'Customization failed');
      }
    } catch (error) {
      console.error('Error customizing recipe:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while customizing your recipe. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setViewMode('view');
  };

  const handleBackToGenerate = () => {
    setViewMode('generate');
    setSelectedRecipe(null);
  };

  const handleBackToEdit = () => {
    setViewMode('edit');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canGenerate = usageStats.dailyUsage < usageStats.dailyLimit;

  // If viewing a specific recipe, show the detailed view
  if (viewMode === 'view' && selectedRecipe) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Header with back button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button 
                variant="ghost" 
                onClick={handleBackToGenerate}
                className="mb-2"
                size="sm"
              >
                ← Back to Generator
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">{selectedRecipe.title}</h1>
              <p className="text-muted-foreground text-sm">
                Created on {formatDate(selectedRecipe.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedRecipe.cuisine}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedRecipe.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedRecipe.cooking_time}
              </Badge>
              <Button 
                variant="default"
                size="sm"
                onClick={handleExportImage}
              >
                Export Image
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownloadImage} title="Download image">
                <Download className="h-4 w-4" />
              </Button>
              
            </div>
          </div>

          {/* Recipe Display */}
          <div ref={previewRef} className="rounded-xl p-0 overflow-hidden bg-gradient-to-br from-white to-emerald-50 shadow-sm border border-emerald-100">
            {/* NutriVibe Brand Header */}
            <div className="w-full bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-black tracking-wide">NutriVibe</span>
                <span className="text-xs opacity-90">AI Recipe</span>
              </div>
              <div className="text-xs opacity-90">{formatDate(selectedRecipe.created_at)}</div>
            </div>
            <div className="p-6">
              <StructuredRecipeDisplay 
                recipeData={selectedRecipe.data}
                title={selectedRecipe.title}
              />
            </div>
            {/* Footer watermark */}
            <div className="px-6 pb-4 text-[10px] text-emerald-700/70">© NutriVibe • Eat well, live vibrant</div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Edit mode with chat interface
  if (viewMode === 'edit') {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button 
                variant="ghost" 
                onClick={handleBackToGenerate}
                className="mb-2"
                size="sm"
              >
                ← Back to Generator
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Edit Recipe</h1>
              <p className="text-muted-foreground text-sm">
                Chat with AI to refine your recipe before saving
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setViewMode('generate')}
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!editingContent || editingContent === originalContent}
                className="min-w-[120px]"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingContent === originalContent ? 'No Changes' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chat Interface */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  AI Chat Assistant
                </CardTitle>
                <CardDescription className="text-sm">
                  Ask me to modify your recipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Recipe Preview */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Current Recipe</h4>
                  <div className="max-h-32 overflow-y-auto">
                    <StructuredRecipeDisplay 
                      recipeData={editingContent}
                      title=""
                    />
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="h-64 overflow-y-auto space-y-4 p-4 bg-muted rounded-lg">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-background border p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask me to modify your recipe..."
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                    disabled={chatLoading}
                    className="text-sm"
                  />
                  <Button 
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || chatLoading}
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription className="text-sm">
                  See your changes in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto">
                  <StructuredRecipeDisplay 
                    recipeData={editingContent}
                    title="Updated Recipe"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  // Preview mode
  if (viewMode === 'preview') {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Header with back button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setViewMode('generate')}
                className="mb-2"
                size="sm"
              >
                ← Back to Editor
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Preview Recipe</h1>
              <p className="text-muted-foreground text-sm">
                See how your recipe will look in the structured display format.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {cuisine}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {cookingTime}
              </Badge>
            </div>
          </div>

          {/* Recipe Display */}
          <StructuredRecipeDisplay 
            recipeData={content}
            title={`AI Generated Recipe (${cuisine})`}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
        {/* Header with tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">AI Recipe Generator</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Create personalized recipes and view your existing ones
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant={viewMode === 'generate' ? 'default' : 'outline'}
              onClick={() => setViewMode('generate')}
              size="sm"
              className="sm:h-10 sm:px-4 sm:text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate New
            </Button>
            <Button 
              variant={viewMode === 'view' ? 'default' : 'outline'}
              onClick={() => setViewMode('view')}
              size="sm"
              className="sm:h-10 sm:px-4 sm:text-base"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Recipes ({recipes.length})
            </Button>
          </div>
        </div>

        {/* Usage Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {subscription?.plan === 'free' ? (
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              ) : (
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              )}
              AI Usage Status
            </CardTitle>
            <CardDescription className="text-sm">
              Track your daily AI generation usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted rounded-lg gap-3 sm:gap-0">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {subscription?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {subscription?.plan === 'free' 
                    ? `${usageStats.dailyUsage}/${usageStats.dailyLimit} AI generations used today`
                    : 'Unlimited AI generations'
                  }
                </p>
              </div>
              {subscription?.plan === 'free' && (
                <Badge variant={canGenerate ? "default" : "destructive"} className="self-start sm:self-auto">
                  {canGenerate ? `${usageStats.dailyLimit - usageStats.dailyUsage} remaining` : 'Limit reached'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Alert for Free Users */}
        {subscription?.plan === 'free' && !canGenerate && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You've reached your daily limit of {usageStats.dailyLimit} AI generations. 
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold ml-1"
                onClick={() => window.location.href = '/settings'}
              >
                Upgrade to Pro
              </Button> 
              for unlimited access!
            </AlertDescription>
          </Alert>
        )}

        {/* Recipes List View */}
        {viewMode === 'view' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ChefHat className="h-4 w-4 sm:h-5 sm:w-5" />
                Your Recipes ({recipes.length})
              </CardTitle>
              <CardDescription className="text-sm">
                View and manage your generated recipes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecipes ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm">Loading recipes...</span>
                </div>
              ) : recipes.length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Generate your first AI-powered recipe to get started
                  </p>
                  <Button onClick={() => setViewMode('generate')} size="sm" className="sm:h-10 sm:px-4 sm:text-base">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate First Recipe
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {recipes.map((recipe) => (
                    <Card 
                      key={recipe.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewRecipe(recipe)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base sm:text-lg line-clamp-2">
                              {recipe.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1 text-sm">
                              {recipe.summary || 'AI Generated Recipe'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <ChefHat className="h-3 w-3" />
                            {recipe.cuisine}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recipe.cooking_time}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {recipe.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(recipe.created_at)}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-auto text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecipe(recipe.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-3 text-xs sm:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRecipe(recipe);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generate New Recipe Form */}
        {viewMode === 'generate' && (
          <>
      <Card>
        <CardHeader>
                <CardTitle className="text-base sm:text-lg">Generate New Recipe</CardTitle>
                <CardDescription className="text-sm">
                  Tell me what you want to cook! I'll create a personalized recipe based on your ingredients, preferences, and dietary needs.
                </CardDescription>
        </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipe Request Field - Full Width */}
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium">What recipe do you want to cook? 🍽️</label>
                  <Textarea 
                    value={recipeRequest} 
                    onChange={e=>setRecipeRequest(e.target.value)}
                    placeholder="e.g., I want a quick Nigerian recipe for egusi soup, or I need a recipe using chicken and rice, or Make me a traditional jollof rice recipe"
                    className="min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Describe exactly what you want to cook - be specific about the dish, style, or ingredients you want to use!
                  </p>
                  {!recipeRequest.trim() && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Please tell me what recipe you want to cook!
                    </p>
                  )}
                </div>
                
                {/* Other Fields in Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">What ingredients do you have? (comma-separated)</label>
                    <Input 
                      value={ingredients} 
                      onChange={e=>setIngredients(e.target.value)}
                      placeholder="e.g., chicken, rice, tomatoes, onions, plantain, beans"
                    />
                    <label className="text-sm font-medium">What cuisine would you like?</label>
                    <Input 
                      value={cuisine} 
                      onChange={e=>setCuisine(e.target.value)}
                      placeholder="e.g., Nigerian, Italian, Asian, Fusion"
                    />
                    <label className="text-sm font-medium">Any dietary restrictions? (comma-separated)</label>
                    <Input 
                      value={dietaryRestrictions} 
                      onChange={e=>setDietaryRestrictions(e.target.value)}
                      placeholder="e.g., vegetarian, gluten-free, dairy-free, none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">How much time do you have?</label>
                    <Select value={cookingTime} onValueChange={(value: 'quick'|'moderate'|'extensive') => setCookingTime(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick">Quick (15-30 min)</SelectItem>
                        <SelectItem value="moderate">Moderate (30-60 min)</SelectItem>
                        <SelectItem value="extensive">Extensive (60+ min)</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="text-sm font-medium">What's your cooking skill level?</label>
                    <Select value={difficulty} onValueChange={(value: 'easy'|'medium'|'hard') => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (Beginner)</SelectItem>
                        <SelectItem value="medium">Medium (Intermediate)</SelectItem>
                        <SelectItem value="hard">Hard (Advanced)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="lg:col-span-2 flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading || !canGenerate || !recipeRequest.trim()}
                    className="flex-1 sm:h-10 sm:px-4 sm:text-base"
                    size="sm"
                  >
                    {loading ? 'Generating...' : !canGenerate ? 'Daily Limit Reached' : !recipeRequest.trim() ? 'Enter Recipe Request' : 'Generate Recipe'}
                  </Button>
                  {content && (
                    <Button 
                      variant="secondary" 
                      onClick={handleEditRecipe}
                      disabled={!content}
                      size="sm"
                      className="sm:h-10 sm:px-4 sm:text-base"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit & Refine
                    </Button>
                  )}
            {loading && <LoadingSpinner />}
          </div>
                

                
                {/* Simplified: removed bulky ideas/tips section for a cleaner UI */}
              </CardContent>
            </Card>

            {/* Generated Recipe */}
            {content ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-base sm:text-lg">Generated Recipe</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleExportImage}
                        disabled={!content}
                      >
                        Export Image
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewMode('preview')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Display
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={handleEditRecipe}
                        disabled={!content}
                        size="sm"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit & Refine
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleSave}
                        disabled={!content}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Recipe
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your AI-generated recipe is ready! Use "Preview Display" to see the formatted version, or "Edit & Refine" to customize it further.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={previewRef} className="rounded-xl p-6 bg-gradient-to-br from-white to-emerald-50 shadow-sm">
                    {/* Show the structured display instead of raw textarea */}
                    <StructuredRecipeDisplay 
                      recipeData={content}
                      title="Generated Recipe"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Create Your Recipe?</h3>
                  <p className="text-muted-foreground mb-4">
                    Fill out the form above with your ingredients and preferences, then click "Generate Recipe" to get started!
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Utensils className="h-4 w-4" />
                    <span>I'll create a personalized recipe just for you</span>
                  </div>
        </CardContent>
      </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default RecipesAI;


