import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: contadores, error } = await supabase
      .from('contadores')
      .select('id, nombre, credencial, especialidad')
      .eq('activo', true);

    if (error) {
      // Return seed defaults if empty
      return NextResponse.json({
        contadores: [
          { id: 1, nombre: 'Carlos Pérez', credencial: 'TP 184590-T', especialidad: 'Tributaria Personas Naturales' },
          { id: 2, nombre: 'Maria Rodríguez', credencial: 'TP 201482-T', especialidad: 'Deducciones y Patrimonio' },
          { id: 3, nombre: 'Andrés Gómez', credencial: 'TP 229104-T', especialidad: 'Planeación Fiscal' },
        ],
      });
    }

    if (!contadores || contadores.length === 0) {
      return NextResponse.json({
        contadores: [
          { id: 1, nombre: 'Carlos Pérez', credencial: 'TP 184590-T', especialidad: 'Tributaria Personas Naturales' },
          { id: 2, nombre: 'Maria Rodríguez', credencial: 'TP 201482-T', especialidad: 'Deducciones y Patrimonio' },
          { id: 3, nombre: 'Andrés Gómez', credencial: 'TP 229104-T', especialidad: 'Planeación Fiscal' },
        ],
      });
    }

    return NextResponse.json({ contadores });
  } catch (error) {
    console.error('Error fetching contadores:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
