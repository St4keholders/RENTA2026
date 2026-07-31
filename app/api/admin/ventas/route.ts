import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id, nombre, cedula, celular, pagado, etapa, valor_declaracion, source, created_at,
        contador_id, referrer_id, seller_id,
        contador:usuarios!leads_contador_id_fkey (nombre, email),
        referido:usuarios!leads_referrer_id_fkey (nombre, email),
        vendedor:usuarios!leads_seller_id_fkey (nombre, email)
      `)
      .eq('pagado', true)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let totalVentasBrutas = 0;
    let totalComisionesContadores = 0;
    let totalComisionesVendedores = 0;
    let totalComisionesReferidos = 0;
    let totalDesarrollo = 0;
    let totalUtilidadPlataforma = 0;

    const desgloseVentas = (leads || []).map((lead) => {
      const valorDeclaracion = Number(lead.valor_declaracion) || 0;
      const totalVentaCliente = valorDeclaracion;

      const hasRef = Boolean(lead.referrer_id);
      const hasVend = Boolean(lead.seller_id);

      const refPct = 5;
      const vendPct = 15;
      const devPct = 10;

      const pctRefAmt = hasRef ? refPct : 0;
      const pctVendAmt = hasVend ? vendPct : 0;

      // El contador absorbe lo que no ocupe referido (5%) ni vendedor (15%)
      const pctContador = 70 + (hasRef ? 0 : refPct) + (hasVend ? 0 : vendPct);

      const amtContador = (valorDeclaracion * pctContador) / 100;
      const amtReferido = (valorDeclaracion * pctRefAmt) / 100;
      const amtVendedor = (valorDeclaracion * pctVendAmt) / 100;
      const amtDesarrollo = (valorDeclaracion * devPct) / 100;
      const amtPlataforma = amtDesarrollo;

      totalVentasBrutas += valorDeclaracion;
      totalComisionesContadores += amtContador;
      totalComisionesVendedores += amtVendedor;
      totalComisionesReferidos += amtReferido;
      totalDesarrollo += amtDesarrollo;
      totalUtilidadPlataforma += amtPlataforma;

      return {
        id: lead.id,
        nombre: lead.nombre,
        cedula: lead.cedula,
        source: lead.source || 'directo',
        valorDeclaracion,
        totalVentaCliente,
        contadorNombre: (lead.contador as any)?.nombre || 'Sin asignar',
        referidoNombre: (lead.referido as any)?.nombre || 'Ninguno',
        vendedorNombre: (lead.vendedor as any)?.nombre || 'Ninguno',
        amtContador,
        amtReferido,
        amtVendedor,
        amtDesarrollo,
        amtPlataforma,
      };
    });

    const totalCostosComisiones =
      totalComisionesContadores +
      totalComisionesVendedores +
      totalComisionesReferidos;

    return NextResponse.json({
      resumen: {
        totalVentasBrutas,
        totalCostosComisiones,
        totalUtilidadPlataforma,
        totalComisionesContadores,
        totalComisionesVendedores,
        totalComisionesReferidos,
        totalDesarrollo,
        totalVentasConfirmadas: (leads || []).length,
      },
      ventas: desgloseVentas,
    });
  } catch (err: any) {
    console.error('Error calculando reporte financiero:', err);
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 });
  }
}
