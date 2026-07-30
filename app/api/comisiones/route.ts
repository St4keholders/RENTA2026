import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* GET /api/comisiones — list commissions for admin or beneficiary */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const beneficiary_id = searchParams.get('beneficiary_id');

    const supabase = await createClient();
    let query = supabase
      .from('commissions')
      .select(`
        id, role, base_amount, pct, amount, status, created_at, paid_at,
        pipeline_lead:pipeline_lead_id (id, full_name, declaration_amount, stage),
        beneficiary:beneficiary_id (id, nombre, email, rol)
      `)
      .order('created_at', { ascending: false });

    if (beneficiary_id) query = query.eq('beneficiary_id', beneficiary_id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ commissions: data || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/comisiones — mark commission as paid (manual, admin only) */
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'ID y status requeridos' }, { status: 400 });

    const supabase = await createClient();
    const updates: Record<string, unknown> = { status };
    if (status === 'pagada') updates.paid_at = new Date().toISOString();

    const { error } = await supabase.from('commissions').update(updates as any).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
