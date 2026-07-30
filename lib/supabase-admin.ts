import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = 'https://cllpslpejubqqdgnkisf.supabase.co';
const SUPABASE_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHBzbHBlanVicXFkZ25raXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAwNzgsImV4cCI6MjEwMDEyNjA3OH0.NWBADZJfBIP8XTG4iMMEDug43msf0OlZze7riBD-96s';

/**
 * Cliente server-side de Supabase.
 * Usa service_role para saltar RLS cuando está configurado.
 * Si no hay service_role, usa el JWT anon legacy compatible con @supabase/supabase-js v2.
 * NUNCA usa sb_publishable_* ya que ese formato no es compatible con la versión instalada.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

  // Solo usar service_role si existe y es un JWT válido
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const key = serviceRoleKey.startsWith('eyJ') ? serviceRoleKey : SUPABASE_ANON_JWT;

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
