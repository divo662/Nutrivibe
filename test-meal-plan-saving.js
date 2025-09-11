// Test script to verify meal plan saving functionality
// Run this in the browser console to test

async function testMealPlanSaving() {
  try {
    console.log('Testing meal plan saving...');
    
    // Test data
    const testMealPlan = {
      title: 'Test AI Meal Plan',
      content: JSON.stringify({
        summary: 'Test meal plan for debugging',
        days: [
          {
            day: 1,
            meals: [
              {
                type: 'breakfast',
                name: 'Test Breakfast',
                description: 'A test breakfast meal',
                calories: 300
              }
            ]
          }
        ],
        generated_at: new Date().toISOString()
      })
    };
    
    console.log('Test data:', testMealPlan);
    
    // Test the AIPersistenceService
    const { AIPersistenceService } = await import('./src/services/aiPersistenceService.ts');
    
    // Get current user ID (you need to be logged in)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session. Please log in first.');
      return;
    }
    
    console.log('User ID:', session.user.id);
    
    // Try to save the meal plan
    const savedId = await AIPersistenceService.saveMealPlan(
      session.user.id,
      testMealPlan.title,
      testMealPlan.content
    );
    
    console.log('✅ Meal plan saved successfully with ID:', savedId);
    
    // Verify it was saved by fetching it
    const { data: savedMealPlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', savedId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching saved meal plan:', fetchError);
    } else {
      console.log('✅ Meal plan retrieved from database:', savedMealPlan);
    }
    
  } catch (error) {
    console.error('❌ Error testing meal plan saving:', error);
  }
}

// Run the test
testMealPlanSaving();
