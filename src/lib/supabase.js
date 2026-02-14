import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 *
 * This creates a Supabase client for interacting with the database.
 *
 * Two types of clients:
 * 1. Browser client (anon key) - safe to use in frontend, respects Row Level Security (RLS)
 * 2. Service role client (service key) - admin access, used in serverless functions
 *
 * Environment variables needed:
 * - VITE_SUPABASE_URL or SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (serverless only, never expose to frontend)
 */

// Browser/frontend client (safe for public use)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

// Service role client for serverless functions (admin access)
// Only use this in backend/serverless contexts, NEVER in frontend
export const supabaseAdmin = (url, serviceKey) => {
  if (!url || !serviceKey) {
    throw new Error('Supabase URL and Service Role Key are required for admin client');
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
