import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Initialize the Supabase client with the Service Role key
// This bypasses Row Level Security and is meant for backend use only
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
