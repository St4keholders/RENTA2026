'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/app/stakeholders.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  /* Stars canvas animation */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Array<{ x: number; y: number; r: number; a: number; t: number }> = [];
    let w = 0, h = 0, dpr = 1, raf: number | null = null;
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 12000);
      stars = Array.from({ length: Math.min(n, 260) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
        a: Math.random() * 0.45 + 0.08, t: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const time = performance.now() / 2600;
      for (const st of stars) {
        ctx.globalAlpha = st.a * (REDUCE ? 1 : 0.7 + 0.3 * Math.sin(time + st.t));
        ctx.fillStyle = st.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    build(); REDUCE ? draw() : loop();
    const onR = () => build();
    window.addEventListener('resize', onR, { passive: true });
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, []);

  /* Dark body background */
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#000000';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      // Save user session in localStorage
      localStorage.setItem('stakeholders_user', JSON.stringify(data.user));
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Stars canvas */}
      <canvas ref={canvasRef} id="stars" aria-hidden="true" />
      <div className="veil" aria-hidden="true" />

      {/* Main Login Card */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 440,
        background: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24,
        padding: 'clamp(24px,5vw,44px)',
        boxShadow: '0 0 60px -10px rgba(61,107,255,0.20)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 24, color: '#FFF', letterSpacing: '-.03em' }}>
            STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
          </Link>
          <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            Acceso al Panel Administrativo
          </span>
        </div>

        {errorMsg && (
          <div style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,100,100,0.3)',
            color: '#FF8080', fontSize: 13, fontFamily: 'var(--body)',
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@stakeholders.co"
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 12, color: '#FFF', fontSize: 15, fontFamily: 'var(--body)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 12, color: '#FFF', fontSize: 15, fontFamily: 'var(--body)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10, padding: '14px 24px', borderRadius: 999, fontWeight: 700, fontSize: 15,
              background: loading ? 'rgba(61,107,255,0.4)' : 'linear-gradient(135deg,#3D6BFF,#6B8FFF)',
              color: '#FFF', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--display)', boxShadow: '0 4px 24px -4px rgba(61,107,255,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'transform .15s',
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión →'
            )}
          </button>
        </form>

        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
