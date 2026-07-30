import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

// JWT anon key del proyecto Supabase (fallback para cuando la env no está configurada en Vercel)
const SUPABASE_URL = 'https://cllpslpejubqqdgnkisf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHBzbHBlanVicXFkZ25raXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAwNzgsImV4cCI6MjEwMDEyNjA3OH0.NWBADZJfBIP8XTG4iMMEDug43msf0OlZze7riBD-96s';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  return createBrowserClient<Database>(url, anonKey);
}
