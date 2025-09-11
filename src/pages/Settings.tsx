import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Shield, 
  Crown, 
  Zap, 
  Check, 
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  fitness_goal: string | null;
  dietary_preference: string | null;
  allergies: string[] | null;
  location: string | null;
  caloric_needs: number | null;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    subscription, 
    plans, 
    loading: subscriptionLoading,
    upgradeToPro,
    cancelSubscription,
    reactivateSubscription,
    getUsageStats
  } = useSubscription();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usageStats, setUsageStats] = useState({
    dailyUsage: 0,
    monthlyUsage: 0,
    dailyLimit: 0,
    monthlyLimit: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    fitness_goal: '',
    dietary_preference: '',
    allergies: '',
    location: '',
    caloric_needs: ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    mealReminders: true,
    weeklyReports: true
  });

  // Theme settings
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    dataAnalytics: true,
    personalizedRecommendations: true
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUsageStats();
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      // Load notification preferences from localStorage or database
      const savedNotifications = localStorage.getItem('nutrivibe_notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }

      // Load theme preference
      const savedTheme = localStorage.getItem('nutrivibe_theme') || 'system';
      setTheme(savedTheme);

      // Load language preference
      const savedLanguage = localStorage.getItem('nutrivibe_language') || 'en';
      setLanguage(savedLanguage);

      // Load privacy settings
      const savedPrivacy = localStorage.getItem('nutrivibe_privacy');
      if (savedPrivacy) {
        setPrivacySettings(JSON.parse(savedPrivacy));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          fitness_goal: data.fitness_goal || '',
          dietary_preference: data.dietary_preference || '',
          allergies: data.allergies?.join(', ') || '',
          location: data.location || '',
          caloric_needs: data.caloric_needs?.toString() || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  const fetchUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          fitness_goal: formData.fitness_goal || null,
          dietary_preference: formData.dietary_preference || null,
          allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : null,
          location: formData.location || null,
          caloric_needs: formData.caloric_needs ? parseInt(formData.caloric_needs) : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      await upgradeToPro(planId);
      toast({
        title: "Success",
        description: "Redirecting to checkout...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate upgrade",
        variant: "destructive"
      });
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      localStorage.setItem('nutrivibe_notifications', JSON.stringify(notifications));
      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('nutrivibe_theme', newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    toast({
      title: "Success",
      description: "Theme preference saved",
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('nutrivibe_language', newLanguage);
    toast({
      title: "Success",
      description: "Language preference saved",
    });
  };

  const handlePrivacySettingChange = (setting: string, value: boolean) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    localStorage.setItem('nutrivibe_privacy', JSON.stringify(newSettings));
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      // Get user's data from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: aiGenerations } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile,
        aiGenerations,
        preferences: {
          notifications,
          theme,
          language,
          privacy: privacySettings
        },
        exportDate: new Date().toISOString()
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutrivibe-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
    );
    
    if (!confirmed) return;
    
    try {
      // Delete user's data from Supabase
      await supabase
        .from('ai_generations')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      // Sign out the user
      await supabase.auth.signOut();
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted",
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive"
      });
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

  if (!profile) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, profile, and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and nutrition preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fitness_goal">Fitness Goal</Label>
                    <Select value={formData.fitness_goal} onValueChange={(value) => setFormData({ ...formData, fitness_goal: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your fitness goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Weight Loss</SelectItem>
                        <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="general_health">General Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dietary_preference">Dietary Preference</Label>
                    <Select value={formData.dietary_preference} onValueChange={(value) => setFormData({ ...formData, dietary_preference: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dietary preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Preference</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="pescatarian">Pescatarian</SelectItem>
                        <SelectItem value="keto">Keto</SelectItem>
                        <SelectItem value="paleo">Paleo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caloric_needs">Daily Caloric Needs</Label>
                    <Input
                      id="caloric_needs"
                      type="number"
                      value={formData.caloric_needs}
                      onChange={(e) => setFormData({ ...formData, caloric_needs: e.target.value })}
                      placeholder="e.g., 2000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Food Allergies & Intolerances</Label>
                  <Input
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="e.g., nuts, dairy, gluten (separate with commas)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Lagos, Nigeria"
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Current Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Current Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {profile.full_name || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Fitness Goal:</span> {formatGoal(profile.fitness_goal)}
                  </div>
                  <div>
                    <span className="font-medium">Diet:</span> {formatDiet(profile.dietary_preference)}
                  </div>
                  <div>
                    <span className="font-medium">Allergies:</span> {profile.allergies?.length ? profile.allergies.join(', ') : 'None'}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {profile.location || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Calories:</span> {profile.caloric_needs || 'Not set'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {subscription?.plan === 'free' ? (
                      <Zap className="h-8 w-8 text-blue-600" />
                    ) : (
                      <Crown className="h-8 w-8 text-yellow-600" />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {subscription?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.plan === 'free' 
                          ? 'Basic features with limited AI generations'
                          : 'Unlimited AI features and premium support'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                    {subscription?.status || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>AI Usage</CardTitle>
                <CardDescription>
                  Track your AI generation usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{usageStats.dailyUsage}</div>
                    <div className="text-sm text-muted-foreground">Used Today</div>
                    <div className="text-xs text-muted-foreground">Limit: {usageStats.dailyLimit}</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{usageStats.monthlyUsage}</div>
                    <div className="text-sm text-muted-foreground">Used This Month</div>
                    <div className="text-xs text-muted-foreground">Limit: {usageStats.monthlyLimit}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Upgrade Your Plan</CardTitle>
                <CardDescription>
                  Get unlimited AI generations and premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {plans.filter(plan => plan.id !== 'free').map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${plan.price}/{plan.interval}
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          Unlimited AI meal plans
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          Unlimited recipe generation
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          Priority support
                        </li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={subscription?.plan === plan.id}
                      variant={subscription?.plan === plan.id ? 'outline' : 'default'}
                    >
                      {subscription?.plan === plan.id ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Subscription Management */}
            {subscription?.plan !== 'free' && (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Next billing date</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.currentPeriodEnd 
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCancelSubscription}
                      className="flex-1"
                    >
                      Cancel Subscription
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={reactivateSubscription}
                      className="flex-1"
                    >
                      Reactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Privacy & Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Manage your data and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve NutriVibe with anonymous usage data
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.dataAnalytics}
                    onCheckedChange={(checked) => handlePrivacySettingChange('dataAnalytics', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Personalized Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Use your data to provide better meal suggestions
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.personalizedRecommendations}
                    onCheckedChange={(checked) => handlePrivacySettingChange('personalizedRecommendations', checked)}
                  />
                </div>
                <Separator />
                <Button variant="outline" className="w-full" onClick={handleExportData}>
                  Export My Data
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
                  Delete My Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Settings;
