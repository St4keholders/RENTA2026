import { supabaseAdmin } from '@/lib/supabase-admin';

export interface ResolvedReferrer {
  id: string;
  rol: string;
  referral_slug?: string;
}

/**
 * Resuelve un slug de referido a un usuario real en la base de datos `usuarios`.
 * Admite:
 * 1. Búsqueda exacta por `referral_slug`
 * 2. Búsqueda por `id` exacto o prefijo
 * 3. Búsqueda por coincidencia de nombre normalizado (ej: "Vendedor 2" -> "vendedor2")
 * 
 * Si el usuario encontrado no tenía `referral_slug` en la BD, se le asigna automáticamente.
 */
export async function resolveReferrer(refSlug: string | null | undefined): Promise<ResolvedReferrer | null> {
  if (!refSlug || typeof refSlug !== 'string') return null;
  const cleanRef = refSlug.trim();
  if (!cleanRef) return null;

  const supabase = supabaseAdmin();

  // 1. Coincidencia exacta por referral_slug
  try {
    const { data: userBySlug } = await supabase
      .from('usuarios')
      .select('id, rol, referral_slug')
      .eq('referral_slug', cleanRef)
      .maybeSingle();

    if (userBySlug) {
      return { id: userBySlug.id, rol: userBySlug.rol, referral_slug: userBySlug.referral_slug || undefined };
    }
  } catch (e) {
    console.error('[resolveReferrer] Error buscando por referral_slug:', e);
  }

  // 2. Coincidencia exacta por ID de usuario
  try {
    const { data: userById } = await supabase
      .from('usuarios')
      .select('id, rol, referral_slug')
      .eq('id', cleanRef)
      .maybeSingle();

    if (userById) {
      if (!userById.referral_slug) {
        await supabase.from('usuarios').update({ referral_slug: cleanRef } as any).eq('id', userById.id);
      }
      return { id: userById.id, rol: userById.rol, referral_slug: cleanRef };
    }
  } catch (e) {
    console.error('[resolveReferrer] Error buscando por id:', e);
  }

  // 3. Fallback inteligente: buscar entre todos los usuarios activos por nombre o ID corto
  try {
    const { data: allUsers } = await supabase
      .from('usuarios')
      .select('id, nombre, rol, referral_slug')
      .eq('activo', true);

    if (!allUsers || allUsers.length === 0) return null;

    const target = cleanRef.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const u of allUsers) {
      const normName = (u.nombre || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hyphenatedName = (u.nombre || '').toLowerCase().trim().replace(/\s+/g, '-');
      const shortId = (u.id || '').substring(0, 6).toLowerCase();
      const storedSlug = (u.referral_slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      if (target === normName || cleanRef.toLowerCase() === hyphenatedName || target === shortId || target === storedSlug) {
        const slugToSave = u.referral_slug || cleanRef;
        await supabase.from('usuarios').update({ referral_slug: slugToSave } as any).eq('id', u.id);
        return { id: u.id, rol: u.rol, referral_slug: slugToSave };
      }
    }
  } catch (e) {
    console.error('[resolveReferrer] Error buscando por fallback de usuarios:', e);
  }

  return null;
}
