import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { mealPlanService } from '@/services/ai/meal-plan-service';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AIPersistenceService } from '@/services/aiPersistenceService';
import AppShell from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Zap, AlertTriangle, Calendar, Clock, Target, Eye, Plus, MessageCircle, Send, Save, Edit3, BarChart3, Download, Trash2 } from 'lucide-react';
import { ImageExportService } from '@/services/imageExportService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StructuredMealPlanDisplay from '@/components/ai/StructuredMealPlanDisplay';

import MealPlanAnalytics from '@/components/ai/MealPlanAnalytics';
import MealPlanSharing from '@/components/ai/MealPlanSharing';


type ProfileRow = {
  user_id: string;
  full_name: string | null;
  fitness_goal: string | null;
  dietary_preference: string | null;
  allergies: string[] | null;
  location: string | null;
  caloric_needs: number | null;
};

type MealPlan = {
  id: string;
  title: string;
  summary: string;
  plan_date: string;
  total_days?: number;
  estimated_calories?: number;
  created_at: string;
  data: any;
};

type ChatMessage = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
};

const MealPlanAI: React.FC = () => {
  const { user } = useAuth();
  const { checkFeatureAccess, incrementAIUsage, getUsageStats, subscription } = useSubscription();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [days, setDays] = useState(7);
  const [goal, setGoal] = useState('weight_loss');
  const [dailyRestrictions, setDailyRestrictions] = useState('');
  const [culturalPreferences, setCulturalPreferences] = useState('Nigerian');
  const [budget, setBudget] = useState<'low'|'medium'|'high'>('medium');
  const [mealPrepTime, setMealPrepTime] = useState<'quick'|'moderate'|'extensive'>('moderate');
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
  
  // New state for meal plans
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [loadingMealPlans, setLoadingMealPlans] = useState(false);
  const [viewMode, setViewMode] = useState<'generate' | 'view' | 'edit' | 'preview' | 'analytics'>('generate');

  // Chat interface state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleExportImage = async () => {
    if (!previewRef.current || !user) return;
    try {
      setExporting(true);
      const dataUrl = await ImageExportService.nodeToPng(previewRef.current, {
        pixelRatio: 2,
        backgroundColor: '#f7faf9'
      });
      ImageExportService.triggerDownload(dataUrl, `${selectedMealPlan?.title || 'meal-plan'}.png`);
      if (selectedMealPlan?.id) {
        await ImageExportService.uploadToSupabase(user.id, selectedMealPlan.id, dataUrl, 'meal-plan-images');
      }
    } finally {
      setExporting(false);
    }
  };

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

      // Load existing meal plans
      await loadMealPlans();
    })();
  }, [user, getUsageStats]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadMealPlans = async () => {
    if (!user) return;
    
    setLoadingMealPlans(true);
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Transform the data to match our MealPlan type
      const transformedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        plan_date: item.plan_date,
        total_days: (item as any).total_days || 1,
        estimated_calories: (item as any).estimated_calories || 0,
        created_at: item.created_at,
        data: item.data
      }));
      setMealPlans(transformedData);
    } catch (error) {
      console.error('Error loading meal plans:', error);
    } finally {
      setLoadingMealPlans(false);
    }
  };

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
      const res = await mealPlanService.generateMealPlan(user.id, {
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
        days,
        goal,
        dietaryRestrictions: dailyRestrictions.split(',').map(s=>s.trim()).filter(Boolean),
        culturalPreferences: culturalPreferences.split(',').map(s=>s.trim()).filter(Boolean),
        budget,
        mealPrepTime
      });

      if (!res.success) throw new Error(res.error || 'Generation failed');
      console.log('Meal plan generated successfully:', res.content?.substring(0, 200));
      setContent(res.content);
      setOriginalContent(res.content);
      setEditingContent(res.content);
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
    if (!user || !editingContent) return;
    const id = await AIPersistenceService.saveMealPlan(user.id, `AI Meal Plan (${days} days)`, editingContent);
    setSavedId(id);
    // verify
    const { data } = await supabase.from('meal_plans').select('id').eq('id', id).single();
    setVerified(!!data);
    
    // Reload meal plans to show the new one
    await loadMealPlans();
    
    // Reset to view mode
    setViewMode('view');
  };

  const handleEditMealPlan = (mealPlan?: MealPlan) => {
    setViewMode('edit');
    // If a meal plan is provided, use its data, otherwise use current content
    const contentToEdit = mealPlan ? mealPlan.data : content;
    setEditingContent(contentToEdit);
    setOriginalContent(contentToEdit);
    setChatMessages([
      {
        id: '1',
        type: 'ai',
        content: `Hi! I'm here to help you refine your meal plan. 

**Current Plan Overview:**
• ${days} days • ${goal} goal • ${budget} budget • ${mealPrepTime} prep time

**What you can ask me to do:**
• Change specific meals or ingredients
• Adjust portion sizes or cooking methods  
• Add or remove dishes
• Modify nutritional content
• Include personal preferences
• Add cooking tips or substitutions
• Change cultural focus or cuisine style

**Examples:**
• "Make the breakfast more protein-rich"
• "Add more Nigerian dishes"
• "Reduce cooking time for dinner"
• "Include more vegetarian options"

What would you like to change about your meal plan?`,
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
      // Use the meal plan customization service
      const res = await mealPlanService.customizeMealPlan(user!.id, {
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
      console.error('Error customizing meal plan:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while customizing your meal plan. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleViewMealPlan = (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan);
    setViewMode('view');
  };

  const handleBackToGenerate = () => {
    setViewMode('generate');
    setSelectedMealPlan(null);
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

  const handleDeleteMealPlan = async (mealPlanId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm('Delete this meal plan? This cannot be undone.');
    if (!confirmDelete) return;
    setDeletingId(mealPlanId);
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId)
        .eq('user_id', user.id);
      if (error) throw error;
      // Update local state
      setMealPlans(prev => prev.filter(mp => mp.id !== mealPlanId));
      if (selectedMealPlan?.id === mealPlanId) {
        setSelectedMealPlan(null);
        setViewMode('view');
      }
    } catch (e) {
      console.error('Failed to delete meal plan', e);
      alert('Failed to delete meal plan.');
    } finally {
      setDeletingId(null);
    }
  };

  const canGenerate = usageStats.dailyUsage < usageStats.dailyLimit;

  // If viewing a specific meal plan, show the detailed view
  if (viewMode === 'view' && selectedMealPlan) {
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
              <h1 className="text-xl sm:text-2xl font-bold">{selectedMealPlan.title}</h1>
              <p className="text-muted-foreground text-sm">
                Created on {formatDate(selectedMealPlan.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedMealPlan.total_days} days
              </Badge>
              {selectedMealPlan.estimated_calories > 0 && (
                <Badge variant="outline" className="text-xs">
                  ~{selectedMealPlan.estimated_calories} cal/day
                </Badge>
              )}
            </div>
          </div>

          {/* Meal Plan Display (wrapped for export) */}
          <div ref={previewRef} className="rounded-xl p-0 overflow-hidden bg-gradient-to-br from-white to-emerald-50 shadow-sm border border-emerald-100">
            <div className="w-full bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-black tracking-wide">NutriVibe</span>
                <span className="text-xs opacity-90">AI Meal Plan</span>
              </div>
            </div>
            <div className="p-6">
              <StructuredMealPlanDisplay 
                mealPlanData={selectedMealPlan.data}
                title={selectedMealPlan.title}
              />
            </div>
            <div className="px-6 pb-4 text-[10px] text-emerald-700/70">© NutriVibe • Eat well, live vibrant</div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleEditMealPlan(selectedMealPlan)}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Plan
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteMealPlan(selectedMealPlan.id)}
              className="gap-2"
              disabled={deletingId === selectedMealPlan.id}
            >
              <Trash2 className="h-4 w-4" />
              {deletingId === selectedMealPlan.id ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="default"
              onClick={handleExportImage}
              className="gap-2"
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Image'}
            </Button>
          </div>
          
          {/* Sharing Section */}
          <MealPlanSharing
            mealPlanId={selectedMealPlan.id}
            mealPlanTitle={selectedMealPlan.title}
            mealPlanData={selectedMealPlan.data}
          />
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
              <h1 className="text-xl sm:text-2xl font-bold">Edit Meal Plan</h1>
              <p className="text-muted-foreground text-sm">
                Chat with AI to refine your meal plan before saving
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
                  Ask me to modify your meal plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Meal Plan Preview */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Current Meal Plan</h4>
                  <div className="max-h-32 overflow-y-auto">
                    <StructuredMealPlanDisplay 
                      mealPlanData={editingContent}
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
                    placeholder="Ask me to modify your meal plan..."
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
                  <StructuredMealPlanDisplay 
                    mealPlanData={editingContent}
                    title="Updated Meal Plan"
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
              <h1 className="text-xl sm:text-2xl font-bold">Preview Meal Plan</h1>
              <p className="text-muted-foreground text-sm">
                See how your meal plan will look in the structured display format.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {days} days
              </Badge>
              {goal && (
                <Badge variant="outline" className="text-xs">
                  {goal} goal
                </Badge>
              )}
            </div>
          </div>

          {/* Meal Plan Display */}
          <StructuredMealPlanDisplay 
            mealPlanData={content}
            title={`AI Generated Meal Plan (${days} days)`}
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
            <h1 className="text-2xl sm:text-3xl font-bold">AI Meal Plan Generator</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Create personalized meal plans and view your existing ones
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
              View Plans ({mealPlans.length})
            </Button>
            <Button 
              variant={viewMode === 'analytics' ? 'default' : 'outline'}
              onClick={() => setViewMode('analytics')}
              size="sm"
              className="sm:h-10 sm:px-4 sm:text-base"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Usage Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {subscription?.plan === 'free' ? (
                <Zap className="h-5 w-5 text-blue-600" />
              ) : (
                <Crown className="h-5 w-5 text-yellow-600" />
              )}
              AI Usage Status
            </CardTitle>
            <CardDescription>
              Track your daily AI generation usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {subscription?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.plan === 'free' 
                    ? `${usageStats.dailyUsage}/${usageStats.dailyLimit} AI generations used today`
                    : 'Unlimited AI generations'
                  }
                </p>
              </div>
              {subscription?.plan === 'free' && (
                <Badge variant={canGenerate ? "default" : "destructive"}>
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
            <AlertDescription>
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

        {/* Meal Plans List View */}
        {viewMode === 'view' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Your Meal Plans ({mealPlans.length})
              </CardTitle>
              <CardDescription>
                View and manage your generated meal plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMealPlans ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2">Loading meal plans...</span>
                </div>
              ) : mealPlans.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No meal plans yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first AI-powered meal plan to get started
                  </p>
                  <Button onClick={() => setViewMode('generate')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate First Meal Plan
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mealPlans.map((mealPlan) => (
                    <Card 
                      key={mealPlan.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewMealPlan(mealPlan)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">
                              {mealPlan.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              {mealPlan.summary || 'AI Generated Meal Plan'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(mealPlan.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {mealPlan.total_days} days
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {mealPlan.estimated_calories > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              ~{mealPlan.estimated_calories} cal/day
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {mealPlan.plan_date ? formatDate(mealPlan.plan_date) : 'No date'}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMealPlan(mealPlan);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleDeleteMealPlan(mealPlan.id);
                            }}
                            disabled={deletingId === mealPlan.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletingId === mealPlan.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        {viewMode === 'analytics' && (
          <MealPlanAnalytics 
            mealPlans={mealPlans}
            userProfile={profile}
          />
        )}

        {/* Generate New Meal Plan Form */}
        {viewMode === 'generate' && (
          <>
      <Card>
        <CardHeader>
                <CardTitle>Generate New Meal Plan</CardTitle>
                <CardDescription>Customize your meal plan parameters</CardDescription>
        </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
                  <label className="text-sm font-medium">Days</label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={14} 
                    value={days} 
                    onChange={e=>setDays(parseInt(e.target.value||'7'))} 
                  />
                  <label className="text-sm font-medium">Goal</label>
            <Input value={goal} onChange={e=>setGoal(e.target.value)} />
                  <label className="text-sm font-medium">Dietary Restrictions (comma-separated)</label>
                  <Input value={dailyRestrictions} onChange={e=>setDailyRestrictions(e.target.value)} />
          </div>
          <div className="space-y-3">
                  <label className="text-sm font-medium">Cultural Preferences (comma-separated)</label>
            <Input value={culturalPreferences} onChange={e=>setCulturalPreferences(e.target.value)} />
                  <label className="text-sm font-medium">Budget</label>
                  <Select value={budget} onValueChange={(value: 'low'|'medium'|'high') => setBudget(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="text-sm font-medium">Meal Prep Time</label>
                  <Select value={mealPrepTime} onValueChange={(value: 'quick'|'moderate'|'extensive') => setMealPrepTime(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick (15-30 min)</SelectItem>
                      <SelectItem value="moderate">Moderate (30-60 min)</SelectItem>
                      <SelectItem value="extensive">Extensive (60+ min)</SelectItem>
                    </SelectContent>
                  </Select>
          </div>
                <div className="lg:col-span-2 flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading || !canGenerate}
                    className="flex-1 sm:h-10 sm:px-4 sm:text-base"
                    size="sm"
                  >
                    {loading ? 'Generating...' : canGenerate ? 'Generate Meal Plan' : 'Daily Limit Reached'}
                  </Button>
                  {content && (
                    <>
                      <Button 
                        variant="default" 
                        onClick={async () => {
                          if (!user || !content) return;
                          const id = await AIPersistenceService.saveMealPlan(user.id, `AI Meal Plan (${days} days)`, content);
                          setSavedId(id);
                          // verify
                          const { data } = await supabase.from('meal_plans').select('id').eq('id', id).single();
                          setVerified(!!data);
                          await loadMealPlans();
                          alert('Meal plan saved successfully!');
                        }}
                        disabled={!content || Boolean(savedId)}
                        size="sm"
                        className="sm:h-10 sm:px-4 sm:text-base"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {savedId ? 'Saved!' : 'Save Meal Plan'}
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleEditMealPlan()}
                        disabled={!content}
                        size="sm"
                        className="sm:h-10 sm:px-4 sm:text-base"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit & Refine
                      </Button>
                    </>
                  )}
            {loading && <LoadingSpinner />}
          </div>
        </CardContent>
      </Card>

            {/* Generated Meal Plan */}
            {content && (
      <Card>
        <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-base sm:text-lg">Generated Meal Plan</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="default" 
                        onClick={async () => {
                          if (!user || !content) return;
                          const id = await AIPersistenceService.saveMealPlan(user.id, `AI Meal Plan (${days} days)`, content);
                          setSavedId(id);
                          // verify
                          const { data } = await supabase.from('meal_plans').select('id').eq('id', id).single();
                          setVerified(!!data);
                          await loadMealPlans();
                          alert('Meal plan saved successfully!');
                        }}
                        disabled={!content || Boolean(savedId)}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {savedId ? 'Saved!' : 'Save Meal Plan'}
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
                        onClick={() => handleEditMealPlan()}
                        disabled={!content}
                        size="sm"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit & Refine
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your AI-generated meal plan is ready! Save it to your collection, preview the formatted version, or edit and refine it further.
                  </CardDescription>
        </CardHeader>
        <CardContent>
                    {/* Show the structured display instead of raw textarea */}
                    <div ref={previewRef} className="rounded-xl p-6 bg-gradient-to-br from-white to-emerald-50 shadow-sm">
                      <StructuredMealPlanDisplay 
                        mealPlanData={content}
                        title="Generated Meal Plan"
                      />
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={handleExportImage}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4" />
                        {exporting ? 'Exporting...' : 'Export Image'}
                      </Button>
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

export default MealPlanAI;


