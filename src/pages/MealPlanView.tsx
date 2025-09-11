import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Target, Eye } from 'lucide-react';
import StructuredMealPlanDisplay from '@/components/ai/StructuredMealPlanDisplay';

import MealPlanSharing from '@/components/ai/MealPlanSharing';
import { toast } from 'sonner';

interface MealPlan {
  id: string;
  title: string;
  summary: string;
  plan_date: string;
  total_days?: number;
  estimated_calories?: number;
  data: any;
  created_at: string;
  updated_at: string;
}

const MealPlanView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMealPlan(id);
    }
  }, [id]);

  const loadMealPlan = async (mealPlanId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', mealPlanId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setMealPlan(data);
      } else {
        setError('Meal plan not found');
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Meal Plan Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'The meal plan you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-2"
              size="sm"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">{mealPlan.title}</h1>
            <p className="text-muted-foreground text-sm">
              Created on {formatDate(mealPlan.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mealPlan.total_days && (
              <Badge variant="outline" className="text-xs">
                {mealPlan.total_days} days
              </Badge>
            )}
            {mealPlan.estimated_calories && mealPlan.estimated_calories > 0 && (
              <Badge variant="outline" className="text-xs">
                ~{mealPlan.estimated_calories} cal/day
              </Badge>
            )}
          </div>
        </div>

        {/* Meal Plan Display */}
        <div className="mb-6">
          <StructuredMealPlanDisplay 
            mealPlanData={mealPlan.data}
            title={mealPlan.title}
          />
        </div>


        
        {/* Sharing Section */}
        <MealPlanSharing
          mealPlanId={mealPlan.id}
          mealPlanTitle={mealPlan.title}
          mealPlanData={mealPlan.data}
        />
      </div>
    </div>
  );
};

export default MealPlanView;
