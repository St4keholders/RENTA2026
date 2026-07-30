import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { nombre, correo, celular, fecha, hora, medio_contacto } = await request.json();

    if (!nombre || !correo || !celular || !fecha) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Insertar Cita
    const { data: cita, error } = await supabase
      .from('citas')
      .insert({
        nombre: nombre.trim(),
        correo: correo.trim(),
        celular: celular.trim(),
        fecha_consulta: fecha,
        hora_consulta: hora || 'Sin hora específica',
        medio_contacto: medio_contacto || 'llamada',
        estado: 'agendado',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error al registrar cita en Supabase:', error);
      return NextResponse.json(
        { error: 'Error al registrar la cita en la base de datos' },
        { status: 500 }
      );
    }

    // 2. Crear también registro en tabla `leads` (para CRM clásico)
    try {
      await supabase
        .from('leads')
        .insert({
          nombre: nombre.trim(),
          cedula: 'Pendiente',
          edad: 0,
          ocupacion: 'Agendamiento Directo',
          celular: celular.trim(),
          correo: correo.trim(),
          debe_declarar: true,
          topes_superados: [],
          barra_patrimonio: 0,
          barra_ingresos: 0,
          barra_creditos: 0,
          barra_movimientos: 0,
          estado: 'agendado',
        });
    } catch (e) {
      console.error('Error insertando en leads:', e);
    }

    // 3. Revisar cookie de referido para atribución First-Touch
    let referrerId: string | null = null;
    try {
      const cookieStore = await cookies();
      const refSlug = cookieStore.get('rentash_ref')?.value;
      if (refSlug) {
        const { data: refUser } = await supabase
          .from('usuarios')
          .select('id')
          .eq('referral_slug', refSlug)
          .single();
        if (refUser) referrerId = refUser.id;
      }
    } catch (e) {
      console.error('Error al verificar cookie de referido:', e);
    }

    // 4. Crear registro en `pipeline_leads` (para Pipeline Fase 2)
    let pipelineLeadId: string | null = null;
    try {
      const { data: pLead } = await supabase
        .from('pipeline_leads')
        .insert({
          full_name: nombre.trim(),
          email: correo.trim(),
          phone: celular.trim(),
          source: referrerId ? 'referido' : 'directo',
          referrer_id: referrerId,
          stage: 'por_asignar',
        })
        .select('id')
        .single();
      if (pLead) pipelineLeadId = pLead.id;
    } catch (e) {
      console.error('Error insertando en pipeline_leads:', e);
    }

    // 5. Registrar evento de referido si existía slug
    if (referrerId) {
      try {
        await supabase.from('referral_events').insert({
          referrer_id: referrerId,
          event_type: 'consultoria',
          contact_name: nombre.trim(),
          contact_email: correo.trim(),
          contact_phone: celular.trim(),
          pipeline_lead_id: pipelineLeadId,
        });
      } catch (e) {
        console.error('Error insertando referral_event:', e);
      }
    }

    return NextResponse.json({ success: true, citaId: cita.id });
  } catch (error) {
    console.error('Error en API agendar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

