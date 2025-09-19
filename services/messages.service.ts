import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type MessageRow = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages']['Update'];

class MessagesService {
  async getMessages(branchId: string): Promise<MessageRow[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data;
  }

  async getMessage(messageId: string): Promise<MessageRow | null> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Message not found
      }
      throw new Error(`Failed to fetch message: ${error.message}`);
    }

    return data;
  }

  async createMessage(message: Omit<MessageInsert, 'id' | 'created_at' | 'updated_at'>): Promise<MessageRow> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return data;
  }

  async updateMessage(messageId: string, updates: MessageUpdate): Promise<MessageRow> {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return data;
  }

  async editMessage(messageId: string, newContent: string): Promise<MessageRow> {
    // First get the current message to store original content
    const currentMessage = await this.getMessage(messageId);
    if (!currentMessage) {
      throw new Error('Message not found');
    }

    return this.updateMessage(messageId, {
      content: newContent,
      is_edited: true,
      original_content: currentMessage.is_edited
        ? currentMessage.original_content
        : currentMessage.content
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  async getMessagesUpToIndex(branchId: string, messageIndex: number): Promise<MessageRow[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: true })
      .limit(messageIndex + 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data;
  }

  async getLastMessage(branchId: string): Promise<MessageRow | null> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No messages found
      }
      throw new Error(`Failed to fetch last message: ${error.message}`);
    }

    return data;
  }

  async getMessageCount(branchId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId);

    if (error) {
      throw new Error(`Failed to count messages: ${error.message}`);
    }

    return count || 0;
  }

  // Batch operations
  async createMessages(messages: Omit<MessageInsert, 'id' | 'created_at' | 'updated_at'>[]): Promise<MessageRow[]> {
    const { data, error } = await supabase
      .from('messages')
      .insert(messages)
      .select();

    if (error) {
      throw new Error(`Failed to create messages: ${error.message}`);
    }

    return data;
  }

  async deleteMessagesAfterIndex(branchId: string, messageIndex: number): Promise<void> {
    // First get all messages to find the ones to delete
    const messages = await this.getMessages(branchId);

    if (messageIndex >= messages.length) {
      return; // Nothing to delete
    }

    const messagesToDelete = messages.slice(messageIndex + 1);
    const messageIds = messagesToDelete.map(m => m.id);

    if (messageIds.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .in('id', messageIds);

    if (error) {
      throw new Error(`Failed to delete messages: ${error.message}`);
    }
  }

  // Subscribe to real-time changes
  subscribeToMessages(branchId: string, callback: (payload: any) => void) {
    return supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `branch_id=eq.${branchId}`
        },
        callback
      )
      .subscribe();
  }
}

export const messagesService = new MessagesService();