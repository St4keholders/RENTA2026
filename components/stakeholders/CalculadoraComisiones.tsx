'use client';

import { useState } from 'react';

interface CalculadoraComisionesProps {
  isDark?: boolean;
}

export default function CalculadoraComisiones({ isDark = true }: CalculadoraComisionesProps) {
  const [declaracionVal, setDeclaracionVal] = useState<number>(400000);
  const [hasRef, setHasRef] = useState<boolean>(true);
  const [hasVend, setHasVend] = useState<boolean>(true);

  const val = Number(declaracionVal) || 0;
  const refPct = 5;
  const vendPct = 15;
  const devPct = 10;

  const pctRefAmt = hasRef ? refPct : 0;
  const pctVendAmt = hasVend ? vendPct : 0;

  // Contador recibe 70% base + remanentes de referido (5%) / vendedor (15%) si no participan
  const pctContador = 70 + (hasRef ? 0 : refPct) + (hasVend ? 0 : vendPct);
  const pctPlataforma = devPct;

  const amtContador = (val * pctContador) / 100;
  const amtReferido = (val * pctRefAmt) / 100;
  const amtVendedor = (val * pctVendAmt) / 100;
  const amtDesarrollo = (val * pctPlataforma) / 100;

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);

  const subtextColor = isDark ? 'rgba(255,255,255,0.6)' : '#64748B';

  return (
    <div
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: 20,
        padding: '24px',
        color: isDark ? '#FFFFFF' : '#0F172A',
        maxWidth: 560,
        margin: '0 auto',
        boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--display)', color: isDark ? '#7DD3FC' : '#0284C7' }}>
            Calculadora de Rendimiento y Reparto
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: subtextColor }}>
            Simula las ganancias netas por declaración (Modelo 70 / 15 / 5 / 10)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginBottom: 6 }}>
            Valor estimado de la declaración (COP)
          </label>
          <input
            type="number"
            value={declaracionVal}
            onChange={(e) => setDeclaracionVal(Number(e.target.value))}
            step={50000}
            min={100000}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              background: isDark ? 'rgba(0,0,0,0.4)' : '#F1F5F9',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1'}`,
              color: isDark ? '#38BDF8' : '#0284C7',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: isDark ? '#FFFFFF' : '#0F172A' }}>
            <input
              type="checkbox"
              checked={hasRef}
              onChange={(e) => setHasRef(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#38BDF8' }}
            />
            ¿Viene por Referido? (5%)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: isDark ? '#FFFFFF' : '#0F172A' }}>
            <input
              type="checkbox"
              checked={hasVend}
              onChange={(e) => setHasVend(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#38BDF8' }}
            />
            ¿Viene por Vendedor? (Hasta 15%)
          </label>
        </div>
      </div>

      {/* Resultados de reparto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Contador */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: 12,
            background: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)',
            border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.25)'}`,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#7DD3FC' : '#0369A1' }}>Contador Asignado</div>
            <div style={{ fontSize: 11, color: subtextColor }}>Base {pctContador}% de la tarifa (70% base)</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#38BDF8' : '#0284C7' }}>
            {formatCOP(amtContador)}
          </span>
        </div>

        {/* Referido */}
        {hasRef && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: 12,
              background: isDark ? 'rgba(78, 214, 161, 0.1)' : 'rgba(78, 214, 161, 0.08)',
              border: `1px solid ${isDark ? 'rgba(78, 214, 161, 0.25)' : 'rgba(78, 214, 161, 0.25)'}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#4ED6A1' : '#15803D' }}>Referido</div>
              <div style={{ fontSize: 11, color: subtextColor }}>Comisión {refPct}% por traer el cliente</div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#4ED6A1' : '#16A34A' }}>
              {formatCOP(amtReferido)}
            </span>
          </div>
        )}

        {/* Vendedor */}
        {hasVend && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: 12,
              background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.08)',
              border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.25)'}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#FBBF24' : '#B45309' }}>Vendedor</div>
              <div style={{ fontSize: 11, color: subtextColor }}>Comisión {vendPct}% por venta / atención</div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#FBBF24' : '#D97706' }}>
              {formatCOP(amtVendedor)}
            </span>
          </div>
        )}

        {/* Desarrollo & Mantenimiento */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: 12,
            background: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.08)',
            border: `1px solid ${isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.25)'}`,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#C084FC' : '#7E22CE' }}>Desarrollo &amp; Mantenimiento</div>
            <div style={{ fontSize: 11, color: subtextColor }}>Fijo 10% por mantenimiento y plataforma</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#C084FC' : '#9333EA' }}>
            {formatCOP(amtDesarrollo)}
          </span>
        </div>
      </div>
    </div>
  );
}
