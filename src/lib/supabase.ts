import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';
import type { RedditUser } from '@/api/reddit';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase client. Null if credentials are not configured (mock mode). */
export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // We manage sessions via Reddit OAuth + SecureStore
          autoRefreshToken: false,
        },
      })
    : null;

/**
 * Upsert user into Supabase `users` table after Reddit login.
 * Returns the Supabase UUID, or null if Supabase is not configured.
 */
export async function upsertSupabaseUser(user: RedditUser): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        reddit_id: user.id,
        username: user.name,
        icon_url: user.icon_img || null,
        total_karma: user.total_karma,
      },
      { onConflict: 'reddit_id' },
    )
    .select('id')
    .single();
  if (error) {
    console.warn('[Orca] Supabase user upsert failed:', error.message);
    return null;
  }
  return data.id;
}

/**
 * Create default user_preferences row if one doesn't exist.
 */
export async function ensureUserPreferences(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });
  if (error) {
    console.warn('[Orca] Supabase preferences upsert failed:', error.message);
  }
}
