'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Contador {
  id: number;
  nombre: string;
  credencial: string;
  especialidad: string;
}

function AgendarContent() {
  const searchParams = useSearchParams();
  const leadSlug = searchParams.get('lead') || '';

  const [contadores, setContadores] = useState<Contador[]>([]);
  const [selectedContador, setSelectedContador] = useState<number | null>(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [medioContacto, setMedioContacto] = useState<'llamada' | 'videollamada' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Fetch contadores
    fetch('/api/contadores')
      .then((res) => res.json())
      .then((data) => {
        if (data.contadores) {
          setContadores(data.contadores);
          if (data.contadores.length > 0) {
            setSelectedContador(data.contadores[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      setErrorMsg('Por favor selecciona una fecha');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const fechaConsulta = `${fecha}T${hora}:00Z`;

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadSlug,
          contadorId: selectedContador,
          fechaConsulta,
          medioContacto,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al agendar cita');
      }

      setCompleted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="sky-card p-8 rounded-3xl max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h2 className="text-3xl font-serif-display font-bold mb-2">¡Cita Agendada!</h2>
        <p className="text-sm text-slate-600 mb-6">
          Hemos registrado tu consultoría contable. Nos pondremos en contacto contigo al número de WhatsApp registrado para confirmar y coordinar la sesión.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Valor de la consultoría:</span>
            <span className="font-bold text-[var(--sky-deep)]">$100.000 COP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Abonable a tu declaración:</span>
            <span className="font-bold text-emerald-600">100% Abonable</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-500">Estado de la reserva:</span>
            <span className="font-mono-code text-[var(--sky-deep)]">Confirmación en proceso</span>
          </div>
        </div>

        <Link
          href="/"
          className="sky-btn inline-block px-6 py-3 rounded-xl font-bold text-sm"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="sky-card p-6 md:p-10 rounded-3xl max-w-xl w-full">
      <span className="text-xs font-mono-code text-[var(--sky-deep)] uppercase tracking-wider block mb-1">
        Agendamiento Profesional
      </span>
      <h1 className="text-3xl font-serif-display font-bold mb-2">
        Reserva tu Consultoría Contable
      </h1>
      <p className="text-xs text-slate-600 mb-6 leading-relaxed">
        1 hora de asesoría personalizada con un contador titulado por $100.000 COP. Si contratas tu declaración con nosotros, el monto completo se abona a tu factura.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleccionar Contador */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Selecciona tu Contador Preferido
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contadores.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelectedContador(c.id)}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  selectedContador === c.id
                    ? 'border-[var(--sky-deep)] bg-[var(--sky-pale)] text-[var(--sky-deep)]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block font-bold text-slate-800">{c.nombre}</span>
                <span className="block text-[10px] font-mono-code opacity-75">{c.credencial}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seleccionar Fecha y Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Fecha de la Cita
            </label>
            <input
              type="date"
              required
              value={fecha}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[var(--sky)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Hora
            </label>
            <select
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[var(--sky)] bg-white"
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Medio de Contacto Preferido
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'llamada', label: '📞 Llamada', desc: 'Telefónica' },
              { id: 'videollamada', label: '💻 Videollamada', desc: 'Google Meet / Zoom' },
              { id: 'whatsapp', label: '💬 WhatsApp', desc: 'Mensajes / Audio' },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMedioContacto(m.id as 'llamada' | 'videollamada' | 'whatsapp')}
                className={`p-3 rounded-xl border text-center text-xs transition-all ${
                  medioContacto === m.id
                    ? 'border-[var(--sky-deep)] bg-[var(--sky-pale)] text-[var(--sky-deep)] font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="block font-bold mb-0.5">{m.label}</span>
                <span className="block text-[10px] opacity-75">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resumen de cobro */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Valor de la consultoría:</span>
            <span className="font-bold text-slate-900">$100.000 COP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Estado de pago (Fase 1):</span>
            <span className="font-mono-code text-amber-600 font-semibold">Registro previo / Pago manual</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sky-btn py-4 rounded-xl font-bold text-base shadow-lg"
        >
          {loading ? 'Confirmando Cita...' : 'Confirmar Reserva de Cita ($100.000 Abono)'}
        </button>
      </form>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--fg)] flex flex-col items-center justify-center p-4">
      <header className="w-full max-w-xl mb-6">
        <Link href="/" className="font-serif-display text-xl font-bold text-[var(--fg)]">
          STAKEHOLDERS
        </Link>
      </header>
      <Suspense fallback={<div className="p-8 text-center text-sm">Cargando formulario...</div>}>
        <AgendarContent />
      </Suspense>
    </div>
  );
}
