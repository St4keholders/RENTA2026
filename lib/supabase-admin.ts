import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cllpslpejubqqdgnkisf.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_VwDSVhkKPnX6trNK5RN4-Q_aV9TdHvS';

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
}
