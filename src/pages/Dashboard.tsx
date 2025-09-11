import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Target, Crown, Zap } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { debounce } from 'lodash';
import HeroBanner from '@/components/dashboard/HeroBanner';
import MealToday from '@/components/dashboard/MealToday';
import ShoppingList from '@/components/dashboard/ShoppingList';
import { Badge } from '@/components/ui/badge';

interface Profile {
  full_name: string | null;
  fitness_goal: string | null;
  dietary_preference: string | null;
  allergies: string[] | null;
  location: string | null;
  caloric_needs: number | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, getUsageStats } = useSubscription();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [usageStats, setUsageStats] = useState({
    dailyUsage: 0,
    monthlyUsage: 0,
    dailyLimit: 3,
    monthlyLimit: 90
  });

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If it's an auth error, the user might need to refresh their session
        if (error.code === 'PGRST301' || error.code === 'PGRST302') {
          // This is an auth error, could trigger session refresh
          console.log('Auth error detected, may need session refresh');
        }
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Network error fetching profile:', error);
      // Don't retry on network failures
    }
  };

  // Debounced version to prevent rapid successive calls
  const debouncedFetchProfile = useCallback(
    debounce(fetchProfile, 1000), // Wait 1 second between calls
    [user]
  );

  useEffect(() => {
    if (user) {
      debouncedFetchProfile();
      loadUsageStats();
    }
  }, [user, debouncedFetchProfile]);

  const loadUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const formatGoal = (goal: string | null) => {
    if (!goal) return 'Not set';
    return goal.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDiet = (diet: string | null) => {
    if (!diet || diet === 'none') return 'No specific diet';
    return diet.charAt(0).toUpperCase() + diet.slice(1);
  };

  const formatAllergies = (allergies: string[] | null) => {
    if (!allergies || allergies.length === 0) return 'None';
    return allergies.join(', ');
  };

  // Removed quick generate action from home preview for a simpler layout

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <HeroBanner />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <MealToday />
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Featured Recipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Red Bread & Jam</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Chef's Pick</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Grilled Chicken</div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <ShoppingList />
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {subscription?.plan === 'free' ? (
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  ) : (
                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  )}
                  AI Usage Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Daily Usage</span>
                    <Badge variant={usageStats.dailyUsage >= usageStats.dailyLimit ? "destructive" : "default"} className="text-xs">
                      {usageStats.dailyUsage}/{usageStats.dailyLimit}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Monthly Usage</span>
                    <Badge variant="outline" className="text-xs">
                      {usageStats.monthlyUsage}/{usageStats.monthlyLimit}
                    </Badge>
                  </div>
                  {subscription?.plan === 'free' && usageStats.dailyUsage >= usageStats.dailyLimit && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800">
                        Daily limit reached. <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs font-semibold"
                          onClick={() => navigate('/settings')}
                        >
                          Upgrade to Pro
                        </Button> for unlimited access!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile.full_name || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {profile.fitness_goal 
              ? `Ready to fuel your ${formatGoal(profile.fitness_goal)} journey?`
              : 'Complete your profile to get personalized recommendations!'
            }
            {subscription && (
              <span className="ml-2 inline-flex items-center gap-1">
                {subscription.plan === 'free' ? (
                  <Zap className="h-4 w-4 text-blue-600" />
                ) : (
                  <Crown className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">
                  {subscription.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                </span>
              </span>
            )}
          </p>
          
          {(!profile.fitness_goal || !profile.dietary_preference) && (
            <div className="mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm sm:text-base">Profile Setup Required</span>
              </div>
              <p className="text-amber-700 text-xs sm:text-sm mt-1">
                Complete your profile to unlock personalized meal plans and recommendations.
              </p>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;