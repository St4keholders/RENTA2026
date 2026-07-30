import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* GET /api/ajustes — get app settings */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', true)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ settings: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/ajustes — update app settings (admin only) */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tope, pct_contador, pct_vendedor, pct_desarrollo, pct_ref_bajo, pct_ref_sobre } = body;

    const supabase = await createClient();
    const { error } = await supabase
      .from('app_settings')
      .update({ tope, pct_contador, pct_vendedor, pct_desarrollo, pct_ref_bajo, pct_ref_sobre } as any)
      .eq('id', true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
