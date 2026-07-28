import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calcularResultado, RespuestasCuestionario } from '@/lib/motor';

export async function POST(request: Request) {
  try {
    const payload: RespuestasCuestionario = await request.json();

    if (!payload.nombre || !payload.cedula || !payload.edad) {
      return NextResponse.json({ error: 'Datos incompletos: Nombre, cédula y edad son obligatorios' }, { status: 400 });
    }

    // Calcular resultado con el motor
    const resultado = calcularResultado(payload);

    const supabase = await createClient();

    // Obtener ID de arquetipo en la BD
    const { data: arqData } = await supabase
      .from('arquetipos')
      .select('id')
      .eq('slug', resultado.arquetipoSlug)
      .single();

    const arquetipoId = arqData?.id ?? null;

    // 1. Insertar Lead
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

    // 2. Insertar Respuestas para trazabilidad y recálculo
    await supabase.from('respuestas').insert({
      lead_id: leadData.id,
      payload: JSON.parse(JSON.stringify(payload)),
      version_motor: 'v1.0',
    });

    return NextResponse.json({
      success: true,
      slugPublico: leadData.slug_publico,
    });
  } catch (error: any) {
    console.error('Error procesando cuestionario:', error);
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
  }
}
