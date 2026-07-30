import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/* GET /api/pipeline — list pipeline_leads for admin */
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('pipeline_leads')
      .select(`
        id, full_name, email, phone, source, stage,
        declaration_amount, anticipo_paid_at, created_at, updated_at,
        referrer:referrer_id (id, nombre, email, rol),
        seller:seller_id (id, nombre, email, rol),
        assigned_contador:assigned_contador_id (id, nombre, email)
      `)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ leads: data || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/pipeline — create a new pipeline lead (vendedor) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, phone, seller_id, source = 'vendedor' } = body;
    if (!full_name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('pipeline_leads')
      .insert({ full_name, email, phone, seller_id, source, created_by: seller_id })
      .select('id, full_name, stage')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/pipeline — update stage, declaration_amount, assign contador */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, stage, declaration_amount, assigned_contador_id } = body;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (stage !== undefined) updates.stage = stage;
    if (declaration_amount !== undefined) updates.declaration_amount = Number(declaration_amount);
    if (assigned_contador_id !== undefined) updates.assigned_contador_id = assigned_contador_id;

    const supabase = supabaseAdmin();
    const { error } = await supabase.from('pipeline_leads').update(updates as any).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
