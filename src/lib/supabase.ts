import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We manage sessions via Reddit OAuth + SecureStore
    autoRefreshToken: false,
  },
});
