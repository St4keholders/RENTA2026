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

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [medioContacto, setMedioContacto] = useState<'llamada' | 'videollamada' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

      // 1. Guardar la cita/venta
      await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadSlug,
          fechaConsulta,
          medioContacto,
        }),
      });

      // 2. Redirigir directamente al cobro de Wompi ($100.000 COP)
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_slug: leadSlug,
          customer_name: 'Cliente Renta',
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
        return;
      } else {
        throw new Error('No se pudo generar el enlace de pago');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

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
            <span className="text-slate-600">Proceso:</span>
            <span className="font-mono-code text-[var(--sky-deep)] font-semibold">Redirección a pasarela de pago</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sky-btn py-4 rounded-xl font-bold text-base shadow-lg"
        >
          {loading ? 'Redirigiendo a Pasarela de Pago...' : 'Ir a Pagar ($100.000 COP)'}
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
