import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { shoppingListService } from '@/services/ai/shopping-list-service';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AIPersistenceService } from '@/services/aiPersistenceService';
import AppShell from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Zap, AlertTriangle, Download, Eye, Trash2, Calendar } from 'lucide-react';
import StructuredShoppingListDisplay from '@/components/ai/StructuredShoppingListDisplay';
import { ImageExportService } from '@/services/imageExportService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  fitness_goal: string | null;
  dietary_preference: string | null;
  allergies: string[] | null;
  location: string | null;
  caloric_needs: number | null;
};

const ShoppingListAI: React.FC = () => {
  const { user } = useAuth();
  const { incrementAIUsage, getUsageStats, subscription } = useSubscription();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [mealPlan, setMealPlan] = useState('');
  const [budget, setBudget] = useState<'low'|'medium'|'high'>('medium');
  const [location, setLocation] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [lists, setLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'generate' | 'view' | 'detail'>('generate');
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportImage = async () => {
    if (!previewRef.current || !user) return;
    try {
      setExporting(true);
      const dataUrl = await ImageExportService.nodeToPng(previewRef.current, {
        pixelRatio: 2,
        backgroundColor: '#f7faf9'
      });
      ImageExportService.triggerDownload(dataUrl, `shopping-list-${location || 'ng'}.png`);
      if (savedId) {
        await ImageExportService.uploadToSupabase(user.id, savedId, dataUrl, 'meal-plan-images');
      }
    } finally {
      setExporting(false);
    }
  };
  const [usageStats, setUsageStats] = useState({
    dailyUsage: 0,
    monthlyUsage: 0,
    dailyLimit: 3,
    monthlyLimit: 90
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('user_id,full_name,fitness_goal,dietary_preference,allergies,location,caloric_needs')
        .eq('user_id', user.id)
        .single();
      setProfile(data as ProfileRow);
      
      // Set default location from profile
      if (data?.location) {
        setLocation(data.location);
      }
      
      // Load usage stats
      try {
        const stats = await getUsageStats();
        setUsageStats(stats);
      } catch (error) {
        console.error('Error loading usage stats:', error);
      }
    })();
  }, [user, getUsageStats]);

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
      const res = await shoppingListService.generateShoppingList(user.id, {
        id: profile.user_id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        fitness_goal: (profile.fitness_goal as any) || null,
        dietary_preference: (profile.dietary_preference as any) || null,
        allergies: profile.allergies,
        location: location || profile.location,
        caloric_needs: profile.caloric_needs,
        subscription_plan: null,
        subscription_status: null,
        usage_ai_generations: null,
        usage_ai_generations_reset_date: null,
      }, {
        mealPlan: mealPlan.split(',').map(s=>s.trim()).filter(Boolean),
        budget,
        location: location || profile.location || 'Nigeria',
        preferences: preferences.split(',').map(s=>s.trim()).filter(Boolean)
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
    // Derive a better title from the first meal in the input or fallback to location
    const firstMeal = mealPlan.split(',').map(s=>s.trim()).filter(Boolean)[0];
    const derivedTitle = firstMeal ? `${firstMeal} - Shopping List` : `AI Shopping List - ${location || 'Nigeria'}`;
    const id = await AIPersistenceService.saveShoppingList(user.id, derivedTitle, content);
    setSavedId(id);
    // verify
    const { data } = await supabase.from('shopping_lists').select('id').eq('id', id).single();
    setVerified(!!data);
    await loadLists();
  };

  const loadLists = async () => {
    if (!user) return;
    setLoadingLists(true);
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('id,title,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLists(data || []);
    } catch (e) {
      console.error('Error loading shopping lists:', e);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => { loadLists(); }, [user]);

  const handleDeleteList = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await loadLists();
    } catch (e) {
      console.error('Failed to delete list:', e);
    }
  };

  const handleViewList = async (list: any) => {
    if (!user) return;
    try {
      // Fetch base list
      const { data: base, error: baseErr } = await supabase
        .from('shopping_lists')
        .select('id,title,created_at')
        .eq('id', list.id)
        .eq('user_id', user.id)
        .single();
      if (baseErr) throw baseErr;

      // Fetch items
      const { data: items, error: itemsErr } = await supabase
        .from('shopping_list_items')
        .select('name,quantity,checked')
        .eq('list_id', list.id)
        .order('created_at');
      if (itemsErr) throw itemsErr;

      // Build simple markdown for display
      const body = (items || []).map(i => `- ${i.name}${i.quantity ? ` – ${i.quantity}` : ''}${i.checked ? ' (purchased)' : ''}`).join('\n');
      const md = `# ${base.title}\n\n## Items\n${body || '- (No items saved yet)'}\n`;

      setSelectedList({ ...base, data: { raw: md } });
      setViewMode('detail');
    } catch (e) {
      console.error('Failed to open list:', e);
    }
  };

  const canGenerate = usageStats.dailyUsage < usageStats.dailyLimit;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleBackToLists = () => {
    setSelectedList(null);
    setViewMode('view');
  };

  if (viewMode === 'detail' && selectedList) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button variant="ghost" onClick={handleBackToLists} size="sm" className="mb-2">← Back to Lists</Button>
              <h1 className="text-xl sm:text-2xl font-bold">{selectedList.title}</h1>
              <p className="text-muted-foreground text-sm">Created on {formatDate(selectedList.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={handleExportImage} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" /> {exporting ? 'Exporting...' : 'Export Image'}
              </Button>
            </div>
          </div>
          <div ref={previewRef} className="rounded-xl p-6 bg-gradient-to-br from-white to-emerald-50 shadow-sm">
            <StructuredShoppingListDisplay listData={selectedList.data || selectedList} title={selectedList.title} />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">AI Shopping List</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Generate optimized shopping lists and view your saved ones</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant={viewMode === 'generate' ? 'default' : 'outline'} onClick={() => setViewMode('generate')} size="sm">Generate New</Button>
            <Button variant={viewMode === 'view' ? 'default' : 'outline'} onClick={() => setViewMode('view')} size="sm"><Eye className="h-4 w-4 mr-2" /> View Lists ({lists.length})</Button>
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
              AI Shopping List Generator
            </CardTitle>
            <CardDescription>
              Generate optimized shopping lists based on your meal plans and preferences
            </CardDescription>
        </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {subscription?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                </p>
                <p className="text-xs text-muted-foreground">
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

        {viewMode === 'generate' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Shopping List</CardTitle>
            <CardDescription>Customize your shopping list generation parameters</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Meal Plan (comma-separated)</label>
              <Input 
                value={mealPlan} 
                onChange={e=>setMealPlan(e.target.value)}
                placeholder="e.g., jollof rice, grilled chicken, salad"
              />
              <label className="text-sm font-medium">Location</label>
              <Input 
                value={location} 
                onChange={e=>setLocation(e.target.value)}
                placeholder="e.g., Lagos, Abuja, Port Harcourt"
              />
              <label className="text-sm font-medium">Shopping Preferences (comma-separated)</label>
              <Input 
                value={preferences} 
                onChange={e=>setPreferences(e.target.value)}
                placeholder="e.g., local markets, organic, bulk buying"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Budget Range</label>
              <Select value={budget} onValueChange={(value: 'low'|'medium'|'high') => setBudget(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (₦5,000 - ₦15,000)</SelectItem>
                  <SelectItem value="medium">Medium (₦15,000 - ₦30,000)</SelectItem>
                  <SelectItem value="high">High (₦30,000+)</SelectItem>
                </SelectContent>
              </Select>
          </div>
            <div className="md:col-span-2 flex gap-2">
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !canGenerate}
                className="flex-1"
              >
                {loading ? 'Generating...' : canGenerate ? 'Generate Shopping List' : 'Daily Limit Reached'}
              </Button>
            <Button variant="secondary" onClick={handleSave} disabled={!content}>Save to Shopping Lists</Button>
            {loading && <LoadingSpinner />}
          </div>
          </CardContent>
        </Card>
        )}

        {/* Saved Shopping Lists */}
        {viewMode === 'view' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Shopping Lists ({lists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLists ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-sm">Loading lists...</span>
              </div>
            ) : lists.length === 0 ? (
              <div className="text-sm text-muted-foreground">No shopping lists yet.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lists.map((l) => (
                  <Card key={l.id} className="hover:shadow-sm cursor-pointer" onClick={() => handleViewList(l)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-2">{l.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(l.created_at).toLocaleDateString()}</span>
                      <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteList(l.id); }}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {viewMode === 'generate' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>Generated Shopping List</span>
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={handleExportImage} disabled={!content || exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export Image'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => {}} disabled={!content}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardTitle>
            {savedId && (<CardDescription>Saved as shopping list #{savedId} {verified ? '• Verified' : ''}</CardDescription>)}
          </CardHeader>
          <CardContent>
            <div ref={previewRef} className="rounded-xl p-6 bg-gradient-to-br from-white to-emerald-50 shadow-sm">
              <StructuredShoppingListDisplay listData={content} title="Shopping List" />
            </div>
        </CardContent>
      </Card>
        )}
      </div>
    </AppShell>
  );
};

export default ShoppingListAI;


