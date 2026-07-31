// lib/commissions.ts
// Mirrors the SQL generate_commissions() logic for UI-side previews

export interface AppSettings {
  tope: number;
  pct_contador: number;
  pct_vendedor: number;
  pct_desarrollo: number;
  pct_ref_bajo: number;
  pct_ref_sobre: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  tope: 500000,
  pct_contador: 70,
  pct_vendedor: 15,
  pct_desarrollo: 10,
  pct_ref_bajo: 5,
  pct_ref_sobre: 5,
};

export interface CommissionBreakdown {
  contador: number;
  referido: number;
  vendedor: number;
  desarrollo: number;
  plataforma: number;
  pct_contador: number;
  pct_referido: number;
  pct_vendedor: number;
  pct_desarrollo: number;
  pct_plataforma: number;
  sobre_tope: boolean;
}

export function calcCommissions(
  declarationAmount: number,
  settings: AppSettings = DEFAULT_SETTINGS,
  hasReferido = false,
  hasVendedor = false
): CommissionBreakdown {
  const ref_slot = declarationAmount > settings.tope ? settings.pct_ref_sobre : settings.pct_ref_bajo;
  const sobre_tope = declarationAmount > settings.tope;

  const ref_pct = hasReferido ? ref_slot : 0;
  const vend_pct = hasVendedor ? settings.pct_vendedor : 0;

  const con_pct =
    settings.pct_contador +
    (hasReferido ? 0 : ref_slot) +
    (hasVendedor ? 0 : settings.pct_vendedor);

  const plat_pct = 100 - con_pct - ref_pct - vend_pct - settings.pct_desarrollo;

  return {
    pct_contador: con_pct,
    pct_referido: ref_pct,
    pct_vendedor: vend_pct,
    pct_desarrollo: settings.pct_desarrollo,
    pct_plataforma: plat_pct,
    contador: Math.round((declarationAmount * con_pct) / 100),
    referido: Math.round((declarationAmount * ref_pct) / 100),
    vendedor: Math.round((declarationAmount * vend_pct) / 100),
    desarrollo: Math.round((declarationAmount * settings.pct_desarrollo) / 100),
    plataforma: Math.round((declarationAmount * plat_pct) / 100),
    sobre_tope,
  };
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}
