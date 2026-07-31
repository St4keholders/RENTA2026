import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calcularResultado, RespuestasCuestionario } from '@/lib/motor';

export async function POST(request: Request) {
  try {
    const payload: RespuestasCuestionario & { ref?: string } = await request.json();

    if (!payload.nombre || !payload.cedula || !payload.edad) {
      return NextResponse.json({ error: 'Datos incompletos: Nombre, cédula y edad son obligatorios' }, { status: 400 });
    }

    // Calcular resultado con el motor
    const resultado = calcularResultado(payload);

    const supabase = supabaseAdmin();

    // Obtener ID de arquetipo en la BD
    const { data: arqData } = await supabase
      .from('arquetipos')
      .select('id')
      .eq('slug', resultado.arquetipoSlug)
      .single();

    const arquetipoId = arqData?.id ?? null;

    // 1. Resolver referrer_id desde el slug de referido (pasado por el cliente)
    let referrerId: string | null = null;
    let referrerRol: string | null = null;
    if (payload.ref) {
      try {
        const { data: refUser } = await supabase
          .from('usuarios')
          .select('id, rol')
          .eq('referral_slug', payload.ref)
          .single();
        if (refUser) {
          referrerId = refUser.id;
          referrerRol = refUser.rol;
        }
      } catch (e) {
        console.error('[api/leads] Error resolviendo referral slug:', e);
      }
    }

    // 2. Insertar Lead con referrer_id ya resuelto
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        nombre: payload.nombre,
        cedula: payload.cedula,
        edad: payload.edad,
        ocupacion: payload.ocupacion || 'empleado',
        celular: payload.celular || null,
        arquetipo_id: arquetipoId,
        debe_declarar: resultado.debeDeclarar,
        topes_superados: resultado.topesSuperados,
        barra_patrimonio: resultado.barraPatrimonio,
        barra_ingresos: resultado.barraIngresos,
        barra_creditos: resultado.barraCreditos,
        barra_movimientos: resultado.barraMovimientos,
        fecha_vencimiento: resultado.fechaVencimiento,
        extemporaneo: resultado.extemporaneo,
        estado: 'nuevo',
        referrer_id: referrerId,
        // Si el referrer es vendedor, también lo asignamos como seller desde el inicio
        seller_id: referrerRol === 'vendedor' ? referrerId : null,
        source: referrerId ? 'referido' : 'directo',
      })
      .select('id, slug_publico')
      .single();

    if (leadError || !leadData) {
      console.error('Error insertando lead:', leadError);
      return NextResponse.json(
        { error: leadError ? leadError.message : 'Error guardando resultado en la base de datos' },
        { status: 500 }
      );
    }

    // 3. Insertar Respuestas para trazabilidad y recálculo
    await supabase.from('respuestas').insert({
      lead_id: leadData.id,
      payload: JSON.parse(JSON.stringify(payload)),
      version_motor: 'v1.0',
    });

    // 4. Auto-crear entrada en pipeline_leads (etapa inicial: consultoria)
    let pipelineLeadId: string | null = null;
    try {
      const { data: pLead } = await supabase.from('pipeline_leads').insert({
        full_name: payload.nombre,
        email: payload.celular || null,
        phone: payload.celular || null,
        source: referrerId ? 'referido' : 'formulario',
        stage: 'consultoria',
        lead_id: leadData.id,
        referrer_id: referrerId,
        seller_id: referrerRol === 'vendedor' ? referrerId : null,
      }).select('id').maybeSingle();
      if (pLead) pipelineLeadId = pLead.id;
    } catch (e) {
      console.error('[api/leads] Error insertando pipeline_leads:', e);
    }

    // 5. Registrar evento de referido si había slug
    if (referrerId) {
      try {
        await supabase.from('referral_events').insert({
          referrer_id: referrerId,
          event_type: 'test',
          contact_name: payload.nombre,
          contact_phone: payload.celular || null,
          pipeline_lead_id: pipelineLeadId,
        });
      } catch (e) {
        console.error('[api/leads] Error insertando referral_event:', e);
      }
    }

    return NextResponse.json({
      success: true,
      slugPublico: leadData.slug_publico,
    });
  } catch (error: any) {
    console.error('Error procesando cuestionario:', error);
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
  }
}

