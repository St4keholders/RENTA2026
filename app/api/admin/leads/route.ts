import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/* GET /api/admin/leads — list all leads with respuestas and full assignment roles */
export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id, slug_publico, nombre, cedula, edad, ocupacion,
        celular, correo, debe_declarar, topes_superados,
        barra_patrimonio, barra_ingresos, barra_creditos, barra_movimientos,
        fecha_vencimiento, extemporaneo, estado, pagado, etapa, created_at,
        contador_id, referrer_id, seller_id, source, valor_declaracion,
        arquetipos (nombre, slug),
        contador:usuarios!leads_contador_id_fkey (id, nombre, email, rol),
        referido:usuarios!leads_referrer_id_fkey (id, nombre, email, rol, referral_slug),
        vendedor:usuarios!leads_seller_id_fkey (id, nombre, email, rol),
        respuestas (payload, version_motor, created_at),
        ventas (id, medio_contacto, fecha_consulta, estado)
      `)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ leads: leads || [] });
  } catch (error) {
    console.error('Error fetching admin leads:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/admin/leads — update lead details, stage, payment, or assignments */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id, nombre, cedula, edad, celular, correo, estado,
      contador_id, referrer_id, seller_id, source, valor_declaracion,
      pagado, etapa
    } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (nombre !== undefined) updates.nombre = nombre;
    if (cedula !== undefined) updates.cedula = cedula;
    if (edad !== undefined) updates.edad = Number(edad);
    if (celular !== undefined) updates.celular = celular;
    if (correo !== undefined) updates.correo = correo;
    if (estado !== undefined) updates.estado = estado;
    if (contador_id !== undefined) updates.contador_id = contador_id;
    if (referrer_id !== undefined) updates.referrer_id = referrer_id;
    if (seller_id !== undefined) updates.seller_id = seller_id;
    if (source !== undefined) updates.source = source;
    if (valor_declaracion !== undefined) updates.valor_declaracion = Number(valor_declaracion);
    if (pagado !== undefined) updates.pagado = Boolean(pagado);
    if (etapa !== undefined) updates.etapa = etapa;

    const supabase = supabaseAdmin();
    const { error } = await supabase.from('leads').update(updates as any).eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* DELETE /api/admin/leads — delete lead completely */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabase = supabaseAdmin();
    await supabase.from('respuestas').delete().eq('lead_id', id);
    await supabase.from('ventas').delete().eq('lead_id', id);
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
