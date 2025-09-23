import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client instance (singleton pattern)
 * Uses appropriate credentials based on environment
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

/**
 * Get Supabase client with service role key for server-side operations
 * Use this for admin operations that bypass RLS
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key');
    return getSupabaseClient();
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Reset client instance (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}