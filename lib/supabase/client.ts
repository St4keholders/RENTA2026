import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

// JWT anon key legacy (formato eyJ...) — compatible con @supabase/supabase-js v2
const SUPABASE_URL = 'https://cllpslpejubqqdgnkisf.supabase.co';
const SUPABASE_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHBzbHBlanVicXFkZ25raXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAwNzgsImV4cCI6MjEwMDEyNjA3OH0.NWBADZJfBIP8XTG4iMMEDug43msf0OlZze7riBD-96s';

function resolveAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  // Si el env var tiene el nuevo formato sb_publishable_..., usar el JWT legacy
  return envKey.startsWith('eyJ') ? envKey : SUPABASE_ANON_JWT;
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  return createBrowserClient<Database>(url, resolveAnonKey());
}
