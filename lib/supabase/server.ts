import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

const SUPABASE_URL = 'https://cllpslpejubqqdgnkisf.supabase.co';
const SUPABASE_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHBzbHBlanVicXFkZ25raXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAwNzgsImV4cCI6MjEwMDEyNjA3OH0.NWBADZJfBIP8XTG4iMMEDug43msf0OlZze7riBD-96s';

function resolveAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return envKey.startsWith('eyJ') ? envKey : SUPABASE_ANON_JWT;
}

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

  return createServerClient<Database>(url, resolveAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component setAll ignore
        }
      },
    },
  });
}
