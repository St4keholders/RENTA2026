import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyEventChecksum } from '@/lib/wompi';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extraer los datos del evento de Wompi
    const event = body?.event;
    const transaction = body?.data?.transaction;

    if (event !== 'transaction.updated' || !transaction) {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const {
      id: transactionId,
      reference,
      status,
      payment_method_type,
    } = transaction;

    console.log(`[wompi-webhook] Evento recibido: Ref ${reference} | Estado: ${status} | Trans: ${transactionId}`);

    // 2. Verificar la firma de integridad de Wompi
    const isValid = verifyEventChecksum(body);
    if (!isValid) {
      console.warn(`⚠️ Signature de Wompi inválida para referencia ${reference}`);
    }

    const supabase = supabaseAdmin();

    // 3. Buscar la orden por referencia
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', reference)
      .single();

    if (orderFetchError || !order) {
      console.error(`Orden no encontrada para referencia ${reference}:`, orderFetchError);
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
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

      // Fallback 1: resolver por lead_slug si order.lead_id está vacío
      if (!leadId && order.lead_slug) {
        const { data: leadData } = await supabase
          .from('leads')
          .select('id')
          .eq('slug_publico', order.lead_slug)
          .single();
        leadId = leadData?.id ?? null;
      }

      // Fallback 2: resolver por teléfono del cliente si order.lead_id está vacío
      if (!leadId && order.customer_phone) {
        const { data: leadDataByPhone } = await supabase
          .from('leads')
          .select('id')
          .eq('celular', order.customer_phone.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (leadDataByPhone) leadId = leadDataByPhone.id;
      }

      // Fallback 3: resolver por correo del cliente si order.lead_id está vacío
      if (!leadId && order.customer_email) {
        const { data: leadDataByEmail } = await supabase
          .from('leads')
          .select('id')
          .eq('correo', order.customer_email.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (leadDataByEmail) leadId = leadDataByEmail.id;
      }

      // Fallback 4: resolver por nombre del cliente si order.lead_id está vacío
      if (!leadId && order.customer_name) {
        const { data: leadDataByName } = await supabase
          .from('leads')
          .select('id')
          .eq('nombre', order.customer_name.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (leadDataByName) leadId = leadDataByName.id;
      }

      if (leadId) {
        // Enlazar la orden con el lead encontrado en la BD si no estaba enlazado
        if (!order.lead_id) {
          await supabase.from('orders').update({ lead_id: leadId }).eq('reference', reference);
        }

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
      } else {
        console.warn(`⚠️ No se pudo vincular la orden ${reference} con ningún lead en la base de datos.`);
      }
    }

    console.log(`✅ Orden ${reference} actualizada a estado: ${status}`);
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error procesando webhook de Wompi:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}

