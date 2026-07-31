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
      .select('id, amount_in_cents, status, lead_id, lead_slug')
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

    // 4. Actualizar estado de la orden
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

    // 5. Si el pago fue APROBADO → marcar el lead como pagado y avanzar etapa
    if (status === 'APPROVED') {
      let leadId = order.lead_id;

      // Si no tenemos lead_id directo, resolver por lead_slug
      if (!leadId && order.lead_slug) {
        const { data: leadData } = await supabase
          .from('leads')
          .select('id')
          .eq('slug_publico', order.lead_slug)
          .single();
        leadId = leadData?.id ?? null;
      }

      if (leadId) {
        // Leer datos actuales del lead para verificar referrer
        const { data: currentLead } = await supabase
          .from('leads')
          .select('referrer_id, seller_id')
          .eq('id', leadId)
          .single();

        // Si el lead tiene referido pero no vendedor, verificar si el referido es vendedor
        let sellerIdToSet: string | null | undefined = undefined;
        if (currentLead?.referrer_id && !currentLead?.seller_id) {
          const { data: referrerUser } = await supabase
            .from('usuarios')
            .select('id, rol')
            .eq('id', currentLead.referrer_id)
            .single();
          if (referrerUser?.rol === 'vendedor') {
            sellerIdToSet = referrerUser.id;
            console.log(`🔗 Asignando seller_id = referrer_id (vendedor) para lead ${leadId}`);
          }
        }

        // Marcar como pagado y avanzar a etapa de documentos
        // Usamos condicional para mantener tipos estrictos de Supabase
        if (sellerIdToSet !== undefined) {
          await supabase
            .from('leads')
            .update({ pagado: true, etapa: 'documentos', estado: 'agendado', seller_id: sellerIdToSet } as any)
            .eq('id', leadId);
        } else {
          await supabase
            .from('leads')
            .update({ pagado: true, etapa: 'documentos', estado: 'agendado' })
            .eq('id', leadId);
        }

        // Actualizar etapa en pipeline_leads también
        await supabase
          .from('pipeline_leads')
          .update({ stage: 'documentos', updated_at: new Date().toISOString() })
          .eq('lead_id', leadId);

        console.log(`✅ Lead ${leadId} marcado como PAGADO, etapa → documentos`);
      }
    }

    console.log(`✅ Orden ${reference} actualizada a estado: ${status}`);
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error procesando webhook de Wompi:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
