import { NextResponse } from 'next/server';
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

    return NextResponse.json({ success: true, citaId: cita.id });
  } catch (error) {
    console.error('Error en API agendar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
