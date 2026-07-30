import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* GET /api/referral-events — list events for a referrer */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const referrer_id = searchParams.get('referrer_id');

    const supabase = await createClient();
    let query = supabase
      .from('referral_events')
      .select(`
        id, event_type, contact_name, contact_email, contact_phone, created_at,
        pipeline_lead:pipeline_lead_id (id, full_name, stage)
      `)
      .order('created_at', { ascending: false });

    if (referrer_id) query = query.eq('referrer_id', referrer_id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events: data || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/referral-events — record a referral event (test or consultoria) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referrer_slug, event_type, contact_name, contact_email, contact_phone } = body;

    if (!referrer_slug || !event_type)
      return NextResponse.json({ error: 'Slug y tipo requeridos' }, { status: 400 });

    const supabase = await createClient();

    // Resolve slug → referrer_id
    const { data: user } = await supabase
      .from('usuarios')
      .select('id')
      .eq('referral_slug', referrer_slug)
      .single();

    if (!user) return NextResponse.json({ error: 'Referido no encontrado' }, { status: 404 });

    const { data, error } = await supabase
      .from('referral_events')
      .insert({ referrer_id: user.id, event_type, contact_name, contact_email, contact_phone })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event: data, referrer_id: user.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
