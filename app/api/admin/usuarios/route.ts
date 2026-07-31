import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hashPwd(pwd: string) {
  return createHash('sha256').update(pwd + 'stakeholders2026').digest('hex');
}

/* GET /api/admin/usuarios — list all users */
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, created_at, referral_slug')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ usuarios: data || [] });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/admin/usuarios — create user */
export async function POST(request: Request) {
  try {
    const { nombre, email, password, rol } = await request.json();
    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }
    const supabase = supabaseAdmin();
    const referralSlug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        email: email.toLowerCase().trim(),
        rol,
        activo: true,
        password_hash: hashPwd(password),
        referral_slug: referralSlug,
      })
      .select('id, nombre, email, rol, activo, created_at, referral_slug')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ usuario: data });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/admin/usuarios — update user (rol, activo, password, payout data) */
export async function PATCH(request: Request) {
  try {
    const { id, rol, activo, password, payout_bank, payout_account_type, payout_account_number, payout_doc_id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const updates: Record<string, unknown> = {};
    if (rol !== undefined) updates.rol = rol;
    if (activo !== undefined) updates.activo = activo;
    if (password) updates.password_hash = hashPwd(password);
    if (payout_bank !== undefined) updates.payout_bank = payout_bank;
    if (payout_account_type !== undefined) updates.payout_account_type = payout_account_type;
    if (payout_account_number !== undefined) updates.payout_account_number = payout_account_number;
    if (payout_doc_id !== undefined) updates.payout_doc_id = payout_doc_id;
    const supabase = supabaseAdmin();
    const { error } = await supabase.from('usuarios').update(updates as any).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* DELETE /api/admin/usuarios — deactivate user */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const supabase = supabaseAdmin();
    const { error } = await supabase.from('usuarios').update({ activo: false }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
