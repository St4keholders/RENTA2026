'use client';

import { useEffect, useRef, useState } from 'react';
import '@/app/stakeholders.css';
import { calcCommissions, formatCOP } from '@/lib/commissions';

/* ── Componente de Barra de Distribución y Tarjetas de Márgenes ───── */
function MargenesCalculator({ initialAmount = 400000 }: { initialAmount?: number }) {
  const [amount, setAmount] = useState(initialAmount);
  const [hasRef, setHasRef] = useState(true);
  const [hasVend, setHasVend] = useState(true);

  // Porcentajes acordados
  const [pctContadorBase, setPctContadorBase] = useState(70);
  const [pctVendedor, setPctVendedor] = useState(15);
  const [pctReferido, setPctReferido] = useState(5);
  const [pctDesarrollo, setPctDesarrollo] = useState(10);
  const [showAdjust, setShowAdjust] = useState(false);

  // El sobrante de referido/vendedor si no participan va al contador
  const effectiveRefPct = hasRef ? pctReferido : 0;
  const effectiveVendPct = hasVend ? pctVendedor : 0;
  const effectiveConPct = pctContadorBase + (hasRef ? 0 : pctReferido) + (hasVend ? 0 : pctVendedor);
  const effectivePlatPct = 100 - effectiveConPct - effectiveRefPct - effectiveVendPct - pctDesarrollo;

  // Cálculo de montos en COP
  const conAmt = Math.round((amount * effectiveConPct) / 100);
  const refAmt = Math.round((amount * effectiveRefPct) / 100);
  const vendAmt = Math.round((amount * effectiveVendPct) / 100);
  const desAmt = Math.round((amount * pctDesarrollo) / 100);
  const platAmt = Math.round((amount * effectivePlatPct) / 100);

  const desAndPlatAmt = desAmt + Math.max(0, platAmt);
  const desAndPlatPct = pctDesarrollo + Math.max(0, effectivePlatPct);

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: 'clamp(20px, 4vw, 32px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
            color: '#38BDF8',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}
        >
          Calculadora de Rendimiento y Reparto
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
          Comisiones calculadas al 100% sobre el valor del servicio de declaración de renta
        </p>
      </div>

      {/* Input de Valor del Servicio */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 8,
          }}
        >
          Valor del servicio de declaración (COP)
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 12,
            padding: '12px 16px',
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: 18, color: '#38BDF8', marginRight: 10, fontWeight: 700 }}>$</span>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            step={50000}
            style={{
              width: '100%',
              background: 'transparent',
              border: 0,
              outline: 0,
              fontFamily: 'var(--mono)',
              fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
              fontWeight: 700,
              color: '#38BDF8',
            }}
          />
        </div>
      </div>

      {/* Checkboxes de Escenarios */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: hasRef ? '#4ADE80' : 'rgba(255, 255, 255, 0.4)',
            background: hasRef ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${hasRef ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: 10,
            padding: '10px 14px',
            transition: 'all .2s',
          }}
        >
          <input
            type="checkbox"
            checked={hasRef}
            onChange={(e) => setHasRef(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#4ADE80', cursor: 'pointer' }}
          />
          ¿Viene por Referido? ({pctReferido}%)
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: hasVend ? '#FACC15' : 'rgba(255, 255, 255, 0.4)',
            background: hasVend ? 'rgba(250, 204, 21, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${hasVend ? 'rgba(250, 204, 21, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: 10,
            padding: '10px 14px',
            transition: 'all .2s',
          }}
        >
          <input
            type="checkbox"
            checked={hasVend}
            onChange={(e) => setHasVend(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#FACC15', cursor: 'pointer' }}
          />
          ¿Viene por Vendedor? ({pctVendedor}%)
        </label>
      </div>

      {/* Visual Progress Bar */}
      <div
        style={{
          display: 'flex',
          height: 28,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: 20,
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ width: `${effectiveConPct}%`, background: '#0284C7', transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
          {effectiveConPct}%
        </div>
        {hasRef && (
          <div style={{ width: `${effectiveRefPct}%`, background: '#16A34A', transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
            {effectiveRefPct}%
          </div>
        )}
        {hasVend && (
          <div style={{ width: `${effectiveVendPct}%`, background: '#CA8A04', transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
            {effectiveVendPct}%
          </div>
        )}
        <div style={{ width: `${desAndPlatPct}%`, background: '#9333EA', transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
          {desAndPlatPct}%
        </div>
      </div>

      {/* Tarjetas de Reparto Exactas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Contador */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.18) 0%, rgba(14, 116, 144, 0.12) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: '#7DD3FC' }}>
              Contador Asignado
            </div>
            <div style={{ fontSize: 12, color: 'rgba(125, 211, 252, 0.75)', marginTop: 2 }}>
              Base {effectiveConPct}% del valor del servicio
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: '#38BDF8', textAlign: 'right' }}>
            {formatCOP(conAmt)}
          </div>
        </div>

        {/* Referido */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.18) 0%, rgba(21, 128, 61, 0.12) 100%)',
            border: '1px solid rgba(74, 222, 128, 0.35)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            opacity: hasRef ? 1 : 0.45,
            transition: 'opacity 0.2s',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: '#86EFAC' }}>
              Referido
            </div>
            <div style={{ fontSize: 12, color: 'rgba(134, 239, 172, 0.75)', marginTop: 2 }}>
              {hasRef ? `Comisión ${pctReferido}% por traer el cliente` : 'No participó (sumado al contador)'}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: '#4ADE80', textAlign: 'right' }}>
            {formatCOP(refAmt)}
          </div>
        </div>

        {/* Vendedor */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.18) 0%, rgba(161, 98, 7, 0.12) 100%)',
            border: '1px solid rgba(250, 204, 21, 0.35)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            opacity: hasVend ? 1 : 0.45,
            transition: 'opacity 0.2s',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: '#FDE047' }}>
              Vendedor
            </div>
            <div style={{ fontSize: 12, color: 'rgba(253, 224, 71, 0.75)', marginTop: 2 }}>
              {hasVend ? `Comisión ${pctVendedor}% por venta / atención` : 'No participó (sumado al contador)'}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: '#FACC15', textAlign: 'right' }}>
            {formatCOP(vendAmt)}
          </div>
        </div>

        {/* Desarrollo & Plataforma */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.18) 0%, rgba(109, 40, 217, 0.12) 100%)',
            border: '1px solid rgba(192, 132, 252, 0.35)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: '#E9D5FF' }}>
              Desarrollo & Plataforma
            </div>
            <div style={{ fontSize: 12, color: 'rgba(233, 213, 255, 0.75)', marginTop: 2 }}>
              Fijo {desAndPlatPct}% por mantenimiento y plataforma
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: '#C084FC', textAlign: 'right' }}>
            {formatCOP(desAndPlatAmt)}
          </div>
        </div>
      </div>

      {/* Ajustador opcional de simulaciones */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setShowAdjust(!showAdjust)}
          style={{
            background: 'transparent',
            border: 0,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--display)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {showAdjust ? '▲ Ocultar simulador de porcentajes' : '▼ Ajustar porcentajes (simular otros escenarios)'}
        </button>

        {showAdjust && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Contador (base)', val: pctContadorBase, set: setPctContadorBase },
              { label: 'Vendedor', val: pctVendedor, set: setPctVendedor },
              { label: 'Referido', val: pctReferido, set: setPctReferido },
              { label: 'Desarrollo web', val: pctDesarrollo, set: setPctDesarrollo },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => set(Number(e.target.value) || 0)}
                    style={{ width: 60, border: 0, background: 'transparent', padding: '6px 8px', textAlign: 'right', color: '#fff', fontFamily: 'var(--mono)', fontSize: 13 }}
                  />
                  <span style={{ paddingRight: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)', fontSize: 12 }}>%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Página Principal de Colaboradores ────────────────────────────── */
export default function ColaboradoresPage() {
  const [activeRole, setActiveRole] = useState<'referido' | 'vendedor' | 'contador'>('referido');
  const [sliderVal, setSliderVal] = useState(400000);
  const [cVend, setCVend] = useState(true);
  const [cRef, setCRef] = useState(true);

  // Animaciones reveal
  const revealRefs = useRef<HTMLElement[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('col-in');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const reveal = (el: HTMLElement | null, i = 0) => {
    if (el && !revealRefs.current.includes(el)) {
      (el as any).style.transitionDelay = `${Math.min(i, 6) * 0.05}s`;
      revealRefs.current.push(el);
    }
  };

  const bg = '#07090E';
  const border = 'rgba(255,255,255,0.08)';
  const cardBg = 'rgba(255,255,255,0.03)';
  const sub = 'rgba(255,255,255,0.6)';

  const ROLE_COLORS: Record<string, string> = {
    referido: '#4ADE80',
    vendedor: '#FACC15',
    contador: '#38BDF8',
  };

  const TAB_COPY: Record<string, { title: string; pct: string; fn: string; note: string }> = {
    referido: {
      title: 'Referido',
      pct: '5%',
      fn: 'Traes clientes con tu link de referidos o de voz a voz, y nosotros nos encargamos del resto. Es la forma más simple de ganar: solo conectas a la persona con el equipo.',
      note: 'Comisión fija del 5% por traer al cliente. El programa de referidos está activo durante toda la temporada de renta.',
    },
    vendedor: {
      title: 'Vendedor',
      pct: '15%',
      fn: 'Atiendes al cliente y le haces seguimiento hasta cerrar la venta y reunir sus documentos. En la práctica, suele ser el mismo contador quien cumple este rol.',
      note: 'Comisión fija del 15% por venta / atención sobre el valor de la declaración.',
    },
    contador: {
      title: 'Contador',
      pct: '70%+',
      fn: 'Realizas la declaración de renta, que es el corazón del servicio. Por eso te llevas la mayor parte del valor.',
      note: 'Base del 70%. Si además cierras la venta (+15%) o traes al cliente (+5%), sumas esas comisiones. Si realizas todo el proceso tú solo, te llevas el 90%.',
    },
  };

  const calculateRoleCommission = () => {
    if (activeRole === 'referido') {
      return { amt: Math.round(sliderVal * 0.05), sub: '5% fijo por traer al cliente' };
    }
    if (activeRole === 'vendedor') {
      return { amt: Math.round(sliderVal * 0.15), sub: '15% fijo por venta / atención' };
    }
    // Contador
    let totalPct = 70;
    if (cVend) totalPct += 15;
    if (cRef) totalPct += 5;
    return { amt: Math.round((sliderVal * totalPct) / 100), sub: `${totalPct}% de esta declaración` };
  };

  const currentComm = calculateRoleCommission();

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff', fontFamily: 'var(--body)', overflowX: 'hidden' }}>
      <style>{`
        .col-reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
        .col-in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .col-reveal { opacity: 1; transform: none; transition: none; } }
        .role-tab { transition: all .22s; cursor: pointer; }
        .role-tab:hover { transform: translateY(-2px); }
        input[type=range] { width: 100%; cursor: pointer; height: 6px; border-radius: 99px; }
      `}</style>

      {/* ── HERO ─── */}
      <header style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(70px,10vw,110px) clamp(20px,5vw,40px) clamp(30px,5vw,50px)' }}>
        <div
          ref={(el) => reveal(el as any, 0)}
          className="col-reveal"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: '#38BDF8',
            marginBottom: 14,
            fontWeight: 700,
          }}
        >
          Temporada de renta 2026
        </div>
        <h1
          ref={(el) => reveal(el as any, 1)}
          className="col-reveal"
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 'clamp(2.2rem, 7vw, 3.8rem)',
            lineHeight: 1.08,
            letterSpacing: '-.04em',
            margin: '0 0 18px',
          }}
        >
          Colabora con nosotros<br />y gana con cada declaración.
        </h1>
        <p
          ref={(el) => reveal(el as any, 2)}
          className="col-reveal"
          style={{ fontSize: 'clamp(1rem, 2.3vw, 1.2rem)', color: sub, maxWidth: '60ch', lineHeight: 1.6 }}
        >
          Hay tres formas de sumarte (referido, vendedor o contador) y cada una tiene su propia comisión. Elige la tuya y calcula cuánto ganarías.
        </p>
      </header>

      {/* ── CÓMO FUNCIONA ─── */}
      <section style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(40px,6vw,60px) clamp(20px,5vw,40px)', borderTop: `1px solid ${border}` }}>
        <div ref={(el) => reveal(el as any, 0)} className="col-reveal" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#38BDF8', marginBottom: 8, fontWeight: 700 }}>
          Cómo funciona
        </div>
        <h2 ref={(el) => reveal(el as any, 1)} className="col-reveal" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.2rem)', letterSpacing: '-.03em', margin: '0 0 14px' }}>
          Así acompañamos cada declaración.
        </h2>
        <p ref={(el) => reveal(el as any, 2)} className="col-reveal" style={{ fontSize: 15, color: sub, maxWidth: '65ch', lineHeight: 1.6, marginBottom: 28 }}>
          Antes de hablar de comisiones, esto es lo que vive cada cliente en la plataforma: cinco pasos desde que agenda hasta que recibe su declaración lista. Tu comisión depende de en qué parte de este proceso participas.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { n: '01', t: 'Consultoría', p: '$100.000', d: 'Revisamos si la persona está obligada a declarar. Se cobra aparte de la declaración.' },
            { n: '02', t: 'Documentos', d: 'Reunimos con el cliente todo lo necesario para declarar.' },
            { n: '03', t: 'Anticipo', d: 'El cliente paga el 50% para arrancar el trabajo.' },
            { n: '04', t: 'Declaración', d: 'Un contador aliado realiza la declaración de renta.' },
            { n: '05', t: 'Entrega', d: 'Entregamos la declaración y el cliente paga el 50% final.' },
          ].map((step, i) => (
            <div
              key={step.n}
              ref={(el) => reveal(el as any, i)}
              className="col-reveal"
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#38BDF8', display: 'block', marginBottom: 6 }}>
                  {step.n}
                </span>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  {step.t}
                </div>
                {step.p && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#FACC15', marginBottom: 6 }}>
                    {step.p}
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: sub, lineHeight: 1.45 }}>
                  {step.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ELIGE TU ROL ─── */}
      <section style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(40px,6vw,60px) clamp(20px,5vw,40px)', borderTop: `1px solid ${border}` }}>
        <div ref={(el) => reveal(el as any, 0)} className="col-reveal" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#38BDF8', marginBottom: 8, fontWeight: 700 }}>
          Elige tu rol
        </div>
        <h2 ref={(el) => reveal(el as any, 1)} className="col-reveal" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.2rem)', letterSpacing: '-.03em', margin: '0 0 14px' }}>
          ¿Cómo quieres colaborar?
        </h2>
        <p ref={(el) => reveal(el as any, 2)} className="col-reveal" style={{ fontSize: 15, color: sub, maxWidth: '65ch', lineHeight: 1.6, marginBottom: 28 }}>
          Cada rol cobra sobre el valor de la declaración (la consultoría va aparte). Y no son excluyentes: puedes cumplir varios a la vez y sumar las comisiones. Un contador que además trae y atiende a su propio cliente se lleva casi todo.
        </p>

        {/* Pestañas de Roles */}
        <div ref={(el) => reveal(el as any, 3)} className="col-reveal" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {(['referido', 'vendedor', 'contador'] as const).map((role) => {
            const active = activeRole === role;
            const color = ROLE_COLORS[role];
            const info = TAB_COPY[role];
            return (
              <button
                key={role}
                className="role-tab"
                onClick={() => setActiveRole(role)}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  padding: '16px 12px',
                  border: `1px solid ${active ? color : border}`,
                  background: active ? `${color}18` : cardBg,
                  textAlign: 'center',
                  fontFamily: 'var(--body)',
                  color: active ? color : sub,
                }}
              >
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17 }}>{info.title}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, marginTop: 4, fontWeight: 700, opacity: 0.85 }}>{info.pct}</div>
              </button>
            );
          })}
        </div>

        {/* Panel Simulador */}
        <div
          ref={(el) => reveal(el as any, 4)}
          className="col-reveal"
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 20,
            padding: 'clamp(20px, 4vw, 28px)',
          }}
        >
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', margin: '0 0 22px', lineHeight: 1.6 }}>
            {TAB_COPY[activeRole].fn}
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: sub }}>
                Valor de la declaración
              </label>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.4rem', color: ROLE_COLORS[activeRole] }}>
                {formatCOP(sliderVal)}
              </div>
            </div>
            <input
              type="range"
              min={100000}
              max={2000000}
              step={50000}
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              style={{ accentColor: ROLE_COLORS[activeRole] }}
            />
          </div>

          {activeRole === 'contador' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 12, border: `1px solid ${border}` }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: cVend ? '#fff' : sub }}>
                <input
                  type="checkbox"
                  checked={cVend}
                  onChange={(e) => setCVend(e.target.checked)}
                  style={{ accentColor: ROLE_COLORS.vendedor, width: 16, height: 16 }}
                />
                También cerré la venta (+15%)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: cRef ? '#fff' : sub }}>
                <input
                  type="checkbox"
                  checked={cRef}
                  onChange={(e) => setCRef(e.target.checked)}
                  style={{ accentColor: ROLE_COLORS.referido, width: 16, height: 16 }}
                />
                También traje al cliente (+5% referido)
              </label>
            </div>
          )}

          {/* Resultado Gran Número */}
          <div
            style={{
              borderRadius: 16,
              padding: '20px 24px',
              background: `${ROLE_COLORS[activeRole]}15`,
              border: `1px solid ${ROLE_COLORS[activeRole]}40`,
              marginBottom: 16,
            }}
          >
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: ROLE_COLORS[activeRole], opacity: 0.8, marginBottom: 4 }}>
              Tu comisión
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 2.8rem)', color: ROLE_COLORS[activeRole], letterSpacing: '-.03em' }}>
              {formatCOP(currentComm.amt)}
            </div>
            <div style={{ fontSize: 13, color: sub, marginTop: 4 }}>
              {currentComm.sub}
            </div>
          </div>

          <p style={{ fontSize: 13, color: sub, margin: 0, lineHeight: 1.5 }}>
            {TAB_COPY[activeRole].note}
          </p>
        </div>
      </section>

      {/* ── CALCULADORA DE MÁRGENES / TRANSPARENCIA ─── */}
      <section style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(40px,6vw,60px) clamp(20px,5vw,40px)', borderTop: `1px solid ${border}` }}>
        <div ref={(el) => reveal(el as any, 0)} className="col-reveal" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#38BDF8', marginBottom: 8, fontWeight: 700 }}>
          Transparencia
        </div>
        <h2 ref={(el) => reveal(el as any, 1)} className="col-reveal" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.2rem)', letterSpacing: '-.03em', margin: '0 0 14px' }}>
          ¿A dónde va cada peso?
        </h2>
        <p ref={(el) => reveal(el as any, 2)} className="col-reveal" style={{ fontSize: 15, color: sub, maxWidth: '65ch', lineHeight: 1.6, marginBottom: 28 }}>
          Este es el reparto completo del valor de una declaración entre todos los que la hacen posible. Cuando alguno del referido o vendedor no participa, su porcentaje se suma al contador.
        </p>

        <div ref={(el) => reveal(el as any, 3)} className="col-reveal">
          <MargenesCalculator initialAmount={400000} />
        </div>

        <p style={{ fontSize: 13, color: sub, marginTop: 24, textAlign: 'center', lineHeight: 1.5 }}>
          La consultoría de $100.000 se cobra aparte y no entra en este reparto.
        </p>
      </section>

      {/* ── FOOTER ─── */}
      <footer
        style={{
          borderTop: `1px solid ${border}`,
          padding: 'clamp(35px, 5vw, 55px) 20px',
          textAlign: 'center',
          color: sub,
          fontSize: 12,
          fontFamily: 'var(--mono)',
          letterSpacing: '.12em',
        }}
      >
        STAKEHOLDERS · Temporada de renta 2026
      </footer>
    </div>
  );
}
