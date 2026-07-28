import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';

function hashPwd(pwd: string) {
  return createHash('sha256').update(pwd + 'stakeholders2026').digest('hex');
}

/* GET /api/admin/usuarios — list all users */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, created_at')
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('usuarios')
      .insert({ nombre, email: email.toLowerCase().trim(), rol, activo: true, password_hash: hashPwd(password) })
      .select('id, nombre, email, rol, activo, created_at')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ usuario: data });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/admin/usuarios — update user (rol, activo, password) */
export async function PATCH(request: Request) {
  try {
    const { id, rol, activo, password } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const updates: Record<string, unknown> = {};
    if (rol !== undefined) updates.rol = rol;
    if (activo !== undefined) updates.activo = activo;
    if (password) updates.password_hash = hashPwd(password);
    const supabase = await createClient();
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
    const supabase = await createClient();
    const { error } = await supabase.from('usuarios').update({ activo: false }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
