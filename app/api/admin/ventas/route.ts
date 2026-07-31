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

    const TOPE = 500000;

    let totalVentasBrutas = 0;
    let totalComisionesContadores = 0;
    let totalComisionesVendedores = 0;
    let totalComisionesReferidos = 0;
    let totalDesarrollo = 0;
    let totalUtilidadPlataforma = 0;

    const desgloseVentas = (leads || []).map((lead) => {
      const valorDeclaracion = Number(lead.valor_declaracion) || 400000;
      const valorConsultoria = 100000;
      const totalVentaCliente = valorDeclaracion + valorConsultoria;

      const hasRef = Boolean(lead.referrer_id);
      const hasVend = Boolean(lead.seller_id);

      const refPct = valorDeclaracion > TOPE ? 5 : 10;
      const pctRefAmt = hasRef ? refPct : 0;
      const pctVendAmt = hasVend ? 10 : 0;
      const pctDes = 5;

      // El contador absorbe lo que no ocupe referido ni vendedor
      const pctContador = 65 + (hasRef ? 0 : refPct) + (hasVend ? 0 : 10);

      const amtContador = (valorDeclaracion * pctContador) / 100;
      const amtReferido = (valorDeclaracion * pctRefAmt) / 100;
      const amtVendedor = (valorDeclaracion * pctVendAmt) / 100;
      const amtDesarrollo = (valorDeclaracion * pctDes) / 100;

      // Remanente plataforma + consultoría completa
      const platPct = 100 - pctContador - pctRefAmt - pctVendAmt - pctDes;
      const amtPlataforma = (valorDeclaracion * Math.max(platPct, 0)) / 100 + valorConsultoria;

      totalVentasBrutas += totalVentaCliente;
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
        valorConsultoria,
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
      totalComisionesReferidos +
      totalDesarrollo;

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
