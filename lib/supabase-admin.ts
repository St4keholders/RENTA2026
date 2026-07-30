import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno de servidor.');
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
}
