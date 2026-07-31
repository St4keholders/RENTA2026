import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resolveReferrer } from '@/lib/resolveReferrer';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { nombre, correo, celular, fecha, hora, medio_contacto, ref } = payload;

    if (!nombre || !correo || !celular || !fecha) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados.' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // 1. Resolver referido FIRST (desde payload ref o cookie)
    let referrerId: string | null = null;
    let referrerRol: string | null = null;
    try {
      const cookieStore = await cookies();
      const refSlug = ref || cookieStore.get('rentash_ref')?.value;
      if (refSlug) {
        const resolved = await resolveReferrer(refSlug);
        if (resolved) {
          referrerId = resolved.id;
          referrerRol = resolved.rol;
          console.log(`✅ [api/agendar] Referido resuelto: ${refSlug} → ID: ${referrerId} (Rol: ${referrerRol})`);
        }
      }
    } catch (e) {
      console.error('[api/agendar] Error al verificar referido:', e);
    }

    const isVendedor = referrerRol === 'vendedor';

    // 2. Insertar Cita
    const { error: citaErr } = await supabase
      .from('citas')
      .insert({
        nombre: nombre.trim(),
        correo: correo.trim(),
        celular: celular.trim(),
        fecha_consulta: fecha,
        hora_consulta: hora || 'Sin hora específica',
        medio_contacto: medio_contacto || 'llamada',
        estado: 'agendado',
      });

    if (citaErr) {
      console.error('Error al registrar cita en Supabase:', citaErr);
    }

    // 3. Crear registro en tabla `leads` (para CRM con atribución de referido/vendedor)
    let leadId: string | null = null;
    try {
      const { data: leadData, error: leadErr } = await supabase
        .from('leads')
        .insert({
          nombre: nombre.trim(),
          cedula: 'Pendiente',
          edad: 0,
          ocupacion: 'empleado',
          celular: celular.trim(),
          correo: correo.trim(),
          debe_declarar: true,
          topes_superados: [],
          barra_patrimonio: 0,
          barra_ingresos: 0,
          barra_creditos: 0,
          barra_movimientos: 0,
          estado: 'agendado',
          referrer_id: referrerId,
          seller_id: isVendedor ? referrerId : null,
          source: referrerId ? 'referido' : 'directo',
        })
        .select('id')
        .single();

      if (leadData) leadId = leadData.id;
      if (leadErr) console.error('Error insertando en leads:', leadErr);
    } catch (e) {
      console.error('Error en bloque leads:', e);
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
          seller_id: isVendedor ? referrerId : null,
          lead_id: leadId,
          stage: 'consultoria',
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

    return NextResponse.json({ success: true, leadId });
  } catch (error) {
    console.error('Error en API agendar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
