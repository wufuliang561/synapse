import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type BranchRow = Database['public']['Tables']['branches']['Row'];
type BranchInsert = Database['public']['Tables']['branches']['Insert'];
type BranchUpdate = Database['public']['Tables']['branches']['Update'];

export interface BranchWithMessages extends BranchRow {
  messages: MessageRow[];
}

type MessageRow = Database['public']['Tables']['messages']['Row'];

class BranchesService {
  async getBranches(topicId: string): Promise<BranchRow[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }

    return data;
  }

  async getBranch(branchId: string): Promise<BranchWithMessages | null> {
    const { data, error } = await supabase
      .from('branches')
      .select(`
        *,
        messages!messages_branch_id_fkey (*)
      `)
      .eq('id', branchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Branch not found
      }
      throw new Error(`Failed to fetch branch: ${error.message}`);
    }

    // Sort messages by created_at
    if (data.messages) {
      data.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return data as BranchWithMessages;
  }

  async createBranch(branch: Omit<BranchInsert, 'id' | 'created_at' | 'updated_at'>): Promise<BranchRow> {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }

    return data;
  }

  async updateBranch(branchId: string, updates: BranchUpdate): Promise<BranchRow> {
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', branchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update branch: ${error.message}`);
    }

    return data;
  }

  async deleteBranch(branchId: string): Promise<void> {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId);

    if (error) {
      throw new Error(`Failed to delete branch: ${error.message}`);
    }
  }

  async updatePosition(branchId: string, position: { x: number; y: number }): Promise<BranchRow> {
    return this.updateBranch(branchId, { position });
  }

  async updateSystemPrompt(branchId: string, systemPrompt: string): Promise<BranchRow> {
    return this.updateBranch(branchId, { system_prompt: systemPrompt });
  }

  async updateModelConfig(branchId: string, modelConfig: any): Promise<BranchRow> {
    return this.updateBranch(branchId, { model_config: modelConfig });
  }

  async getChildBranches(parentId: string): Promise<BranchRow[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch child branches: ${error.message}`);
    }

    return data;
  }

  async getBranchHierarchy(topicId: string): Promise<BranchRow[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch branch hierarchy: ${error.message}`);
    }

    return data;
  }

  // Subscribe to real-time changes
  subscribeToBranches(topicId: string, callback: (payload: any) => void) {
    return supabase
      .channel('branches_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branches',
          filter: `topic_id=eq.${topicId}`
        },
        callback
      )
      .subscribe();
  }
}

export const branchesService = new BranchesService();