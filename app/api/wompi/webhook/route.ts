import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyEventChecksum } from '@/lib/wompi';

/* GET /api/wompi/webhook — comprobación de estado */
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Wompi Webhook Endpoint Ready' });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. Validar checksum de seguridad del webhook
    const isValid = verifyEventChecksum(payload);
    if (!isValid) {
      console.warn('⚠️ Webhook de Wompi descartado: Firma/checksum no coincide.');
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
    }

    const transaction = payload.data?.transaction;
    if (!transaction) {
      return NextResponse.json({ error: 'Payload incompleto' }, { status: 400 });
    }

    const { reference, status, id: transactionId, payment_method_type, amount_in_cents } = transaction;

    if (!reference) {
      return NextResponse.json({ error: 'Referencia faltante' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // 2. Verificar que la orden exista y consultar su monto registrado
    const { data: order } = await supabase
      .from('orders')
      .select('id, amount_in_cents, status')
      .eq('reference', reference)
      .single();

    if (!order) {
      console.error(`Orden no encontrada para referencia ${reference}`);
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // 3. Validar monto para evitar manipulaciones de precio
    if (Number(order.amount_in_cents) !== Number(amount_in_cents)) {
      console.error(`⚠️ Discrepancia de monto en orden ${reference}: Esperado ${order.amount_in_cents}, Recibido ${amount_in_cents}`);
      return NextResponse.json({ error: 'Monto no coincide' }, { status: 400 });
    }

    // 4. Actualizar estado de la orden en Supabase usando service_role
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        wompi_transaction_id: transactionId,
        payment_method_type: payment_method_type || null,
        updated_at: new Date().toISOString(),
      })
      .eq('reference', reference);

    if (updateError) {
      console.error(`Error actualizando orden ${reference}:`, updateError);
      return NextResponse.json({ error: 'Error actualizando orden' }, { status: 500 });
    }

    console.log(`✅ Orden ${reference} actualizada a estado: ${status}`);
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error procesando webhook de Wompi:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
