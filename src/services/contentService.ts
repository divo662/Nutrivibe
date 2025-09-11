import { supabase } from '@/integrations/supabase/client';

export type Task = {
  id: string;
  title: string;
  calories: number | null;
  ingredients_summary: string | null;
  time_minutes: number | null;
  state: 'to_do' | 'in_progress' | 'cancelled' | 'done';
};

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: string | null;
  checked: boolean;
};

export type StickyNote = { id: string; content: string; sort_order: number | null };

export class ContentService {
  static async getMealToday() {
    // Placeholder: latest meal_plan for today
    const { data } = await supabase
      .from('meal_plans')
      .select('id,title,summary,plan_date')
      .order('plan_date', { ascending: false })
      .limit(1);
    return data?.[0] ?? null;
  }

  static async getRecipes(limit = 3) {
    const { data, error } = await supabase
      .from('recipes')
      .select('id,title,calories,image_url')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  static async getShoppingList() {
    // grab latest list
    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);
    const listId = lists?.[0]?.id;
    if (!listId) return [] as ShoppingListItem[];
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('id,name,quantity,checked')
      .eq('list_id', listId)
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as ShoppingListItem[];
  }

  static async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('id,title,calories,ingredients_summary,time_minutes,state')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []) as Task[];
  }

  static async getStickyNotes(): Promise<StickyNote[]> {
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('id,content,sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as StickyNote[];
  }
}


