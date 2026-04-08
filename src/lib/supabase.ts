import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Default anon client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates an authenticated Supabase client using a Clerk JWT.
 * This should be used for any operations requiring RLS verification.
 */
export const createClerkSupabaseClient = (clerkToken: string | null) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: clerkToken ? {
        Authorization: `Bearer ${clerkToken}`,
      } : {},
    },
  });
};
