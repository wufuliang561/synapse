import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TopicRow = Database['public']['Tables']['topics']['Row'];
type TopicInsert = Database['public']['Tables']['topics']['Insert'];
type TopicUpdate = Database['public']['Tables']['topics']['Update'];

export interface TopicWithBranches extends TopicRow {
  branches: BranchRow[];
}

type BranchRow = Database['public']['Tables']['branches']['Row'];

class TopicsService {
  async getTopics(userId: string): Promise<TopicWithBranches[]> {
    const { data, error } = await supabase
      .from('topics')
      .select(`
        *,
        branches!branches_topic_id_fkey (*)
      `)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    return data as TopicWithBranches[];
  }

  async getTopic(topicId: string): Promise<TopicWithBranches | null> {
    const { data, error } = await supabase
      .from('topics')
      .select(`
        *,
        branches!branches_topic_id_fkey (*)
      `)
      .eq('id', topicId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Topic not found
      }
      throw new Error(`Failed to fetch topic: ${error.message}`);
    }

    return data as TopicWithBranches;
  }

  async createTopic(topic: Omit<TopicInsert, 'id' | 'created_at' | 'updated_at'>): Promise<TopicRow> {
    const { data, error } = await supabase
      .from('topics')
      .insert(topic)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create topic: ${error.message}`);
    }

    return data;
  }

  async updateTopic(topicId: string, updates: TopicUpdate): Promise<TopicRow> {
    const { data, error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', topicId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update topic: ${error.message}`);
    }

    return data;
  }

  async deleteTopic(topicId: string): Promise<void> {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId);

    if (error) {
      throw new Error(`Failed to delete topic: ${error.message}`);
    }
  }

  async archiveTopic(topicId: string): Promise<TopicRow> {
    return this.updateTopic(topicId, { is_archived: true });
  }

  async setCurrentBranch(topicId: string, branchId: string | null): Promise<TopicRow> {
    return this.updateTopic(topicId, { current_branch_id: branchId });
  }

  // Subscribe to real-time changes
  subscribeToTopics(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('topics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topics',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

export const topicsService = new TopicsService();