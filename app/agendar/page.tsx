'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '@/app/stakeholders.css';
import { setRefCookie } from '@/lib/referral';

function AgendarContent() {
  const searchParams = useSearchParams();
  const leadSlug = searchParams.get('lead') || '';

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [celular, setCelular] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [medioContacto, setMedioContacto] = useState<'llamada' | 'videollamada' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Capturar cookie de referido si viene con ?ref=
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setRefCookie(ref);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !celular.trim() || !fecha) {
      setErrorMsg('Por favor completa todos los campos requeridos (nombre, celular y fecha)');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const fechaConsulta = `${fecha}T${hora}:00Z`;

      // 1. Registrar cita y atribuir referido en backend
      await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim() || `${celular.trim()}@stakeholders.app`,
          celular: celular.trim(),
          fecha: fechaConsulta,
          hora,
          medio_contacto: medioContacto,
        }),
      });

      // 2. Generar cobro Wompi ($100.000 COP)
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_slug: leadSlug || undefined,
          customer_name: nombre.trim(),
          customer_email: correo.trim() || undefined,
        }),
      });
      const checkoutData = await checkoutRes.json();

      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        throw new Error('No se pudo generar la pasarela de pago');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al agendar';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 540, width: '100%', borderRadius: 24,
      background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(24px, 5vw, 40px)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#FFFFFF', position: 'relative', zIndex: 10,
    }}>
      {/* Badge */}
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em',
        textTransform: 'uppercase', color: '#7DD3FC', display: 'inline-block',
        padding: '4px 10px', borderRadius: 999, background: 'rgba(125,211,252,0.1)',
        border: '1px solid rgba(125,211,252,0.25)', marginBottom: 14,
      }}>
        Agendamiento Directo
      </span>

      <h1 style={{
        fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
        margin: '0 0 8px', letterSpacing: '-.03em', lineHeight: 1.15, color: '#FFFFFF',
      }}>
        Reserva tu Consultoría Contable
      </h1>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', lineHeight: 1.5 }}>
        1 hora de asesoría personalizada con un contador experto por <strong style={{ color: '#4ED6A1' }}>$100.000 COP</strong>. El monto pagado se abona al valor final de tu declaración.
      </p>

      {errorMsg && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, background: 'rgba(255,80,80,0.12)',
          border: '1px solid rgba(255,80,80,0.3)', color: '#FF8080', fontSize: 12,
          fontFamily: 'var(--mono)', marginBottom: 20,
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Datos Personales */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. María Fernanda Gómez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#FFFFFF', fontSize: 14, fontFamily: 'var(--body)', outline: 'none',
              transition: 'border .2s',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Celular (WhatsApp) *
            </label>
            <input
              type="tel"
              required
              placeholder="300 123 4567"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF', fontSize: 14, fontFamily: 'var(--mono)', outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF', fontSize: 14, fontFamily: 'var(--body)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Fecha y Hora */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Fecha de la Cita *
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF', fontSize: 13, fontFamily: 'var(--mono)', outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Hora Preferida
            </label>
            <select
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: '#121218', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF', fontSize: 13, fontFamily: 'var(--mono)', outline: 'none',
              }}
            >
              <option value="08:00">08:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="14:00">02:00 PM</option>
              <option value="16:00">04:00 PM</option>
            </select>
          </div>
        </div>

        {/* Medio de Contacto */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            Canal de Atención Preferido
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'whatsapp', label: '💬 WhatsApp', sub: 'Mensajes / Audio' },
              { id: 'videollamada', label: '💻 Videollamada', sub: 'Meet / Zoom' },
              { id: 'llamada', label: '📞 Llamada', sub: 'Telefónica' },
            ].map((item) => {
              const active = medioContacto === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMedioContacto(item.id as any)}
                  style={{
                    padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: active ? 'rgba(61,107,255,0.2)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid #3D6BFF' : '1px solid rgba(255,255,255,0.08)',
                    color: active ? '#7DD3FC' : 'rgba(255,255,255,0.7)', transition: 'all .15s',
                  }}
                >
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: 9, opacity: 0.7, marginTop: 2, fontFamily: 'var(--mono)' }}>{item.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen de cobro */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
        }}>
          <div>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Valor Consultoría</span>
            <span style={{ fontSize: 10, color: '#4ED6A1', fontFamily: 'var(--mono)' }}>Abonable a tu declaración</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#4ED6A1' }}>
            $100.000 COP
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: loading ? 'rgba(61,107,255,0.4)' : 'linear-gradient(135deg, #3D6BFF, #6B8FFF)',
            color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 15,
            fontFamily: 'var(--display)', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 30px -4px rgba(61,107,255,0.5)', transition: 'transform .15s',
            marginTop: 6,
          }}
        >
          {loading ? 'Generando pasarela...' : 'Ir a Pagar ($100.000 COP) →'}
        </button>
      </form>
    </div>
  );
}

export default function AgendarPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Background stars effect
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let stars: Array<{ x: number; y: number; r: number; a: number }> = [];
    let w = 0, h = 0, raf: number | null = null;

    const build = () => {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w; cv.height = h;
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 0.8 + 0.2, a: Math.random() * 0.5 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        ctx.globalAlpha = st.a;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
    };

    build(); draw();
    window.addEventListener('resize', build, { passive: true });
    return () => window.removeEventListener('resize', build);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#000000', color: '#FFFFFF',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 16px', position: 'relative', overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <header style={{ position: 'relative', zIndex: 10, marginBottom: 24, textAlign: 'center' }}>
        <Link href="/" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: '#FFFFFF', textDecoration: 'none', letterSpacing: '-.03em' }}>
          STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
        </Link>
      </header>

      <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', fontSize: 13 }}>Cargando formulario...</div>}>
        <AgendarContent />
      </Suspense>
    </div>
  );
}
