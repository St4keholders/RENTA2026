import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* GET /api/solicitudes — list lead requests */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('lead_requests')
      .select(`
        id, status, requested_at, resolved_at,
        pipeline_lead:pipeline_lead_id (id, full_name, stage),
        contador:contador_id (id, nombre, email),
        resolver:resolved_by (id, nombre)
      `)
      .order('requested_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ requests: data || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/solicitudes — contador requests a lead */
export async function POST(request: Request) {
  try {
    const { pipeline_lead_id, contador_id } = await request.json();
    if (!pipeline_lead_id || !contador_id)
      return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('lead_requests')
      .insert({ pipeline_lead_id, contador_id })
      .select('id, status')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/solicitudes — admin approves or rejects */
export async function PATCH(request: Request) {
  try {
    const { id, status, resolved_by } = await request.json();
    if (!id || !status)
      return NextResponse.json({ error: 'ID y status requeridos' }, { status: 400 });

    const supabase = await createClient();

    // Update request status
    const { error: reqError } = await supabase
      .from('lead_requests')
      .update({ status, resolved_by, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (reqError) return NextResponse.json({ error: reqError.message }, { status: 500 });

    // If approved: assign contador and change stage
    if (status === 'aprobada') {
      const { data: req } = await supabase
        .from('lead_requests')
        .select('pipeline_lead_id, contador_id')
        .eq('id', id)
        .single();

      if (req) {
        await supabase
          .from('pipeline_leads')
          .update({ assigned_contador_id: req.contador_id, stage: 'asignada', updated_at: new Date().toISOString() })
          .eq('id', req.pipeline_lead_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
