import { supabase } from '@/integrations/supabase/client';

function tryParseJSON<T = any>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const AIPersistenceService = {
  async saveMealPlan(userId: string, title: string, content: string) {
    try {
      console.log('Saving meal plan for user:', userId, 'Title:', title);
      
      // Try to parse the content as JSON first, fallback to markdown parsing
      let parsed = tryParseJSON(content);
      let isMarkdown = false;
      
      if (!parsed) {
        // If not JSON, it's markdown - parse it to extract structure
        isMarkdown = true;
        parsed = this.parseMarkdownMealPlan(content);
      }
      
      // Extract key information for better database structure
      let summary = 'AI Generated Meal Plan';
      let planDate = new Date().toISOString().slice(0, 10);
      let totalDays = 1;
      let estimatedCalories = 0;
      
      if (parsed) {
        summary = parsed.summary || parsed.description || 'AI Generated Meal Plan';
        
        // Extract number of days
        if (parsed.days && Array.isArray(parsed.days)) {
          totalDays = parsed.days.length;
          
          // Calculate total estimated calories
          parsed.days.forEach((day: any) => {
            if (day.totalCalories) {
              estimatedCalories += day.totalCalories;
            } else if (day.meals && Array.isArray(day.meals)) {
              day.meals.forEach((meal: any) => {
                if (meal.calories) {
                  estimatedCalories += meal.calories;
                }
              });
            }
          });
        }
        
        // Extract plan date if available
        if (parsed.days && parsed.days[0] && parsed.days[0].date) {
          planDate = parsed.days[0].date;
        }
      }

      const mealPlanData = {
        user_id: userId,
        title: title,
        summary: summary,
        plan_date: planDate,
        total_days: totalDays,
        estimated_calories: estimatedCalories,
        data: parsed || { raw: content, generated_at: new Date().toISOString() }
      };

      console.log('Meal plan data to insert:', mealPlanData);

    const { data, error } = await supabase
      .from('meal_plans')
        .insert(mealPlanData)
        .select('id')
        .single();

      if (error) {
        console.error('Error saving meal plan:', error);
        throw error;
      }

      console.log('Meal plan saved successfully with ID:', data.id);
      
      // If we have structured data, also save individual meals for better querying
      if (parsed && parsed.days && Array.isArray(parsed.days)) {
        await this.saveMealPlanDetails(data.id, userId, parsed);
      }
      
      return data.id as string;
    } catch (error) {
      console.error('Failed to save meal plan:', error);
      throw error;
    }
  },

  // Parse markdown meal plan content into structured data
  parseMarkdownMealPlan(markdownContent: string) {
    try {
      console.log('Parsing markdown meal plan content');
      console.log('Content preview:', markdownContent.substring(0, 500));
      
      const lines = markdownContent.split('\n');
      const result: any = {
        summary: '',
        days: [],
        shoppingList: { categories: [] },
        mealPrepTips: [],
        culturalNotes: [],
        substitutions: []
      };
      
      let currentDay: any = null;
      let currentMeal: any = null;
      let currentSection = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;
        
        // Extract summary from the first paragraph
        if (i < 10 && line.includes('!') && !result.summary) {
          result.summary = line;
          continue;
        }
        
        // Parse day headers - handle multiple formats
        if (line.startsWith('**Day ') || line.startsWith('## **Day ') || line.startsWith('## Day ') || line.startsWith('### **Day ')) {
          const dayMatch = line.match(/Day (\d+)/);
          if (dayMatch) {
            currentDay = {
              day: `Day ${dayMatch[1]}`,
              totalCalories: 0,
              meals: []
            };
            result.days.push(currentDay);
          }
          continue;
        }
        
        // Parse meal headers - handle multiple AI formats
        // 1) Bold header: **Breakfast**: Name (400 calories)
        // 2) Bold header no name: **Breakfast** (400 calories)
        // 3) Markdown header: ### Breakfast (400 calories)
        // 4) Bullet header without bold: * Breakfast: Name (400 calories)
        if (line.includes('Breakfast') || line.includes('Lunch') || line.includes('Dinner') || line.includes('Snack')) {
          let mealType = '';
          let mealName = '';
          let mealCalories = 0;

          let m = line.match(/\*\*(Breakfast|Lunch|Dinner|Snack)\*\*:\s*(.*?)\s*\((\d+)\s*calories?\)/i);
          if (m) {
            mealType = m[1];
            mealName = m[2] || m[1];
            mealCalories = parseInt(m[3]) || 0;
          }
          if (!m) {
            m = line.match(/\*\*(Breakfast|Lunch|Dinner|Snack)\*\*\s*\((\d+)\s*calories?\)/i);
            if (m) {
              mealType = m[1];
              mealName = m[1];
              mealCalories = parseInt(m[2]) || 0;
            }
          }
          if (!m) {
            m = line.match(/^[*-]\s*(Breakfast|Lunch|Dinner|Snack):\s*(.*?)\s*\((\d+)\s*calories?\)/i);
            if (m) {
              mealType = m[1];
              mealName = m[2] || m[1];
              mealCalories = parseInt(m[3]) || 0;
            }
          }
          if (!m) {
            m = line.match(/^###\s*(Breakfast|Lunch|Dinner|Snack)\s*\((\d+)\s*calories?\)/i);
            if (m) {
              mealType = m[1];
              mealName = m[1];
              mealCalories = parseInt(m[2]) || 0;
            }
          }

          if (m && currentDay) {
            currentMeal = {
              mealType: (mealType || '').toLowerCase(),
              name: mealName ? mealName.trim() : (mealType || '').trim(),
              calories: mealCalories,
              ingredients: [],
              instructions: []
            };
            currentDay.meals.push(currentMeal);
            currentDay.totalCalories += currentMeal.calories;
            continue;
          }
        }
        
        // Parse ingredients (lines starting with + or -)
        if ((line.startsWith('+ ') || line.startsWith('- ')) && currentMeal) {
          const ingredient = line.substring(2).trim();
          currentMeal.ingredients.push(ingredient);
          continue;
        }
        
        // Parse total calories for the day
        if (line.includes('Total Calories:') && currentDay) {
          const caloriesMatch = line.match(/Total Calories: (\d+)/);
          if (caloriesMatch) {
            currentDay.totalCalories = parseInt(caloriesMatch[1]);
          }
          continue;
        }
        
        // Parse shopping list
        if (line.includes('**Grocery Shopping List:**') || line.includes('### **Grocery Shopping List**')) {
          currentSection = 'shopping';
          continue;
        }
        
        if (currentSection === 'shopping' && line.startsWith('* ') && !line.includes('**')) {
          const item = line.substring(2).trim();
          if (item && !item.includes(':')) {
            result.shoppingList.categories.push({
              category: 'General',
              items: [{ name: item, quantity: '1', notes: '' }]
            });
          }
        }
        
        // Parse meal prep tips
        if (line.includes('**Meal Prep Tips:**') || line.includes('### **Meal Prep Tips**')) {
          currentSection = 'tips';
          continue;
        }
        
        if (currentSection === 'tips' && line.startsWith('* ') && !line.includes('**')) {
          const tip = line.substring(2).trim();
          if (tip) {
            result.mealPrepTips.push(tip);
          }
        }
        
        // Parse nutritional breakdown
        if (line.includes('**Nutritional Breakdown:**')) {
          currentSection = 'nutrition';
          continue;
        }
        
        if (currentSection === 'nutrition' && line.startsWith('* ')) {
          const nutritionLine = line.substring(2).trim();
          if (nutritionLine.includes('Calories:')) {
            const caloriesMatch = nutritionLine.match(/Calories: (\d+)/);
            if (caloriesMatch) {
              result.nutritionalGoals = {
                dailyCalories: parseInt(caloriesMatch[1])
              };
            }
          }
        }
      }
      
      console.log('Parsed markdown result:', result);
      return result;
      
    } catch (error) {
      console.error('Error parsing markdown meal plan:', error);
      return null;
    }
  },

  async saveMealPlanDetails(mealPlanId: string, userId: string, mealPlanData: any) {
    try {
      console.log('Saving detailed meal plan data for plan:', mealPlanId);
      
      // Save individual meals if the meals table exists
      const mealsToSave = [];
      
      mealPlanData.days.forEach((day: any, dayIndex: number) => {
        if (day.meals && Array.isArray(day.meals)) {
          day.meals.forEach((meal: any, mealIndex: number) => {
            mealsToSave.push({
              meal_plan_id: mealPlanId,
              user_id: userId,
              day_number: day.day || dayIndex + 1,
              meal_order: mealIndex + 1,
              meal_type: meal.type || 'unknown',
              name: meal.name || 'Unnamed Meal',
              description: meal.description || '',
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fat: meal.fat || 0,
              fiber: meal.fiber || 0,
              prep_time: meal.prepTime || 0,
              cooking_time: meal.cookingTime || 0,
              difficulty: meal.difficulty || 'medium',
              ingredients: meal.ingredients || [],
              instructions: meal.instructions || [],
              nutritional_notes: meal.nutritionalNotes || '',
              cultural_context: meal.culturalContext || '',
              data: meal
            });
          });
        }
      });

      if (mealsToSave.length > 0) {
        // Try to save to meals table if it exists
        try {
          // Use any type to bypass type checking for the meals table
          const { error: mealsError } = await (supabase as any)
            .from('meals')
            .insert(mealsToSave);
          
          if (mealsError) {
            console.warn('Could not save individual meals (table might not exist):', mealsError);
          } else {
            console.log(`Saved ${mealsToSave.length} individual meals`);
          }
        } catch (error) {
          console.warn('Meals table not available, skipping individual meal storage');
        }
      }

      // Save shopping list if available
      if (mealPlanData.shoppingList) {
        await this.saveShoppingListFromMealPlan(userId, mealPlanId, mealPlanData.shoppingList);
      }

    } catch (error) {
      console.error('Error saving meal plan details:', error);
      // Don't throw here as the main meal plan was already saved
    }
  },

  async saveShoppingListFromMealPlan(userId: string, mealPlanId: string, shoppingList: any) {
    try {
      if (!shoppingList.categories) return;

      // Create the main shopping list
      const { data: listRow, error: listErr } = await supabase
        .from('shopping_lists')
        .insert({ 
          user_id: userId, 
          title: `Shopping List for Meal Plan`,
          status: 'active',
          meal_plan_id: mealPlanId
        })
        .select('id')
        .single();
        
      if (listErr) throw listErr;
      const listId = listRow.id as string;

      // Process items by category
      const allItems = [];
      Object.entries(shoppingList.categories).forEach(([category, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            allItems.push({
              list_id: listId,
              user_id: userId,
              name: item.name,
              quantity: item.totalAmount,
              category: category,
              priority: item.priority || 'important',
              estimated_cost: item.estimatedCost || 0,
              storage: item.storage || 'pantry',
              checked: false
            });
          });
        }
      });

      if (allItems.length > 0) {
        const { error: itemsErr } = await supabase
          .from('shopping_list_items')
          .insert(allItems);
        
        if (itemsErr) throw itemsErr;
        console.log(`Saved ${allItems.length} shopping list items`);
      }

    } catch (error) {
      console.error('Error saving shopping list from meal plan:', error);
    }
  },

  async saveRecipe(userId: string, title: string, content: string) {
    try {
      console.log('Saving recipe for user:', userId, 'Title:', title);
      
      // Try to extract a better title from the AI markdown (first heading or "Recipe: ...")
      let extractedTitle = title;
      try {
        const headingMatch = content.match(/^\s*#\s+(.+)$/m) || content.match(/^\s*\*\*Recipe:\s*([^\n*]+)\*\*/m) || content.match(/^\s*Recipe:\s*(.+)$/m);
        if (headingMatch && headingMatch[1]) {
          extractedTitle = headingMatch[1].trim();
          // Strip trailing formatting characters
          extractedTitle = extractedTitle.replace(/\**$/,'').replace(/\s+\*+$/,'').trim();
        }
      } catch (e) {
        console.warn('Could not extract title from content, using fallback title');
      }

      // Always save the raw markdown content
      const recipeData = {
        user_id: userId,
        title: extractedTitle || title || 'AI Recipe',
        description: 'AI Generated Recipe',
        calories: null,
        image_url: null,
        data: { 
          raw: content, 
          generated_at: new Date().toISOString(),
          format: 'markdown'
        }
      };

      console.log('Recipe data to insert:', recipeData);

      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeData)
      .select('id')
      .single();

      if (error) {
        console.error('Error saving recipe:', error);
        throw error;
      }

      console.log('Recipe saved successfully with ID:', data.id);
    return data.id as string;
    } catch (error) {
      console.error('Failed to save recipe:', error);
      throw error;
    }
  },

  async saveRecipes(userId: string, recipesJSON: string) {
    try {
      console.log('Saving multiple recipes for user:', userId);
      
    const parsed = tryParseJSON<{ recipes?: any[] }>(recipesJSON);
    if (parsed?.recipes?.length) {
      const rows = parsed.recipes.map((r) => ({
        user_id: userId,
        title: r.name || r.title || 'AI Recipe',
        description: r.description ?? null,
        calories: r?.nutrition?.calories ?? null,
        image_url: r?.image || null,
        data: r
      }));
        
        console.log('Inserting recipe rows:', rows);
        
      const { error } = await supabase.from('recipes').insert(rows);
      if (error) throw error;
      return rows.length;
    }
      
    // Fallback: store one record with raw text
      const { error } = await supabase.from('recipes').insert({ 
        user_id: userId, 
        title: 'AI Recipes', 
        description: null, 
        data: { raw: recipesJSON, generated_at: new Date().toISOString() } 
      });
    if (error) throw error;
    return 1;
    } catch (error) {
      console.error('Failed to save recipes:', error);
      throw error;
    }
  },

  async saveShoppingList(userId: string, title: string, listJSON: string) {
    try {
      console.log('Saving shopping list for user:', userId, 'Title:', title);
      
    const parsed = tryParseJSON<any>(listJSON) ?? { raw: listJSON };

      const parseItemsFromMarkdown = (text: string): Array<{ name: string; quantity?: string }> => {
        const lines = text.split(/\r?\n/);
        const items: Array<{ name: string; quantity?: string }> = [];
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          // bullets: - item – qty OR - item - qty
          const bulletMatch = line.match(/^[-*]\s+(.*)$/);
          const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
          const content = bulletMatch?.[1] || numberedMatch?.[1];
          if (content) {
            const parts = content.split(/\s+[–-]\s+/); // en dash or hyphen separator
            const name = parts[0].trim();
            const quantity = parts[1]?.trim();
            if (name) items.push({ name, quantity });
          }
        }
        return items;
      };
      
      // First create the shopping list
    const { data: listRow, error: listErr } = await supabase
      .from('shopping_lists')
        .insert({ 
          user_id: userId, 
          title,
          status: 'active'
        })
      .select('id')
      .single();
        
    if (listErr) throw listErr;
    const listId = listRow.id as string;

      // Then add the items
    let items: Array<{ name: string; quantity?: string }> = [];
      if (Array.isArray(parsed?.items)) {
        items = parsed.items;
      } else if (typeof listJSON === 'string') {
        items = parseItemsFromMarkdown(listJSON);
      }
    if (Array.isArray(items) && items.length) {
        const rows = items.map((i) => ({ 
          list_id: listId, 
          user_id: userId, 
          name: i.name ?? 'Item', 
          quantity: i.quantity ?? null,
          checked: false
        }));
        
        console.log('Inserting shopping list items:', rows);
        
      const { error: itemsErr } = await supabase.from('shopping_list_items').insert(rows);
      if (itemsErr) throw itemsErr;
    }
      
      console.log('Shopping list saved successfully with ID:', listId);
    return listId;
    } catch (error) {
      console.error('Failed to save shopping list:', error);
      throw error;
    }
  }
};


