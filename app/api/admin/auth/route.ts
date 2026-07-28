import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';

function hashPwd(pwd: string) {
  return createHash('sha256').update(pwd + 'stakeholders2026').digest('hex');
}

/* POST /api/admin/auth — login */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });

    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, password_hash')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    if (!user.activo) return NextResponse.json({ error: 'Usuario inactivo' }, { status: 403 });
    if (user.password_hash !== hashPwd(password)) return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });

    return NextResponse.json({
      success: true,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
