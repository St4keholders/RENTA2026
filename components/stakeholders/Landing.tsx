'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ARCHETYPES, ASSET_BASE, Archetype } from './archetypes';
import '@/app/stakeholders.css';

const FECHAS = [
  '12 ago', '13 ago', '14 ago', '18 ago', '19 ago', '20 ago', '21 ago', '24 ago', '25 ago',
  '26 ago', '27 ago', '28 ago', '31 ago', '1 sep', '2 sep', '3 sep', '4 sep', '7 sep', '8 sep', '9 sep',
  '10 sep', '11 sep', '14 sep', '15 sep', '16 sep', '17 sep', '18 sep', '21 sep', '22 sep', '23 sep',
  '24 sep', '25 sep', '28 sep', '1 oct', '2 oct', '5 oct', '6 oct', '7 oct', '8 oct', '9 oct', '13 oct',
  '14 oct', '15 oct', '16 oct', '19 oct', '20 oct', '21 oct', '22 oct', '23 oct', '26 oct'
];

const MES_MAP: Record<string, [number, string]> = {
  ago: [7, 'agosto'],
  sep: [8, 'septiembre'],
  oct: [9, 'octubre'],
};

const MESES_NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Force dark body theme while this landing is mounted
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    const prevOverflow = document.body.style.overflowX;
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#FFFFFF';
    document.body.style.overflowX = 'clip';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
      document.body.style.overflowX = prevOverflow;
    };
  }, []);

  // Modal Arquetipos state
  const [activeArchetype, setActiveArchetype] = useState<Archetype | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlaying, setModalPlaying] = useState(false);
  const [modalReversed, setModalReversed] = useState(false);

  // Modal Agendar state
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [agNombre, setAgNombre] = useState('');
  const [agCorreo, setAgCorreo] = useState('');
  const [agTel, setAgTel] = useState('');
  const [agMedio, setAgMedio] = useState<'llamada' | 'videollamada' | 'whatsapp'>('llamada');
  const [agDateSelected, setAgDateSelected] = useState<Date | null>(null);
  const [agHoraSelected, setAgHoraSelected] = useState('');
  const [agErr, setAgErr] = useState('');
  const [agSubmitting, setAgSubmitting] = useState(false);
  const [agDoneTxt, setAgDoneTxt] = useState('');

  // Calendar View State
  const [calViewDate, setCalViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Date Finder State
  const [cedInput, setCedInput] = useState('');
  const [finderResult, setFinderResult] = useState<{ html: string; hasResult: boolean }>({
    html: '<p class="finder__hint">Escríbelos y te digo tu fecha.</p>',
    hasResult: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Open / Close functions for Archetype modal
  const handleOpenCard = (index: number) => {
    const a = ARCHETYPES[index];
    setActiveArchetype(a);
    setModalReversed(false);
    setModalPlaying(false);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';

    // Play video after state update
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = ASSET_BASE + a.vid;
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        const p = videoRef.current.play();
        if (p) {
          p.catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(handleRevealInfo);
            }
          });
        }
      }
    }, 50);
  };

  const handleRevealInfo = () => {
    setModalPlaying(false);
    setModalReversed(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleCloseCard = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setModalOpen(false);
    setModalPlaying(false);
    setModalReversed(false);
    document.body.style.overflow = '';
  };

  // Agendar modal helper functions
  const handleOpenAgendar = () => {
    setAgNombre('');
    setAgCorreo('');
    setAgTel('');
    setAgMedio('llamada');
    setAgDateSelected(null);
    setAgHoraSelected('');
    setAgErr('');
    setAgDoneTxt('');
    setAgSubmitting(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCalViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

    setAgendarOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseAgendar = () => {
    setAgendarOpen(false);
    document.body.style.overflow = '';
  };

  // Calculate available hours for selected date
  const getSlotsForDate = (date: Date) => {
    const d = date.getDay();
    if (d === 0) return []; // Sunday closed
    const end = d === 6 ? 14 : 18; // Saturday until 14:00, weekdays until 18:00
    const out: string[] = [];
    for (let h = 8; h < end; h++) {
      out.push(`${String(h).padStart(2, '0')}:00`);
      out.push(`${String(h).padStart(2, '0')}:30`);
    }
    return out;
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0;
  };

  const handleSelectDate = (date: Date) => {
    setAgDateSelected(date);
    const slots = getSlotsForDate(date);
    setAgHoraSelected(slots.length > 0 ? slots[0] : '');
  };

  // Submit appointment to Supabase via POST /api/agendar
  const handleSubmitAgendar = async () => {
    setAgErr('');

    if (!agNombre.trim()) {
      setAgErr('Escribe tu nombre completo.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(agCorreo)) {
      setAgErr('Ingresa un correo electrónico válido.');
      return;
    }
    if (agTel.replace(/\D/g, '').length < 7) {
      setAgErr('Ingresa tu número de celular o WhatsApp.');
      return;
    }
    if (!agDateSelected) {
      setAgErr('Selecciona una fecha disponible en el calendario.');
      return;
    }

    setAgSubmitting(true);

    try {
      const year = agDateSelected.getFullYear();
      const month = String(agDateSelected.getMonth() + 1).padStart(2, '0');
      const day = String(agDateSelected.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`;

      const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: agNombre,
          correo: agCorreo,
          celular: agTel,
          fecha,
          hora: agHoraSelected || '08:00',
          medio_contacto: agMedio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al agendar cita');
      }

      setAgDoneTxt(
        `¡Perfecto ${agNombre}! Hemos agendado tu sesión para el ${day}/${month}/${year} a las ${
          agHoraSelected || '08:00'
        } vía ${agMedio.toUpperCase()}. Un contador se comunicará contigo.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo agendar la cita. Inténtalo de nuevo.';
      setAgErr(msg);
    } finally {
      setAgSubmitting(false);
    }
  };

  // Date finder handler
  const handleCedInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setCedInput(clean);

    if (clean.length < 2) {
      setFinderResult({
        html: '<p class="finder__hint">Escríbelos y te digo tu fecha.</p>',
        hasResult: false,
      });
      return;
    }

    const last2 = parseInt(clean, 10);
    const idx = Math.floor(last2 / 2);
    const str = FECHAS[idx] || FECHAS[FECHAS.length - 1];
    const parts = str.split(' ');
    const num = parseInt(parts[0], 10);
    const code = parts[1];
    const meta = MES_MAP[code] || [7, 'agosto'];
    const año = 2026;
    const mesNom = meta[1];
    const fechaObj = new Date(año, meta[0], num);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const esHoy = fechaObj.getTime() === hoy.getTime();
    const esPasada = fechaObj.getTime() < hoy.getTime();

    let tag = '';
    if (esHoy) {
      tag = '<span class="finder__tag finder__tag--warning">¡Tu plazo vence HOY!</span>';
    } else if (esPasada) {
      tag = '<span class="finder__tag finder__tag--alert">Fecha límite superada · Renta extemporánea</span>';
    }

    setFinderResult({
      html: `
        ${tag}
        <p class="finder__val">Límite: <strong>${num} de ${mesNom} de ${año}</strong></p>
        <p class="finder__sub">Dígitos ${clean} · Calendario DIAN Personas Naturales</p>
      `,
      hasResult: true,
    });
  };

  // Clamp math helper
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // Initialize scripts and scroll effects
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Optimized Starfield Atmosphere
    const cv = root.querySelector('#stars') as HTMLCanvasElement | null;
    let starsCleanup: (() => void) | null = null;

    if (cv) {
      const ctx = cv.getContext('2d');
      if (ctx) {
        let stars: Array<{ x: number; y: number; r: number; a: number; s: number; t: number }> = [];
        let w = 0, h = 0, dpr = 1, starsRaf: number | null = null;

        const buildStars = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          w = window.innerWidth;
          h = window.innerHeight;
          cv.width = w * dpr;
          cv.height = h * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const maxStars = w < 768 ? 90 : 180;
          stars = Array.from({ length: maxStars }, () => ({
            x: Math.random() * w,
            y: Math.random() * h * 1.6 - h * 0.3,
            r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
            a: Math.random() * 0.45 + 0.08,
            s: Math.random() * 0.55 + 0.12,
            t: Math.random() * Math.PI * 2,
          }));
        };

        let yVal = 0;
        let lastFrameTime = 0;
        const drawStars = (now: number) => {
          // Limit to 30 FPS for buttery smooth scroll performance
          if (now - lastFrameTime < 32) return;
          lastFrameTime = now;

          ctx.clearRect(0, 0, w, h);
          const time = now / 2600;
          for (const st of stars) {
            let py = st.y - yVal * st.s * 0.16;
            py = (((py % (h * 1.6)) + h * 1.6) % (h * 1.6)) - h * 0.3;
            const tw = REDUCE ? 1 : 0.7 + 0.3 * Math.sin(time + st.t);
            ctx.globalAlpha = st.a * tw;
            ctx.fillStyle = st.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
            ctx.beginPath();
            ctx.arc(st.x, py, st.r, 0, 6.283);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        };

        const loopStars = (now: number) => {
          drawStars(now);
          starsRaf = requestAnimationFrame(loopStars);
        };

        buildStars();
        if (REDUCE) {
          drawStars(performance.now());
        } else {
          starsRaf = requestAnimationFrame(loopStars);
        }

        const handleResizeStars = () => buildStars();
        const handleScrollStars = () => {
          yVal = window.scrollY;
          if (REDUCE) drawStars(performance.now());
        };

        window.addEventListener('resize', handleResizeStars, { passive: true });
        window.addEventListener('scroll', handleScrollStars, { passive: true });

        starsCleanup = () => {
          if (starsRaf) cancelAnimationFrame(starsRaf);
          window.removeEventListener('resize', handleResizeStars);
          window.removeEventListener('scroll', handleScrollStars);
        };
      }
    }

    // 2. Text Split Choreography
    root.querySelectorAll('[data-split]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.getAttribute('data-split-done')) return;
      const tint = (htmlEl.dataset.tint || '')
        .split(',')
        .filter((s) => s !== '')
        .map(Number);
      const words = (htmlEl.textContent || '').trim().split(/\s+/);
      htmlEl.textContent = '';
      words.forEach((word, i) => {
        const outer = document.createElement('span');
        outer.className = 'w';
        const inner = document.createElement('span');
        inner.className = 'wi' + (tint.includes(i) ? ' tint' : '');
        inner.style.transitionDelay = Math.min(i * 0.045, 0.5) + 's';
        inner.textContent = word;
        outer.appendChild(inner);
        htmlEl.appendChild(outer);
        if (i < words.length - 1) htmlEl.appendChild(document.createTextNode(' '));
      });
      htmlEl.setAttribute('data-split-done', 'true');
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    root.querySelectorAll('[data-split],[data-reveal],.fade').forEach((el) => io.observe(el));

    // 3. Optimized Scroll Engine
    const ticks: Array<() => void> = [];
    const measures: Array<() => void> = [];
    let pending = false;

    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        ticks.forEach((f) => f());
      });
    };

    const remeasure = () => {
      measures.forEach((f) => f());
      onScroll();
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer: NodeJS.Timeout;
    const handleResizeScroll = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(remeasure, 120);
    };
    window.addEventListener('resize', handleResizeScroll, { passive: true });

    // Header Navbar stuck state
    const nav = root.querySelector('#nav');
    if (nav) {
      ticks.push(() => nav.classList.toggle('stuck', window.scrollY > 24));
    }

    // Ticker Marquee
    const t = root.querySelector('#ticker') as HTMLElement | null;
    if (t && !t.getAttribute('data-duplicated')) {
      t.innerHTML += t.innerHTML;
      t.setAttribute('data-duplicated', 'true');
      const half = () => t.scrollWidth / 2;
      ticks.push(() => {
        const x = -((window.scrollY * 0.28) % Math.max(half(), 1));
        t.style.transform = `translate3d(${x}px,0,0)`;
      });
    }

    // Horizontal Scroll Sections (#pasos and #topes)
    root.querySelectorAll('[data-h]').forEach((sec) => {
      const htmlSec = sec as HTMLElement;
      const track = htmlSec.querySelector('.htrack') as HTMLElement | null;
      const bar = htmlSec.querySelector('.hprogress i') as HTMLElement | null;
      if (!track) return;

      const rate = parseFloat(htmlSec.dataset.rate || '0.58');
      let top = 0,
        dist = 1,
        travel = 0;

      const measure = () => {
        const n = parseFloat(getComputedStyle(htmlSec).getPropertyValue('--n')) || 4;
        const vh = window.innerHeight;
        htmlSec.style.height = Math.round(n * vh * rate + vh * 0.42) + 'px';
        top = htmlSec.getBoundingClientRect().top + window.scrollY;
        dist = Math.max(htmlSec.offsetHeight - vh, 1);
        travel = Math.max(track.scrollWidth - window.innerWidth, 0);
      };

      const tick = () => {
        const p = clamp((window.scrollY - top) / dist, 0, 1);
        track.style.transform = `translate3d(${(-p * travel).toFixed(2)}px,0,0)`;
        if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
      };

      measures.push(measure);
      ticks.push(tick);
      measure();
      tick();
    });

    // Archetype slots spring entry (Optimized 0.15 threshold, zero lag)
    const slots = Array.from(root.querySelectorAll('.card-slot')) as HTMLElement[];

    if (REDUCE) {
      slots.forEach((s) => s.classList.add('on'));
    } else {
      const cio = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('on');
              (e.target as HTMLElement).style.setProperty('--glow', '0.45');
              cio.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      slots.forEach((s) => cio.observe(s));
    }

    remeasure();
    if (document.fonts) {
      document.fonts.ready.then(remeasure);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseCard();
        handleCloseAgendar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (starsCleanup) starsCleanup();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResizeScroll);
      window.removeEventListener('keydown', handleKeyDown);
      io.disconnect();
    };
  }, []);

  // Calendar Grid Renderer helper
  const renderCalendarDays = () => {
    const year = calViewDate.getFullYear();
    const month = calViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const leadEmptyDays = (firstDay.getDay() + 6) % 7; // Monday start
    const totalDays = new Date(year, month + 1, 0).getDate();

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < leadEmptyDays; i++) {
      elements.push(<div key={`empty-${i}`} className="cal__day empty" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const ok = isDateAvailable(date);
      const isSelected = agDateSelected && date.getTime() === agDateSelected.getTime();

      elements.push(
        <button
          key={`day-${d}`}
          type="button"
          disabled={!ok}
          className={`cal__day ${ok ? 'on' : 'off'} ${isSelected ? 'sel' : ''}`}
          onClick={() => ok && handleSelectDate(date)}
        >
          {d}
        </button>
      );
    }

    return elements;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canPrevMonth =
    calViewDate.getFullYear() > today.getFullYear() ||
    (calViewDate.getFullYear() === today.getFullYear() && calViewDate.getMonth() > today.getMonth());
  const limitDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const canNextMonth = calViewDate < limitDate;

  return (
    <div ref={rootRef}>
      {/* ATMOSFERA */}
      <canvas id="stars" aria-hidden="true" />
      <div className="veil" aria-hidden="true" />

      {/* HEADER / NAV */}
      <header className="nav" id="nav">
        <a href="#top" className="brand">
          STAKEHOLDERS<i />
        </a>
        <nav className="nav-links" aria-label="Navegación principal">
          <a href="#test-section">¿Declaro?</a>
          <a href="#arquetipos">Los 6 Perfiles</a>
          <a href="#topes">Topes DIAN</a>
          <a href="#pasos">¿Cómo funciona?</a>
        </nav>
        <div className="nav-actions">
          <Link
            href="/admin/login"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              transition: 'all .2s',
            }}
          >
            Login
          </Link>
          <button className="pill pill--blue" onClick={handleOpenAgendar} type="button">
            Agendar consulta
          </button>
        </div>
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section className="hero" data-reveal>
          <div className="hero-grid">
            <div>
              <h1 data-split data-tint="1,2">
                ¿Debes declarar renta este año?
              </h1>
              <p className="hero__sub fade">El primer paso es conocer hasta cuándo tienes tiempo de presentar la declaración</p>
            </div>

            <div className="hero__col">
              <div className={`finder fade ${finderResult.hasResult ? 'has-result' : ''}`} id="finder">
                <label className="finder__label" htmlFor="ced">
                  Conoce tu fecha límite de presentación de renta. Ingresa los dos últimos dígitos de tu cédula y te la decimos.
                </label>
                <div className="finder__row">
                  <input
                    className="finder__input"
                    id="ced"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={2}
                    placeholder="45"
                    aria-label="Dos últimos dígitos de tu cédula"
                    value={cedInput}
                    onChange={(e) => handleCedInput(e.target.value)}
                  />
                  <div
                    className="finder__out"
                    id="finder-out"
                    aria-live="polite"
                    dangerouslySetInnerHTML={{ __html: finderResult.html }}
                  />
                </div>

                <div className="hero__cta">
                  <Link href="/test" className="pill pill--blue">
                    Hacer el test →
                  </Link>
                  <button className="pill pill--ghost" onClick={handleOpenAgendar} type="button">
                    Agendar consulta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TICKER DE IMPACTO */}
        <div className="ticker-wrap" aria-hidden="true">
          <div className="ticker" id="ticker">
            <span>¿DEBES DECLARAR RENTA?</span>
            <span>·</span>
            <span>6 ARQUETIPOS DE COMPORTAMIENTO</span>
            <span>·</span>
            <span>EL DIAGNÓSTICO EN 3 MINUTOS</span>
            <span>·</span>
            <span>ESTRATEGIA ANTE LA DIAN</span>
            <span>·</span>
          </div>
        </div>

        {/* SECCION 6 PERFILES ARQUETIPOS */}
        <section className="section sec-arquetipos" id="arquetipos" data-reveal>
          <div className="sec-head">
            <p className="eyebrow">Diagnóstico de perfil</p>
            <h2 data-split data-tint="2">
              Los 6 rostros tributarios de Colombia. ¿Con cuál te identificas?
            </h2>
            <p className="lead fade">
              Cada perfil revela cómo tus decisiones financieras pasadas dialogan con el estatuto tributario actual.
            </p>
          </div>

          <div className="cards-grid" id="cards-grid">
            {ARCHETYPES.map((a, i) => (
              <div key={a.n} className="card-slot" data-slot={i}>
                <article
                  className="card"
                  data-card={i}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalles del arquetipo ${a.n}`}
                  onClick={() => handleOpenCard(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenCard(i);
                    }
                  }}
                >
                  <div className="card__inner">
                    {/* FRENTE */}
                    <div className="card__face card__face--front">
                      <div className="card__media">
                        <img
                          src={ASSET_BASE + a.img}
                          alt={a.n}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="card__content">
                        <span className="card__role">PERFIL 0{i + 1}</span>
                        <h3 className="card__title">{a.n}</h3>
                        <p className="card__frase">{a.f}</p>
                        <span className="card__tag">{a.v}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>

        {/* SECCION HORIZONTAL: TOPES DIAN */}
        <section
          className="section section--h"
          id="topes"
          data-reveal
          data-h
          data-rate="0.55"
          style={{ '--n': 3.4 } as React.CSSProperties}
        >
          <div className="hsticky">
            <div className="sec-head sec-head--h">
              <p className="eyebrow">Topes 2026 — UVT $49.799</p>
              <h2 data-split data-tint="1">
                Superar un solo tope obliga a declarar.
              </h2>
              <p className="lead fade">
                Si durante el año grabado cumples con una sola de estas variables, la ley te exige presentar declaración de renta.
              </p>
            </div>

            <div className="hprogress" aria-hidden="true">
              <i />
            </div>

            <div className="htrack">
              <div className="tope-card">
                <span className="tope-card__num">01</span>
                <h3>Patrimonio Bruto</h3>
                <p className="tope-card__val">$224.095.500 COP</p>
                <p className="tope-card__sub">4.500 UVT al cierre del año</p>
                <p className="tope-card__desc">
                  Suma total de tus bienes (propiedades, vehículos, cuentas, inversiones) sin restar deudas.
                </p>
              </div>

              <div className="tope-card">
                <span className="tope-card__num">02</span>
                <h3>Ingresos Totales</h3>
                <p className="tope-card__val">$69.718.600 COP</p>
                <p className="tope-card__sub">1.400 UVT anuales (~$5,8M/mes)</p>
                <p className="tope-card__desc">
                  Ingresos recibidos por salarios, honorarios, arriendos, ventas o rendimientos financieros.
                </p>
              </div>

              <div className="tope-card">
                <span className="tope-card__num">03</span>
                <h3>Consumos & Movimientos</h3>
                <p className="tope-card__val">$69.718.600 COP</p>
                <p className="tope-card__sub">1.400 UVT en tarjetas o consignaciones</p>
                <p className="tope-card__desc">
                  Pagos con tarjeta de crédito, compras acumuladas o total abonado en cuentas bancarias.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCION HORIZONTAL: COMO FUNCIONA */}
        <section
          className="section section--h"
          id="pasos"
          data-reveal
          data-h
          data-rate="0.58"
          style={{ '--n': 4 } as React.CSSProperties}
        >
          <div className="hsticky">
            <div className="sec-head sec-head--h">
              <p className="eyebrow">Paso a paso</p>
              <h2 data-split data-tint="1">
                Tu diagnóstico tributario en 3 pasos.
              </h2>
            </div>

            <div className="hprogress" aria-hidden="true">
              <i />
            </div>

            <div className="htrack">
              <div className="paso-card">
                <span className="paso-card__num">Paso 01</span>
                <h3>Responde el Cuestionario</h3>
                <p className="paso-card__desc">
                  Ingresa tus ingresos, patrimonio y hábitos financieros de forma 100% confidencial en solo 3 minutos.
                </p>
              </div>

              <div className="paso-card">
                <span className="paso-card__num">Paso 02</span>
                <h3>Descubre tu Arquetipo</h3>
                <p className="paso-card__desc">
                  Nuestro algoritmo determina tu perfil financiero exacto, veredicto ante la DIAN y fecha límite de presentación.
                </p>
              </div>

              <div className="paso-card">
                <span className="paso-card__num">Paso 03</span>
                <h3>Optimización con Contador</h3>
                <p className="paso-card__desc">
                  Programa tu consultoría personalizada para aplicar deducciones legales y presentar sin sanciones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="section sec-cta" data-reveal>
          <div className="cta-box">
            <p className="eyebrow">Diagnóstico Inmediato</p>
            <h2 data-split data-tint="2">
              Conoce tu situación tributaria en menos de 3 minutos.
            </h2>
            <p className="lead fade">
              Sin costo inicial. Obtén la claridad que necesitas antes del vencimiento de tu plazo.
            </p>
            <div className="cta-box__actions fade">
              <Link href="/test" className="pill pill--blue pill--lg">
                Comenzar cuestionario gratis →
              </Link>
              <button className="pill pill--ghost pill--lg" onClick={handleOpenAgendar} type="button">
                Agendar consultoría contable
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="foot">
        <div className="foot__inner">
          <div className="foot__brand">
            <span>STAKEHOLDERS.</span>
            <p>Estrategia tributaria y tecnológica para personas naturales en Colombia.</p>
          </div>
          <div className="foot__copy">
            <p>© 2026 Stakeholders. Todos los derechos reservados.</p>
            <p>Las fechas y topes corresponden a la normativa DIAN vigente para el año gravable 2025/2026.</p>
          </div>
        </div>
      </footer>

      {/* MODAL ARQUETIPO (CON INTRO VIDEO Y SKIP) */}
      <div
        className={`modal ${modalOpen ? 'open' : ''}`}
        id="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m-title"
      >
        <div className="modal__bg" onClick={handleCloseCard} />
        {activeArchetype && (
          <div className={`modal__card ${modalReversed ? 'is-reversed' : ''}`}>
            <button className="modal__close" onClick={handleCloseCard} aria-label="Cerrar modal">
              ✕
            </button>

            {/* STAGE 1: VIDEO INTRO OVERLAY */}
            <div className={`modal__video-layer ${modalReversed ? 'hidden' : ''}`}>
              <video ref={videoRef} playsInline onEnded={handleRevealInfo} />
              <div className="modal__video-ctrls">
                <button className="pill pill--ghost" onClick={handleRevealInfo} type="button">
                  Ver perfil e información ↗
                </button>
              </div>
            </div>

            {/* STAGE 2: INFO TEXT & BARS */}
            <div className="modal__info" id="m-info">
              <h3 id="m-title">{activeArchetype.n}</h3>
              <p className="modal__frase" id="m-frase">
                {activeArchetype.f}
              </p>
              <p
                className="modal__text"
                id="m-text"
                dangerouslySetInnerHTML={{ __html: activeArchetype.t }}
              />
              <div className="bars" id="m-bars">
                {Object.entries(activeArchetype.b).map(([k, v]) => (
                  <div key={k} className="bar">
                    <i>{k}</i>
                    <span>
                      <b style={{ '--v': v } as React.CSSProperties} />
                    </span>
                    <u>{Math.round(v * 100)}</u>
                  </div>
                ))}
              </div>
              <span className="verdict" id="m-verdict">
                {activeArchetype.v}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODAL AGENDAR CONSULTA — REESTRUCTURADO Y ORDENADO */}
      <div
        className={`sheet ${agendarOpen ? 'open' : ''}`}
        id="agendar-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ag-title"
      >
        <div className="sheet__bg" onClick={handleCloseAgendar} />
        <div className="sheet__card">
          <button className="sheet__close" onClick={handleCloseAgendar} aria-label="Cerrar">
            ✕
          </button>

          {!agDoneTxt ? (
            <div className="sheet__body" id="ag-form">
              <p className="sheet__eyebrow">Stakeholders</p>
              <h3 id="ag-title">Agendar consulta contable</h3>
              <p className="sheet__sub">Completa tus datos personales, elige el medio de contacto y la fecha de tu preferencia.</p>

              {/* 1. Nombre completo */}
              <label className="fld">
                <span>1. Nombre completo</span>
                <input
                  id="ag-nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="Ej. Juan Pérez"
                  value={agNombre}
                  onChange={(e) => setAgNombre(e.target.value)}
                />
              </label>

              {/* 2. Correo electrónico */}
              <label className="fld">
                <span>2. Correo electrónico</span>
                <input
                  id="ag-correo"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={agCorreo}
                  onChange={(e) => setAgCorreo(e.target.value)}
                />
              </label>

              {/* 3. Número de contacto */}
              <label className="fld">
                <span>3. Celular / WhatsApp</span>
                <input
                  id="ag-tel"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="300 000 0000"
                  value={agTel}
                  onChange={(e) => setAgTel(e.target.value)}
                />
              </label>

              {/* 4. Medio de Contacto Preferido */}
              <div className="fld">
                <span>4. Medio de contacto preferido</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
                  {[
                    { id: 'llamada', label: 'Llamada' },
                    { id: 'videollamada', label: 'Videollamada' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAgMedio(m.id as any)}
                      style={{
                        padding: '10px 8px', borderRadius: 10, fontSize: 12, fontFamily: 'var(--mono)',
                        background: agMedio === m.id ? 'rgba(61,107,255,0.25)' : 'rgba(255,255,255,0.05)',
                        border: agMedio === m.id ? '1px solid #3D6BFF' : '1px solid rgba(255,255,255,0.12)',
                        color: agMedio === m.id ? '#7DD3FC' : '#FFFFFF', fontWeight: agMedio === m.id ? 700 : 400,
                        cursor: 'pointer', transition: 'all .2s',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Fecha de la consulta (Calendario) */}
              <div className="fld">
                <span>5. Selecciona la fecha de la consulta</span>
                <div className="cal" id="ag-cal">
                  <div className="cal__nav">
                    <button
                      className="cal__arrow"
                      id="cal-prev"
                      aria-label="Mes anterior"
                      type="button"
                      disabled={!canPrevMonth}
                      onClick={() =>
                        setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1))
                      }
                    >
                      ‹
                    </button>
                    <p className="cal__month" id="cal-month">
                      {MESES_NOMBRES[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                    </p>
                    <button
                      className="cal__arrow"
                      id="cal-next"
                      aria-label="Mes siguiente"
                      type="button"
                      disabled={!canNextMonth}
                      onClick={() =>
                        setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1))
                      }
                    >
                      ›
                    </button>
                  </div>
                  <div className="cal__dow">
                    <span>L</span>
                    <span>M</span>
                    <span>M</span>
                    <span>J</span>
                    <span>V</span>
                    <span>S</span>
                    <span>D</span>
                  </div>
                  <div className="cal__grid" id="cal-grid">
                    {renderCalendarDays()}
                  </div>
                  <p className="cal__legend">Lun a vie 8:00–18:00 · Sáb 8:00–14:00 · Domingos cerrado</p>
                </div>
              </div>

              {/* 6. Hora */}
              {agDateSelected && getSlotsForDate(agDateSelected).length > 0 && (
                <label className="fld" id="ag-hora-wrap">
                  <span>6. Hora de la cita</span>
                  <select
                    id="ag-hora"
                    value={agHoraSelected}
                    onChange={(e) => setAgHoraSelected(e.target.value)}
                  >
                    {getSlotsForDate(agDateSelected).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {agErr && (
                <p className="fld__err" id="ag-err">
                  {agErr}
                </p>
              )}

              <button
                className="pill pill--blue sheet__submit"
                id="ag-submit"
                type="button"
                disabled={agSubmitting}
                onClick={handleSubmitAgendar}
              >
                {agSubmitting ? 'Solicitando...' : 'Solicitar consulta'}
              </button>
            </div>
          ) : (
            <div className="sheet__done" id="ag-done">
              <div className="sheet__check" aria-hidden="true">
                ✓
              </div>
              <h3>Solicitud enviada</h3>
              <p className="sheet__sub" id="ag-done-txt">
                {agDoneTxt}
              </p>
              <button className="pill pill--ghost" onClick={handleCloseAgendar} type="button">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
