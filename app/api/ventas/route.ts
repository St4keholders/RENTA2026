import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { leadSlug, contadorId, fechaConsulta, medioContacto } = await request.json();

    if (!leadSlug || !fechaConsulta) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Buscar el lead por slug_publico
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('id')
      .eq('slug_publico', leadSlug)
      .single();

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Insertar venta en estado agendado
    const { data: venta, error: ventaErr } = await supabase
      .from('ventas')
      .insert({
        lead_id: lead.id,
        contador_id: contadorId ? Number(contadorId) : null,
        abono_consulta: 100000,
        pago_confirmado: false,
        fecha_consulta: fechaConsulta,
        medio_contacto: medioContacto || 'whatsapp',
        estado: 'agendado',
      })
      .select('id')
      .single();

    if (ventaErr || !venta) {
      console.error('Error al registrar venta:', ventaErr);
      return NextResponse.json({ error: 'Error al registrar la cita' }, { status: 500 });
    }

    // Actualizar estado del lead a 'agendado'
    await supabase.from('leads').update({ estado: 'agendado' }).eq('id', lead.id);

    return NextResponse.json({ success: true, ventaId: venta.id });
  } catch (error) {
    console.error('Error en agendamiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
