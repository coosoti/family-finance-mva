import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Client-side Supabase client (for use in components)
export const supabase = createClientComponentClient<Database>();

// Server-side Supabase client (for API routes - optional)
// Only create if we're on the server and have the required env vars
export const supabaseAdmin =
  typeof window === 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;