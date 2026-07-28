import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://cllpslpejubqqdgnkisf.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_VwDSVhkKPnX6trNK5RN4-Q_aV9TdHvS';

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
