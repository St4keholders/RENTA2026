'use client';

import { useEffect, useRef, useState } from 'react';
import '@/app/stakeholders.css';
import { calcCommissions, formatCOP } from '@/lib/commissions';

/* ── Commission Bar ───────────────────────────────────────────────── */
function CommBar({ amount, hasRef, hasVend, settings }: {
  amount: number; hasRef: boolean; hasVend: boolean;
  settings: { tope: number; pct_contador: number; pct_vendedor: number; pct_desarrollo: number; pct_ref_bajo: number; pct_ref_sobre: number };
}) {
  const b = calcCommissions(amount, settings, hasRef, hasVend);
  const COLORS = { contador: '#4ED6A1', referido: '#F0A63C', vendedor: '#7DD3FC', desarrollo: '#A78BFA', plataforma: 'rgba(255,255,255,0.18)' };
  const rows = [
    { k: 'contador', label: 'Contador', pct: b.pct_contador, amt: b.contador },
    { k: 'referido', label: hasRef ? 'Referido' : 'Referido (sin participar)', pct: b.pct_referido, amt: b.referido },
    { k: 'vendedor', label: hasVend ? 'Vendedor' : 'Vendedor (sin participar)', pct: b.pct_vendedor, amt: b.vendedor },
    { k: 'desarrollo', label: 'Desarrollo', pct: b.pct_desarrollo, amt: b.desarrollo },
    { k: 'plataforma', label: 'Plataforma', pct: b.pct_plataforma, amt: b.plataforma },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
        {rows.filter(r => r.pct > 0).map(r => (
          <div key={r.k} style={{ width: `${Math.max(r.pct, 0)}%`, background: (COLORS as any)[r.k], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--mono)', color: r.k === 'plataforma' ? 'rgba(255,255,255,0.6)' : '#000', fontWeight: 700, transition: 'width .35s ease' }}>
            {r.pct >= 9 ? `${r.pct}%` : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(r => (
          <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: r.pct === 0 ? 0.35 : 1, transition: 'opacity .25s' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: (COLORS as any)[r.k], flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13 }}>{r.label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(255,255,255,0.45)', width: 40, textAlign: 'right' }}>{r.pct}%</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: (COLORS as any)[r.k], width: 110, textAlign: 'right' }}>{formatCOP(r.amt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────── */
export default function ColaboradoresPage() {
  const [activeRole, setActiveRole] = useState<'referido' | 'vendedor' | 'contador'>('referido');
  const [sliderVal, setSliderVal] = useState(400000);
  const [cVend, setCVend] = useState(true);
  const [cRef, setCRef] = useState(true);

  // Full calculator state
  const [cPrecio, setCPrecio] = useState(400000);
  const [cTope, setCTope] = useState(500000);
  const [hayRef, setHayRef] = useState(true);
  const [hayVend, setHayVend] = useState(true);
  const [adjCon, setAdjCon] = useState(65);
  const [adjVen, setAdjVen] = useState(10);
  const [adjDes, setAdjDes] = useState(5);
  const [adjRb, setAdjRb] = useState(10);
  const [adjRs, setAdjRs] = useState(5);

  // Reveal on scroll
  const revealRefs = useRef<HTMLElement[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('col-in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    revealRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);
  const reveal = (el: HTMLElement | null, i = 0) => {
    if (el && !revealRefs.current.includes(el)) {
      (el as any).style.transitionDelay = `${Math.min(i, 6) * 0.06}s`;
      revealRefs.current.push(el);
    }
  };

  const simSettings = { tope: 500000, pct_contador: 65, pct_vendedor: 10, pct_desarrollo: 5, pct_ref_bajo: 10, pct_ref_sobre: 5 };
  const calcSettings = { tope: cTope, pct_contador: adjCon, pct_vendedor: adjVen, pct_desarrollo: adjDes, pct_ref_bajo: adjRb, pct_ref_sobre: adjRs };

  const simCommission = () => {
    const b = calcCommissions(sliderVal, simSettings, activeRole === 'contador' ? cRef : true, activeRole === 'contador' ? cVend : false);
    if (activeRole === 'referido') return { amt: sliderVal > 500000 ? sliderVal * 0.05 : sliderVal * 0.1, sub: `${sliderVal > 500000 ? 5 : 10}% — ${sliderVal > 500000 ? 'sobre' : 'bajo'} el tope` };
    if (activeRole === 'vendedor') return { amt: sliderVal * 0.1, sub: '10% fijo del valor' };
    return { amt: b.contador, sub: `${b.pct_contador}% de esta declaración` };
  };

  const sim = simCommission();
  const bg = '#000';
  const border = 'rgba(255,255,255,0.08)';
  const cardBg = 'rgba(255,255,255,0.04)';
  const sub = 'rgba(255,255,255,0.45)';

  const ROLE_COLORS: Record<string, string> = { referido: '#F0A63C', vendedor: '#7DD3FC', contador: '#4ED6A1' };

  const TAB_COPY: Record<string, { fn: string; note: string }> = {
    referido: { fn: 'Traes clientes con tu link o de voz a voz, y nosotros nos encargamos del resto. Es la forma más simple de ganar: solo conectas a la persona con el equipo.', note: 'Ganas 10% si la declaración cuesta hasta $500.000 y 5% si la supera. El programa está vigente hasta el 1 de octubre.' },
    vendedor: { fn: 'Atiendes al cliente y le haces seguimiento hasta cerrar la venta y reunir sus documentos. En la práctica, suele ser el mismo contador quien cumple este rol.', note: 'Comisión fija del 10% sobre el valor de la declaración.' },
    contador: { fn: 'Realizas la declaración de renta, que es el corazón del servicio. Por eso te llevas la mayor parte del valor.', note: 'Base del 65%. Si además cierras la venta o traes al cliente, sumas esas comisiones. Si participas solo tú, puedes llegar hasta el 85%.' },
  };

  const totalAdjPct = adjCon + adjVen + adjDes + adjRb;
  const calcModel = calcCommissions(cPrecio, calcSettings, hayRef, hayVend);

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff', fontFamily: 'var(--body)', overflowX: 'hidden' }}>
      <style>{`
        .col-reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
        .col-in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .col-reveal { opacity: 1; transform: none; transition: none; } }
        .role-tab { transition: all .22s; cursor: pointer; }
        .role-tab:hover { transform: translateY(-2px); }
        .col-toggle { transition: background .2s, border-color .2s; cursor: pointer; display: flex; align-items: center; gap: 12px; border-radius: 12px; padding: 12px 16px; font-size: 14px; }
        input[type=range] { width: 100%; cursor: pointer; height: 5px; border-radius: 99px; }
        details summary { cursor: pointer; list-style: none; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ── HERO ─── */}
      <header style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(80px,12vw,120px) clamp(20px,5vw,40px) clamp(40px,6vw,60px)' }}>
        <div ref={(el) => reveal(el as any, 0)} className="col-reveal" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: '#3D6BFF', marginBottom: 14 }}>
          Temporada de renta 2026
        </div>
        <h1 ref={(el) => reveal(el as any, 1)} className="col-reveal" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(2.2rem,8vw,4rem)', lineHeight: 1.05, letterSpacing: '-.04em', margin: '0 0 18px' }}>
          Colabora con nosotros<br />y gana con cada declaración.
        </h1>
        <p ref={(el) => reveal(el as any, 2)} className="col-reveal" style={{ fontSize: 'clamp(1rem,2.5vw,1.2rem)', color: sub, maxWidth: '56ch', lineHeight: 1.6 }}>
          Hay tres formas de sumarte (referido, vendedor o contador) y cada una tiene su propia comisión. Elige la tuya y calcula cuánto ganarías.
        </p>
      </header>

      {/* ── CÓMO FUNCIONA ─── */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px,6vw,60px) clamp(20px,5vw,40px)', borderTop: `1px solid ${border}` }}>
        <div ref={(el) => reveal(el as any, 0)} className="col-reveal" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: sub, marginBottom: 8 }}>Cómo funciona</div>
        <h2 ref={(el) => reveal(el as any, 1)} className="col-reveal" style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 'clamp(1.5rem,4vw,2rem)', letterSpacing: '-.03em', margin: '0 0 14px' }}>Así acompañamos cada declaración.</h2>
        <p ref={(el) => reveal(el as any, 2)} className="col-reveal" style={{ fontSize: 14, color: sub, maxWidth: '60ch', lineHeight: 1.6, marginBottom: 24 }}>
          Cinco pasos desde que el cliente llega hasta que recibe su declaración. Tu comisión depende de en qué parte participas.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { n: '01', t: 'Consultoría', d: 'Revisamos si la persona está obligada a declarar. Se cobra aparte, no forma parte de la base de comisión.', dim: true },
            { n: '02', t: 'Documentos', d: 'Reunimos con el cliente todo lo necesario para declarar.' },
            { n: '03', t: 'Anticipo', d: 'El cliente paga el 50% para arrancar el trabajo. Aquí se generan las comisiones.' },
            { n: '04', t: 'Declaración', d: 'Un contador aliado realiza la declaración de renta.' },
            { n: '05', t: 'Entrega', d: 'Entregamos la declaración y el cliente paga el 50% final.' },
          ].map((step, i) => (
            <div key={step.n} ref={(el) => reveal(el as any, i)} className="col-reveal" style={{ flex: '1 1 130px', background: step.dim ? 'rgba(255,255,255,0.02)' : cardBg, border: `1px solid ${step.dim ? 'rgba(255,255,255,0.04)' : border}`, borderRadius: 14, padding: '16px 14px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#3D6BFF', display: 'block', marginBottom: 6 }}>{step.n}</span>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 5, color: step.dim ? sub : '#fff' }}>{step.t}</span>
              <span style={{ fontSize: 12, color: sub, lineHeight: 1.45 }}>{step.d}</span>
              {step.dim && <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'rgba(255,200,60,0.6)', display: 'block', marginTop: 6 }}>No entra en comisiones</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── SIMULADOR DE ROL ─── */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px,6vw,60px) clamp(20px,5vw,40px)', borderTop: `1px solid ${border}` }}>
        <div ref={(el) => reveal(el as any, 0)} className="col-reveal" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: sub, marginBottom: 8 }}>Elige tu rol</div>
        <h2 ref={(el) => reveal(el as any, 1)} className="col-reveal" style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 'clamp(1.5rem,4vw,2rem)', letterSpacing: '-.03em', margin: '0 0 24px' }}>¿Cómo quieres colaborar?</h2>

        <div ref={(el) => reveal(el as any, 2)} className="col-reveal" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {([['referido', 'Referido', '5-10%'], ['vendedor', 'Vendedor', '10%'], ['contador', 'Contador', '65%+']] as const).map(([role, label, pct]) => (
            <button key={role} className="role-tab" onClick={() => setActiveRole(role)}
              style={{ flex: 1, borderRadius: 14, padding: '16px 10px', border: '1px solid', textAlign: 'center', fontFamily: 'var(--body)', fontWeight: 600,
                background: activeRole === role ? `${ROLE_COLORS[role]}22` : cardBg,
                borderColor: activeRole === role ? ROLE_COLORS[role] : border,
                color: activeRole === role ? ROLE_COLORS[role] : sub,
              }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, marginTop: 3, opacity: 0.7 }}>{pct}</div>
            </button>
          ))}
        </div>

        <div ref={(el) => reveal(el as any, 3)} className="col-reveal" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 18, padding: '22px 22px 20px' }}>
          <p style={{ fontSize: 14, color: sub, margin: '0 0 20px', lineHeight: 1.6 }}>{TAB_COPY[activeRole].fn}</p>

          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>Valor de la declaración</label>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.6rem', marginBottom: 10, letterSpacing: '-.02em' }}>{formatCOP(sliderVal)}</div>
          <input type="range" min={100000} max={2000000} step={50000} value={sliderVal} onChange={(e) => setSliderVal(Number(e.target.value))}
            style={{ accentColor: ROLE_COLORS[activeRole], marginBottom: 16 }} />

          {activeRole === 'contador' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'También cerré la venta (+10%)', val: cVend, set: setCVend },
                { label: 'También traje al cliente (+ comisión referido)', val: cRef, set: setCRef },
              ].map(({ label, val, set }) => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: val ? '#fff' : sub }}>
                  <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} style={{ accentColor: ROLE_COLORS.contador, width: 16, height: 16 }} />
                  {label}
                </label>
              ))}
            </div>
          )}

          <div style={{ borderRadius: 14, padding: '20px 22px', background: `${ROLE_COLORS[activeRole]}18`, border: `1px solid ${ROLE_COLORS[activeRole]}44`, marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: ROLE_COLORS[activeRole], opacity: 0.7, marginBottom: 6 }}>Tu comisión</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '2.2rem', color: ROLE_COLORS[activeRole], letterSpacing: '-.03em' }}>{formatCOP(sim.amt)}</div>
            <div style={{ fontSize: 13, color: sub, marginTop: 4 }}>{sim.sub}</div>
          </div>

          <p style={{ fontSize: 12, color: sub }}>{TAB_COPY[activeRole].note}</p>
        </div>
      </section>

      {/* ── CALCULADORA COMPLETA ─── */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px,6vw,60px) clamp(20px,5vw,40px)', borderTop: `1px solid ${border}` }}>
        <div ref={(el) => reveal(el as any, 0)} className="col-reveal" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: sub, marginBottom: 8 }}>Transparencia</div>
        <h2 ref={(el) => reveal(el as any, 1)} className="col-reveal" style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 'clamp(1.5rem,4vw,2rem)', letterSpacing: '-.03em', margin: '0 0 14px' }}>¿A dónde va cada peso?</h2>
        <p ref={(el) => reveal(el as any, 2)} className="col-reveal" style={{ fontSize: 14, color: sub, maxWidth: '60ch', lineHeight: 1.6, marginBottom: 24 }}>
          Este es el reparto completo del valor de una declaración. Cuando referido o vendedor no participan, su parte se suma al contador.
        </p>

        <div ref={(el) => reveal(el as any, 3)} className="col-reveal" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 18, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {[
              { label: 'Precio de la declaración', val: cPrecio, set: setCPrecio, prefix: '$' },
              { label: 'Tope del referido', val: cTope, set: setCTope, prefix: '$' },
            ].map(({ label, val, set, prefix }) => (
              <div key={label}>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>{label}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                  {prefix && <span style={{ padding: '10px 12px', fontFamily: 'var(--mono)', color: sub, fontSize: 13 }}>{prefix}</span>}
                  <input type="number" value={val} onChange={(e) => set(Number(e.target.value) || 0)}
                    style={{ flex: 1, border: 0, outline: 0, background: 'transparent', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 15, color: '#fff' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 10, padding: '10px 14px', marginBottom: 16, background: cPrecio > cTope ? 'rgba(255,160,60,0.1)' : 'rgba(78,214,161,0.1)', border: `1px solid ${cPrecio > cTope ? 'rgba(255,160,60,0.3)' : 'rgba(78,214,161,0.3)'}`, fontSize: 13 }}>
            <strong style={{ color: cPrecio > cTope ? '#F0A63C' : '#4ED6A1' }}>{cPrecio > cTope ? 'SOBRE' : 'BAJO'} el tope</strong>
            <span style={{ color: sub }}> → el referido gana {cPrecio > cTope ? adjRs : adjRb}% ({formatCOP(cPrecio * (cPrecio > cTope ? adjRs : adjRb) / 100)})</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Hay referido', val: hayRef, set: setHayRef, color: '#F0A63C' },
              { label: 'Hay vendedor', val: hayVend, set: setHayVend, color: '#7DD3FC' },
            ].map(({ label, val, set, color }) => (
              <div key={label} className="col-toggle" onClick={() => set(!val)}
                style={{ border: `1px solid ${val ? color : border}`, background: val ? `${color}12` : 'rgba(255,255,255,0.03)' }}>
                <div style={{ width: 36, height: 20, borderRadius: 999, background: val ? color : 'rgba(255,255,255,0.15)', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: val ? 17 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
                <span style={{ color: val ? color : sub }}>{label}</span>
              </div>
            ))}
          </div>

          <CommBar amount={cPrecio} hasRef={hayRef} hasVend={hayVend} settings={calcSettings} />

          <details style={{ marginTop: 20, borderTop: `1px dashed ${border}`, paddingTop: 16 }}>
            <summary style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 14 }}>
              Ajustar porcentajes (simular escenarios)
            </summary>
            {[
              { label: 'Contador (base)', val: adjCon, set: setAdjCon },
              { label: 'Vendedor', val: adjVen, set: setAdjVen },
              { label: 'Desarrollo', val: adjDes, set: setAdjDes },
              { label: 'Referido (bajo tope)', val: adjRb, set: setAdjRb },
              { label: 'Referido (sobre tope)', val: adjRs, set: setAdjRs },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, borderTop: `1px solid ${border}` }}>
                <span style={{ color: sub }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', width: 96 }}>
                  <input type="number" value={val} onChange={(e) => set(Number(e.target.value) || 0)}
                    style={{ width: '100%', border: 0, outline: 0, background: 'transparent', padding: '7px 10px', fontFamily: 'var(--mono)', fontSize: 14, color: '#fff', textAlign: 'right' }} />
                  <span style={{ padding: '7px 10px', fontFamily: 'var(--mono)', color: sub, fontSize: 12 }}>%</span>
                </div>
              </div>
            ))}
            {totalAdjPct > 95 && (
              <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#FF8080' }}>
                Los porcentajes base suman {totalAdjPct}%. Verifica que el total no supere 100%.
              </div>
            )}
            <p style={{ fontSize: 12, color: sub, marginTop: 10 }}>La plataforma recibe lo que queda tras repartir todo lo demás.</p>
          </details>

          <p style={{ fontSize: 12, color: sub, marginTop: 16, borderTop: `1px solid ${border}`, paddingTop: 12 }}>
            La consultoría de $100.000 se cobra aparte y no entra en este reparto.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: 'clamp(30px,5vw,50px) clamp(20px,5vw,40px)', textAlign: 'center', color: sub, fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '.1em' }}>
        STAKEHOLDERS · Temporada de Renta 2026
      </footer>
    </div>
  );
}
