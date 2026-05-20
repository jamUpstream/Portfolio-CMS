import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. API calls will fail until configured.');
}

export const supabaseAdmin = createClient(
  SUPABASE_URL || 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
  }
);
