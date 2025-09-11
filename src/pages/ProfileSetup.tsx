import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

const ProfileSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    fitnessGoal: '',
    dietaryPreference: '',
    allergies: [] as string[],
    location: '',
    caloricNeeds: ''
  });

  const allergyOptions = [
    'Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Fish'
  ];

  const handleAllergyChange = (allergy: string, checked: boolean) => {
    if (checked) {
      setProfileData({
        ...profileData,
        allergies: [...profileData.allergies, allergy]
      });
    } else {
      setProfileData({
        ...profileData,
        allergies: profileData.allergies.filter(a => a !== allergy)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          fitness_goal: profileData.fitnessGoal,
          dietary_preference: profileData.dietaryPreference,
          allergies: profileData.allergies,
          location: profileData.location,
          caloric_needs: profileData.caloricNeeds ? parseInt(profileData.caloricNeeds) : null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Welcome to NutriVibe. Let's start your nutrition journey!"
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Complete Your Profile</CardTitle>
          <CardDescription>Tell us about your fitness goals and dietary preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fitness Goal</Label>
                <Select onValueChange={(value) => setProfileData({...profileData, fitnessGoal: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="athletic_performance">Athletic Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dietary Preference</Label>
                <Select onValueChange={(value) => setProfileData({...profileData, dietaryPreference: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific diet</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                    <SelectItem value="paleo">Paleo</SelectItem>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Lagos, Nigeria"
                  value={profileData.location}
                  onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calories">Daily Caloric Needs (optional)</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="e.g., 2000"
                  value={profileData.caloricNeeds}
                  onChange={(e) => setProfileData({...profileData, caloricNeeds: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Allergies (select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {allergyOptions.map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={allergy}
                      checked={profileData.allergies.includes(allergy)}
                      onCheckedChange={(checked) => handleAllergyChange(allergy, checked as boolean)}
                    />
                    <Label htmlFor={allergy} className="text-sm">{allergy}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;