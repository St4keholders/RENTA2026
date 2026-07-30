import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateIntegritySignature, getWompiConfig } from '@/lib/wompi';

export async function POST(request: Request) {
  try {
    const { customer_email, customer_name, customer_phone } = await request.json();

    const amountInCents = 10000000; // $100.000 COP en centavos
    const currency = 'COP';
    const reference = `RENTA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Guardar orden en estado PENDING usando service_role
    const supabase = supabaseAdmin();
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        reference,
        amount_in_cents: amountInCents,
        currency,
        customer_email: customer_email || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        status: 'PENDING',
      });

    if (orderError) {
      console.error('Error creando orden de pago en Supabase:', orderError);
      return NextResponse.json({ error: 'Error al registrar orden de pago' }, { status: 500 });
    }

    // 2. Generar firma de integridad Wompi
    const signature = generateIntegritySignature(reference, amountInCents, currency);
    const { publicKey } = getWompiConfig();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${siteUrl}/pagos/respuesta?reference=${reference}`;
    const checkoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=${currency}&amount-in-cents=${amountInCents}&reference=${reference}&signature:integrity=${signature}&redirect-url=${encodeURIComponent(redirectUrl)}`;

    return NextResponse.json({
      success: true,
      reference,
      amountInCents,
      currency,
      publicKey,
      signature,
      redirectUrl,
      checkoutUrl,
    });
  } catch (error: any) {
    console.error('Error en API checkout:', error);
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
  }
}
