'use client';

import { useState } from 'react';

export default function CalculadoraComisiones() {
  const [declaracionVal, setDeclaracionVal] = useState<number>(400000);
  const [hasRef, setHasRef] = useState<boolean>(true);
  const [hasVend, setHasVend] = useState<boolean>(true);

  const TOPE = 500000;
  const val = Number(declaracionVal) || 0;
  const refPct = val > TOPE ? 5 : 10;

  const pctRefAmt = hasRef ? refPct : 0;
  const pctVendAmt = hasVend ? 10 : 0;
  const pctDes = 5;

  // Contador recibe 65 base + remanentes de referido/vendedor si no participan
  const pctContador = 65 + (hasRef ? 0 : refPct) + (hasVend ? 0 : 10);
  const pctPlataforma = Math.max(0, 100 - pctContador - pctRefAmt - pctVendAmt - pctDes);

  const amtContador = (val * pctContador) / 100;
  const amtReferido = (val * pctRefAmt) / 100;
  const amtVendedor = (val * pctVendAmt) / 100;
  const amtDesarrollo = (val * pctDes) / 100;
  const amtPlataforma = (val * pctPlataforma) / 100;

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: '24px',
        color: '#fff',
        maxWidth: 540,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🧮</span>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--display)', color: '#7DD3FC' }}>
            Calculadora de Rendimiento y Reparto
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Simula las ganancias netas por declaración según el modelo 65/10/5
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
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
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#38BDF8',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hasRef}
              onChange={(e) => setHasRef(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#38BDF8' }}
            />
            ¿Viene por Referido? ({refPct}%)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hasVend}
              onChange={(e) => setHasVend(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#38BDF8' }}
            />
            ¿Viene por Vendedor? (10%)
          </label>
        </div>
      </div>

      {/* Resultados de reparto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#7DD3FC' }}>Contador Asignado</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Base {pctContador}% de la tarifa</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#38BDF8' }}>
            {formatCOP(amtContador)}
          </span>
        </div>

        {hasRef && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(78, 214, 161, 0.1)',
              border: '1px solid rgba(78, 214, 161, 0.25)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#4ED6A1' }}>Referido</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Comisión {pctRefAmt}% por traer el cliente</div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#4ED6A1' }}>
              {formatCOP(amtReferido)}
            </span>
          </div>
        )}

        {hasVend && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#FBBF24' }}>Vendedor</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Comisión 10% por venta manual/atención</div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#FBBF24' }}>
              {formatCOP(amtVendedor)}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#C084FC' }}>Desarrollo &amp; Soporte</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Fijo 5% por mantenimiento</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#C084FC' }}>
            {formatCOP(amtDesarrollo)}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#CBD5E1' }}>Plataforma (Utilidad)</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Remanente neto plataforma</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#F1F5F9' }}>
            {formatCOP(amtPlataforma)}
          </span>
        </div>
      </div>
    </div>
  );
}
