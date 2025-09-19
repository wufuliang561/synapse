import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type UserPreferencesRow = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

class PreferencesService {
  async getUserPreferences(userId: string): Promise<UserPreferencesRow | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Preferences not found
      }
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }

    return data;
  }

  async updateUserPreferences(userId: string, updates: UserPreferencesUpdate): Promise<UserPreferencesRow> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    return data;
  }

  async setDefaultModel(userId: string, model: string): Promise<UserPreferencesRow> {
    return this.updateUserPreferences(userId, { default_model: model });
  }

  async setDefaultSystemPrompt(userId: string, systemPrompt: string): Promise<UserPreferencesRow> {
    return this.updateUserPreferences(userId, { default_system_prompt: systemPrompt });
  }

  async setUITheme(userId: string, theme: 'light' | 'dark' | 'auto'): Promise<UserPreferencesRow> {
    return this.updateUserPreferences(userId, { ui_theme: theme });
  }

  async setCanvasLayout(userId: string, layout: 'horizontal' | 'vertical'): Promise<UserPreferencesRow> {
    return this.updateUserPreferences(userId, { canvas_layout: layout });
  }

  async setApiKeys(userId: string, apiKeys: any): Promise<UserPreferencesRow> {
    return this.updateUserPreferences(userId, { api_keys: apiKeys });
  }
}

export const preferencesService = new PreferencesService();