import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client with proper cookie handling
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Server-side Supabase client (for API routes - optional)
export const supabaseAdmin =
  typeof window === 'undefined' &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient<Database>(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;