import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: ventas, error } = await supabase
      .from('ventas')
      .select(`
        id,
        abono_consulta,
        pago_confirmado,
        fecha_consulta,
        precio_servicio,
        saldo_pendiente,
        estado,
        created_at,
        leads (id, nombre, cedula, celular, slug_publico),
        contadores (id, nombre, credencial)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ventas: ventas || [] });
  } catch (error) {
    console.error('Error fetching admin ventas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, estado, precio_servicio, pago_confirmado, contador_id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });
    }

    const updates: Database['public']['Tables']['ventas']['Update'] = { updated_at: new Date().toISOString() };
    if (estado !== undefined) updates.estado = estado;
    if (precio_servicio !== undefined) updates.precio_servicio = precio_servicio;
    if (pago_confirmado !== undefined) updates.pago_confirmado = pago_confirmado;
    if (contador_id !== undefined) updates.contador_id = contador_id;

    const supabase = await createClient();
    const { error } = await supabase.from('ventas').update(updates).eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating venta:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
