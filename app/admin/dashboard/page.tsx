'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/app/stakeholders.css';

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface UserSession {
  id: string;
  nombre: string;
  email: string;
  rol: 'desarrollador' | 'contador' | 'admin';
}

interface UsuarioData {
  id: string;
  nombre: string;
  email: string;
  rol: 'desarrollador' | 'contador' | 'admin';
  activo: boolean;
  created_at: string;
}

interface LeadData {
  id: string;
  slug_publico: string;
  nombre: string;
  cedula: string;
  edad: number;
  ocupacion: string;
  celular: string;
  correo?: string;
  debe_declarar: boolean;
  topes_superados: string[];
  barra_patrimonio: number;
  barra_ingresos: number;
  barra_creditos: number;
  barra_movimientos: number;
  fecha_vencimiento: string;
  extemporaneo: boolean;
  estado: 'nuevo' | 'contactado' | 'agendado' | 'perdido';
  pagado?: boolean;
  etapa?: 'consultoria' | 'documentos' | 'anticipo' | 'declaracion' | 'entrega';
  created_at: string;
  contador_id?: string;
  arquetipos?: { nombre: string; slug: string };
  usuarios?: { id: string; nombre: string; email: string };
  respuestas?: Array<{ payload: Record<string, any>; version_motor: string; created_at: string }>;
  ventas?: Array<{ id: string; medio_contacto?: string; fecha_consulta?: string; estado?: string }>;
}

/* Format COP Currency */
const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

/* ── Clean SVG Trash Can Icon ────────────────────────────────────────── */
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/* ── Main Component ──────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Auth & Tabs */
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'crm' | 'leads' | 'usuarios'>('crm');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  /* Global Loading Indicator (Punto 12) */
  const [globalLoading, setGlobalLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>('Cargando sistema...');

  /* Data States */
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);

  /* Filters */
  const [filterArquetipo, setFilterArquetipo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');

  /* Modals */
  const [selectedRespuestasLead, setSelectedRespuestasLead] = useState<LeadData | null>(null);
  const [editingLead, setEditingLead] = useState<LeadData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Form Edit Lead state */
  const [editNombre, setEditNombre] = useState('');
  const [editCedula, setEditCedula] = useState('');
  const [editEdad, setEditEdad] = useState(28);
  const [editCelular, setEditCelular] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editEstado, setEditEstado] = useState<'nuevo' | 'contactado' | 'agendado' | 'perdido'>('nuevo');
  const [editPagado, setEditPagado] = useState(false);
  const [editEtapa, setEditEtapa] = useState<'consultoria' | 'documentos' | 'anticipo' | 'declaracion' | 'entrega'>('consultoria');

  /* Form Nuevo Usuario */
  const [newUserNombre, setNewUserNombre] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRol, setNewUserRol] = useState<'admin' | 'contador' | 'vendedor' | 'referido'>('contador');
  const [userMsg, setUserMsg] = useState<{ text: string; error?: boolean } | null>(null);

  /* Theme Tokens */
  const isDark = theme === 'dark';
  const t = {
    bg: isDark ? '#000000' : '#F8FAFC',
    text: isDark ? '#FFFFFF' : '#0F172A',
    subtext: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    sidebarBg: isDark ? 'rgba(10,10,14,0.75)' : '#FFFFFF',
    tableHeaderBg: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
    tableHeaderColor: isDark ? 'rgba(255,255,255,0.5)' : '#475569',
    tableRowBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    inputBg: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    inputBorder: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
    inputColor: isDark ? '#FFFFFF' : '#0F172A',
    modalBg: isDark ? '#101014' : '#FFFFFF',
  };

  /* Star Canvas background */
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
      if (!isDark) return; // Only draw stars in dark theme
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
  }, [isDark]);

  /* Check User session on load */
  useEffect(() => {
    const raw = localStorage.getItem('stakeholders_user');
    if (raw) {
      try {
        const parsed: UserSession = JSON.parse(raw);
        setCurrentUser(parsed);
        if (parsed.rol === 'contador') {
          setActiveTab('crm');
        }
      } catch {
        // Sesión corrupta → limpiar y redirigir al login
        localStorage.removeItem('stakeholders_user');
        router.replace('/admin/login');
      }
    } else {
      // Sin sesión → ir al login sin dejar el dashboard en el historial
      router.replace('/admin/login');
    }
  }, []);

  /* Body background theme */
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = t.bg;
    return () => { document.body.style.backgroundColor = prev; };
  }, [t.bg]);

  /* Fetch Data */
  const loadData = async (msg = 'Cargando datos...') => {
    setLoadingText(msg);
    setGlobalLoading(true);
    try {
      const [resLeads, resUsuarios] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/usuarios'),
      ]);
      const dataLeads = await resLeads.json();
      const dataUsuarios = await resUsuarios.json();

      if (dataLeads.leads) setLeads(dataLeads.leads);
      if (dataUsuarios.usuarios) {
        setUsuarios(dataUsuarios.usuarios);
        const raw = localStorage.getItem('stakeholders_user');
        const sessionEmail = raw ? JSON.parse(raw).email : 'admin@stakeholders.co';
        const dbUser = dataUsuarios.usuarios.find((u: UsuarioData) => u.email.toLowerCase() === sessionEmail.toLowerCase());
        if (dbUser) {
          const updated: UserSession = { id: dbUser.id, nombre: dbUser.nombre, email: dbUser.email, rol: dbUser.rol };
          setCurrentUser(updated);
          localStorage.setItem('stakeholders_user', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Error cargando panel admin:', err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    loadData('Iniciando panel de control...');
  }, []);

  /* Handlers */
  const handleUpdateEstadoLead = async (leadId: string, nuevoEstado: string) => {
    setLoadingText('Guardando estado...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, estado: nuevoEstado }),
      });
      await loadData('Actualizando lista...');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  const handleUpdatePagadoLead = async (leadId: string, nuevoPagado: boolean) => {
    setLoadingText('Actualizando estado de pago...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, pagado: nuevoPagado }),
      });
      await loadData('Estado de pago actualizado');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  const handleUpdateEtapaLead = async (leadId: string, nuevaEtapa: string) => {
    setLoadingText('Actualizando etapa de embudo...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, etapa: nuevaEtapa }),
      });
      await loadData('Etapa de embudo actualizada');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  const handleAssignContador = async (leadId: string, contadorId: string | null) => {
    setLoadingText('Asignando lead...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, contador_id: contadorId }),
      });
      await loadData('Lead asignado con éxito');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  /* Remove lead from CRM (unassign) */
  const handleRemoveFromCRM = async (leadId: string) => {
    if (!confirm('¿Deseas quitar este lead de tu CRM? (Seguirá existiendo en la base de datos principal)')) return;
    setLoadingText('Eliminando del CRM...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, contador_id: null }),
      });
      await loadData('Lead removido del CRM');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  /* Delete lead completely from system */
  const handleDeleteLeadCompletely = async (leadId: string) => {
    if (!confirm('⚠️ ¿ESTÁS SEGURO? Esta acción eliminará el lead por completo de LEADS y de CRM.')) return;
    setLoadingText('Eliminando lead por completo...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId }),
      });
      await loadData('Lead eliminado del sistema');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  /* Edit Lead Modal open handler */
  const handleOpenEditLead = (lead: LeadData) => {
    setEditingLead(lead);
    setEditNombre(lead.nombre || '');
    setEditCedula(lead.cedula || '');
    setEditEdad(lead.edad || 28);
    setEditCelular(lead.celular || '');
    setEditCorreo(lead.correo || '');
    setEditEstado(lead.estado || 'nuevo');
    setEditPagado(Boolean(lead.pagado));
    setEditEtapa(lead.etapa || 'consultoria');
  };

  /* Save Edit Lead handler */
  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setLoadingText('Guardando cambios del lead...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLead.id,
          nombre: editNombre,
          cedula: editCedula,
          edad: editEdad,
          celular: editCelular,
          correo: editCorreo,
          estado: editEstado,
          pagado: editPagado,
          etapa: editEtapa,
        }),
      });
      setEditingLead(null);
      await loadData('Lead actualizado con éxito');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserNombre || !newUserEmail || !newUserPassword) {
      setUserMsg({ text: 'Todos los campos son obligatorios', error: true });
      return;
    }
    setLoadingText('Creando usuario...');
    setGlobalLoading(true);
    setUserMsg(null);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newUserNombre,
          email: newUserEmail,
          password: newUserPassword,
          rol: newUserRol,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando usuario');

      setNewUserNombre('');
      setNewUserEmail('');
      setNewUserPassword('');
      setUserMsg({ text: 'Usuario creado exitosamente ✓' });
      await loadData('Actualizando usuarios...');
    } catch (err: unknown) {
      setUserMsg({ text: err instanceof Error ? err.message : 'Error inesperado', error: true });
      setGlobalLoading(false);
    }
  };

  const handleToggleUserActivo = async (user: UsuarioData) => {
    setLoadingText('Actualizando estado...');
    setGlobalLoading(true);
    try {
      await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, activo: !user.activo }),
      });
      await loadData('Estado de usuario actualizado');
    } catch (e) {
      console.error(e);
      setGlobalLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stakeholders_user');
    // Usar replace para eliminar el dashboard del historial (evita que el botón Atrás lo muestre)
    router.replace('/');
  };

  /* Filter Logic */
  const isDev = currentUser?.rol === 'desarrollador' || currentUser?.rol === 'admin';

  const crmLeads = leads.filter((l) => {
    // El CRM muestra únicamente los clientes que YA PAGARON
    if (!l.pagado) return false;
    if (!isDev) {
      return l.contador_id === currentUser?.id;
    }
    return true;
  });

  const filterLeads = (list: LeadData[]) => {
    return list.filter((l) => {
      if (filterArquetipo !== 'todos' && l.arquetipos?.slug !== filterArquetipo) return false;
      if (filterEstado !== 'todos' && l.estado !== filterEstado) return false;
      return true;
    });
  };

  const finalCrmLeads = filterLeads(crmLeads);
  const finalAllLeads = filterLeads(leads);

  /* Clean Medio de Contacto badges */
  const renderMedioContacto = (lead: LeadData) => {
    const medio = lead.ventas?.[0]?.medio_contacto || 'llamada';
    if (medio === 'videollamada') return <span style={{ color: isDark ? '#7DD3FC' : '#0284C7', fontSize: 11, fontFamily: 'var(--mono)' }}>Videollamada</span>;
    if (medio === 'whatsapp') return <span style={{ color: isDark ? '#4ED6A1' : '#16A34A', fontSize: 11, fontFamily: 'var(--mono)' }}>WhatsApp</span>;
    return <span style={{ color: isDark ? '#F0B93C' : '#D97706', fontSize: 11, fontFamily: 'var(--mono)' }}>Llamada</span>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text, position: 'relative', display: 'flex', fontFamily: 'var(--body)', transition: 'background-color .3s, color .3s' }}>
      {/* Stars Canvas */}
      <canvas ref={canvasRef} id="stars" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', display: isDark ? 'block' : 'none' }} />
      {isDark && <div className="veil" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />}

      {/* ── GLOBAL LOADING SPINNER OVERLAY ── */}
      {globalLoading && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: isDark ? 'rgba(10,10,14,0.90)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(61,107,255,0.4)', borderRadius: 999,
          padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 0 30px rgba(61,107,255,0.25)',
          animation: 'popIn .3s cubic-bezier(.34,1.42,.5,1) both',
        }}>
          <div style={{
            width: 16, height: 16, border: '2px solid rgba(61,107,255,0.3)',
            borderTopColor: '#3D6BFF', borderRadius: '50%',
            animation: 'spinLoading .75s linear infinite',
          }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', color: t.text }}>
            {loadingText}
          </span>
        </div>
      )}

      {/* ── SIDEBAR PANEL ── */}
      <aside style={{
        width: 220, background: t.sidebarBg, backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${t.border}`, zIndex: 50,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        transition: 'transform .3s var(--ease), background-color .3s',
      }} className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          {/* Header Brand */}
          <div style={{ padding: '24px 20px', borderBottom: `1px solid ${t.border}` }}>
            <Link href="/" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: t.text, letterSpacing: '-.03em' }}>
              STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 999,
                background: isDev ? 'rgba(61,107,255,0.15)' : 'rgba(78,214,161,0.15)',
                color: isDev ? (isDark ? '#7DD3FC' : '#0284C7') : (isDark ? '#4ED6A1' : '#16A34A'),
                border: `1px solid ${isDev ? 'rgba(61,107,255,0.4)' : 'rgba(78,214,161,0.4)'}`,
              }}>
                {currentUser?.rol || 'Admin'}
              </span>
              <span style={{ fontSize: 11, color: t.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.nombre}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* 1. CRM */}
            <button
              onClick={() => { setActiveTab('crm'); setMobileMenuOpen(false); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                background: activeTab === 'crm' ? 'rgba(61,107,255,0.18)' : 'transparent',
                border: activeTab === 'crm' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                color: activeTab === 'crm' ? t.text : t.subtext,
              }}
            >
              CRM (PAGADOS)
              <span style={{ fontSize: 10, opacity: 0.7, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 999 }}>
                {crmLeads.length}
              </span>
            </button>

            {/* 2. USUARIOS */}
            {isDev && (
              <button
                onClick={() => { setActiveTab('usuarios'); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                  fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                  background: activeTab === 'usuarios' ? 'rgba(61,107,255,0.18)' : 'transparent',
                  border: activeTab === 'usuarios' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                  color: activeTab === 'usuarios' ? t.text : t.subtext,
                }}
              >
                USUARIOS
                <span style={{ fontSize: 10, opacity: 0.7, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 999 }}>
                  {usuarios.length}
                </span>
              </button>
            )}

            {/* 3. LEADS (ÚLTIMO TAB) */}
            {isDev && (
              <button
                onClick={() => { setActiveTab('leads'); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                  fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                  background: activeTab === 'leads' ? 'rgba(61,107,255,0.18)' : 'transparent',
                  border: activeTab === 'leads' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                  color: activeTab === 'leads' ? t.text : t.subtext,
                }}
              >
                TODOS LOS LEADS
                <span style={{ fontSize: 10, opacity: 0.7, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 999 }}>
                  {leads.length}
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div style={{ padding: '16px 16px 24px', borderTop: `1px solid ${t.border}` }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
              color: '#FF8080', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em',
              textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center',
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ flex: 1, marginLeft: 220, minHeight: '100vh', position: 'relative', zIndex: 10, padding: '32px clamp(16px,4vw,40px)' }} className="admin-main">

        {/* Mobile Header Bar */}
        <header className="mobile-header" style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: t.sidebarBg, backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 40, margin: '-32px -16px 24px',
        }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: t.text, fontSize: 22, cursor: 'pointer' }}>
            ☰
          </button>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>
            STAKEHOLDERS <span style={{ color: '#3D6BFF' }}>/</span> {activeTab.toUpperCase()}
          </span>
          <span style={{ width: 22 }} />
        </header>

        {/* Top Bar with Theme Switcher */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 4 }}>
              Panel Administrativo
            </span>
            <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.2rem)', margin: 0, letterSpacing: '-.04em', color: t.text }}>
              {activeTab === 'crm' && 'CRM — Clientes Pagados'}
              {activeTab === 'leads' && 'Todos los Leads Registrados'}
              {activeTab === 'usuarios' && 'Usuarios y Permisos'}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Theme Switcher Button */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={{
                padding: '8px 14px', borderRadius: 999,
                background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                color: t.text, fontFamily: 'var(--mono)', fontSize: 11,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'all .2s',
              }}
            >
              {isDark ? 'Modo Claro ☀️' : 'Modo Oscuro 🌙'}
            </button>

            {/* Filters */}
            {(activeTab === 'crm' || activeTab === 'leads') && (
              <>
                <select
                  value={filterArquetipo}
                  onChange={(e) => setFilterArquetipo(e.target.value)}
                  style={{
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 10, color: t.inputColor, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--body)', outline: 'none',
                  }}
                >
                  <option value="todos" style={{ background: t.modalBg, color: t.text }}>Todos los Arquetipos</option>
                  <option value="emperador" style={{ background: t.modalBg, color: t.text }}>El Emperador</option>
                  <option value="mago" style={{ background: t.modalBg, color: t.text }}>El Mago</option>
                  <option value="gladiador" style={{ background: t.modalBg, color: t.text }}>El Gladiador</option>
                  <option value="malabarista" style={{ background: t.modalBg, color: t.text }}>El Malabarista</option>
                  <option value="mochilero" style={{ background: t.modalBg, color: t.text }}>El Mochilero</option>
                  <option value="sonador" style={{ background: t.modalBg, color: t.text }}>El Soñador</option>
                </select>

                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  style={{
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 10, color: t.inputColor, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--body)', outline: 'none',
                  }}
                >
                  <option value="todos" style={{ background: t.modalBg, color: t.text }}>Todos los Estados</option>
                  <option value="nuevo" style={{ background: t.modalBg, color: t.text }}>Nuevo</option>
                  <option value="contactado" style={{ background: t.modalBg, color: t.text }}>Contactado</option>
                  <option value="agendado" style={{ background: t.modalBg, color: t.text }}>Agendado</option>
                  <option value="perdido" style={{ background: t.modalBg, color: t.text }}>Perdido</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* ── TAB 1: CRM (SOLO CLIENTES PAGADOS + PIPELINE INTEGRADO) ── */}
        {activeTab === 'crm' && (
          <div style={{
            background: t.cardBg, backdropFilter: 'blur(20px)',
            border: `1px solid ${t.border}`, borderRadius: 20,
            overflow: 'hidden', boxShadow: isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: t.tableHeaderBg, borderBottom: `1px solid ${t.border}`, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.tableHeaderColor }}>
                    <th style={{ padding: '16px 18px' }}>Persona / Cédula</th>
                    <th style={{ padding: '16px 18px' }}>Arquetipo & Finanzas</th>
                    <th style={{ padding: '16px 18px' }}>Etapa Embudo (Pipeline)</th>
                    <th style={{ padding: '16px 18px' }}>Contador Asignado</th>
                    <th style={{ padding: '16px 18px' }}>Contacto</th>
                    <th style={{ padding: '16px 18px' }}>Vencimiento</th>
                    <th style={{ padding: '16px 18px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {finalCrmLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: t.subtext, fontSize: 14 }}>
                        No hay clientes pagados en el CRM en este momento.
                      </td>
                    </tr>
                  ) : (
                    finalCrmLeads.map((lead) => (
                      <tr key={lead.id} style={{ borderBottom: `1px solid ${t.tableRowBorder}`, transition: 'background .15s' }}>
                        {/* Persona */}
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{ fontWeight: 700, color: t.text, display: 'block' }}>{lead.nombre}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>
                            C.C. {lead.cedula}
                          </span>
                        </td>

                        {/* Arquetipo & Finanzas */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 999, background: 'rgba(61,107,255,0.12)',
                              border: '1px solid rgba(61,107,255,0.3)', color: isDark ? '#7DD3FC' : '#0284C7', fontSize: 11, fontWeight: 600, width: 'fit-content',
                            }}>
                              {lead.arquetipos?.nombre || 'General'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: lead.debe_declarar ? '#FF8080' : (isDark ? '#4ED6A1' : '#16A34A') }}>
                              {lead.debe_declarar ? 'DECLARA RENTA' : 'NO DECLARA'}
                            </span>
                          </div>
                        </td>

                        {/* Etapa Embudo (Pipeline) */}
                        <td style={{ padding: '16px 18px' }}>
                          <select
                            value={lead.etapa || 'consultoria'}
                            onChange={(e) => handleUpdateEtapaLead(lead.id, e.target.value)}
                            style={{
                              background: 'rgba(14,124,102,0.15)',
                              border: '1px solid rgba(14,124,102,0.4)',
                              borderRadius: 8, color: isDark ? '#4ED6A1' : '#0E7C66', padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, outline: 'none',
                            }}
                          >
                            <option value="consultoria" style={{ background: t.modalBg, color: t.text }}>01. Consultoría ($100k)</option>
                            <option value="documentos" style={{ background: t.modalBg, color: t.text }}>02. Documentos</option>
                            <option value="anticipo" style={{ background: t.modalBg, color: t.text }}>03. Anticipo (50%)</option>
                            <option value="declaracion" style={{ background: t.modalBg, color: t.text }}>04. Declaración</option>
                            <option value="entrega" style={{ background: t.modalBg, color: t.text }}>05. Entrega Final</option>
                          </select>
                        </td>

                        {/* Contador Asignado */}
                        <td style={{ padding: '16px 18px' }}>
                          <select
                            value={lead.contador_id || ''}
                            onChange={(e) => handleAssignContador(lead.id, e.target.value || null)}
                            style={{
                              background: lead.contador_id ? 'rgba(61,107,255,0.18)' : t.inputBg,
                              border: lead.contador_id ? '1px solid rgba(61,107,255,0.5)' : `1px solid ${t.inputBorder}`,
                              borderRadius: 8, color: t.inputColor, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--body)', outline: 'none',
                            }}
                          >
                            <option value="" style={{ background: t.modalBg, color: t.text }}>Sin asignar</option>
                            {usuarios.map((u) => (
                              <option key={u.id} value={u.id} style={{ background: t.modalBg, color: t.text }}>
                                {u.nombre} ({u.rol})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Contacto */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.text }}>
                              {lead.celular || 'Sin celular'}
                            </span>
                            {renderMedioContacto(lead)}
                          </div>
                        </td>

                        {/* Vencimiento */}
                        <td style={{ padding: '16px 18px', fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>
                          {lead.fecha_vencimiento || 'Sin fecha'}
                        </td>

                        {/* Acciones CRM */}
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                            <Link
                              href={`/r/${lead.slug_publico}`}
                              target="_blank"
                              style={{
                                padding: '5px 10px', borderRadius: 8, background: 'rgba(61,107,255,0.12)',
                                border: '1px solid rgba(61,107,255,0.3)', color: isDark ? '#7DD3FC' : '#0284C7',
                                fontFamily: 'var(--mono)', fontSize: 11, textDecoration: 'none',
                              }}
                            >
                              Resultado ↗
                            </Link>

                            <button
                              onClick={() => setSelectedRespuestasLead(lead)}
                              style={{
                                padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                border: `1px solid ${t.inputBorder}`, color: t.text,
                                fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                              }}
                            >
                              Finanzas
                            </button>

                            <button
                              onClick={() => handleOpenEditLead(lead)}
                              style={{
                                padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                border: `1px solid ${t.inputBorder}`, color: t.text,
                                fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                              }}
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => handleRemoveFromCRM(lead.id)}
                              title="Eliminar de mi CRM"
                              style={{
                                padding: '5px 10px', borderRadius: 8, background: 'rgba(255,80,80,0.14)',
                                border: '1px solid rgba(255,80,80,0.3)', color: '#FF8080',
                                fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: LEADS (ÚLTIMO TAB — TODOS LOS REGISTROS) ── */}
        {activeTab === 'leads' && isDev && (
          <div style={{
            background: t.cardBg, backdropFilter: 'blur(20px)',
            border: `1px solid ${t.border}`, borderRadius: 20,
            overflow: 'hidden', boxShadow: isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: t.tableHeaderBg, borderBottom: `1px solid ${t.border}`, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.tableHeaderColor }}>
                    <th style={{ padding: '16px 18px' }}>Persona</th>
                    <th style={{ padding: '16px 18px' }}>Contacto</th>
                    <th style={{ padding: '16px 18px' }}>Arquetipo</th>
                    <th style={{ padding: '16px 18px' }}>Estado de Pago</th>
                    <th style={{ padding: '16px 18px' }}>Etapa Embudo</th>
                    <th style={{ padding: '16px 18px' }}>Asignar Contador</th>
                    <th style={{ padding: '16px 18px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {finalAllLeads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: `1px solid ${t.tableRowBorder}`, transition: 'background .15s' }}>
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ fontWeight: 700, color: t.text, display: 'block' }}>{lead.nombre}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>
                          C.C. {lead.cedula} ({lead.edad} años)
                        </span>
                      </td>

                      <td style={{ padding: '16px 18px', fontFamily: 'var(--mono)', fontSize: 11 }}>
                        <span style={{ display: 'block', color: t.text }}>{lead.celular || 'Sin celular'}</span>
                        <span style={{ color: t.subtext }}>{lead.correo || 'Sin correo'}</span>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ color: isDark ? '#7DD3FC' : '#0284C7', fontWeight: 600 }}>{lead.arquetipos?.nombre || 'General'}</span>
                      </td>

                      {/* Estado de Pago (Editable) */}
                      <td style={{ padding: '16px 18px' }}>
                        <select
                          value={lead.pagado ? 'true' : 'false'}
                          onChange={(e) => handleUpdatePagadoLead(lead.id, e.target.value === 'true')}
                          style={{
                            background: lead.pagado ? 'rgba(78,214,161,0.18)' : 'rgba(255,80,80,0.12)',
                            border: lead.pagado ? '1px solid rgba(78,214,161,0.5)' : '1px solid rgba(255,80,80,0.3)',
                            borderRadius: 8, color: lead.pagado ? (isDark ? '#4ED6A1' : '#16A34A') : '#FF8080',
                            padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none',
                          }}
                        >
                          <option value="false" style={{ background: t.modalBg, color: t.text }}>❌ No Pagado</option>
                          <option value="true" style={{ background: t.modalBg, color: t.text }}>✅ PAGADO (Pasa a CRM)</option>
                        </select>
                      </td>

                      {/* Etapa Embudo */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext, textTransform: 'capitalize' }}>
                          {lead.etapa || 'consultoria'}
                        </span>
                      </td>

                      {/* Asignar a CRM */}
                      <td style={{ padding: '16px 18px' }}>
                        <select
                          value={lead.contador_id || ''}
                          onChange={(e) => handleAssignContador(lead.id, e.target.value || null)}
                          style={{
                            background: lead.contador_id ? 'rgba(61,107,255,0.18)' : t.inputBg,
                            border: lead.contador_id ? '1px solid rgba(61,107,255,0.5)' : `1px solid ${t.inputBorder}`,
                            borderRadius: 8, color: t.inputColor, padding: '6px 10px', fontSize: 11, fontFamily: 'var(--body)', outline: 'none',
                          }}
                        >
                          <option value="" style={{ background: t.modalBg, color: t.text }}>Sin asignar</option>
                          {usuarios.map((u) => (
                            <option key={u.id} value={u.id} style={{ background: t.modalBg, color: t.text }}>
                              {u.nombre} ({u.rol})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Acciones LEADS */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Link
                            href={`/r/${lead.slug_publico}`}
                            target="_blank"
                            style={{
                              padding: '5px 10px', borderRadius: 8, background: 'rgba(61,107,255,0.12)',
                              border: '1px solid rgba(61,107,255,0.3)', color: isDark ? '#7DD3FC' : '#0284C7',
                              fontFamily: 'var(--mono)', fontSize: 11, textDecoration: 'none',
                            }}
                          >
                            Ver Resultado ↗
                          </Link>

                          <button
                            onClick={() => handleOpenEditLead(lead)}
                            style={{
                              padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                              border: `1px solid ${t.inputBorder}`, color: t.text,
                              fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                            }}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => setSelectedRespuestasLead(lead)}
                            style={{
                              padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                              border: `1px solid ${t.inputBorder}`, color: t.text,
                              fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                            }}
                          >
                            Respuestas
                          </button>

                          <button
                            onClick={() => handleDeleteLeadCompletely(lead.id)}
                            title="Eliminar lead completamente del sistema"
                            style={{
                              padding: '5px 10px', borderRadius: 8, background: 'rgba(255,80,80,0.18)',
                              border: '1px solid rgba(255,80,80,0.35)', color: '#FF8080',
                              fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: USUARIOS ── */}
        {activeTab === 'usuarios' && isDev && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Form Crear Usuario */}
            <div style={{
              background: t.cardBg, backdropFilter: 'blur(20px)',
              border: `1px solid ${t.border}`, borderRadius: 20,
              padding: 24, boxShadow: isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
            }}>
              <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, marginTop: 0, marginBottom: 16, color: t.text }}>
                Crear Nuevo Usuario
              </h3>

              {userMsg && (
                <div style={{
                  marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                  background: userMsg.error ? 'rgba(255,80,80,0.15)' : 'rgba(78,214,161,0.15)',
                  border: `1px solid ${userMsg.error ? 'rgba(255,100,100,0.3)' : 'rgba(78,214,161,0.3)'}`,
                  color: userMsg.error ? '#FF8080' : (isDark ? '#4ED6A1' : '#16A34A'), fontSize: 12,
                }}>
                  {userMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.subtext, marginBottom: 6 }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text" required value={newUserNombre} onChange={(e) => setNewUserNombre(e.target.value)}
                    placeholder="Ej. Carlos Contador"
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.subtext, marginBottom: 6 }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="carlos@stakeholders.co"
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.subtext, marginBottom: 6 }}>
                    Contraseña
                  </label>
                  <input
                    type="password" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.subtext, marginBottom: 6 }}>
                    Rol / Nivel de Permisos
                  </label>
                  <select
                    value={newUserRol}
                    onChange={(e) => setNewUserRol(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="contador" style={{ background: t.modalBg, color: t.text }}>Contador (CRM + Pool de leads)</option>
                    <option value="vendedor" style={{ background: t.modalBg, color: t.text }}>Vendedor (Clientes propios + Referidos)</option>
                    <option value="referido" style={{ background: t.modalBg, color: t.text }}>Referido (Links + Ganancias)</option>
                    <option value="admin" style={{ background: t.modalBg, color: t.text }}>Admin (Acceso total)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: 8, padding: '12px', borderRadius: 999, fontWeight: 700, fontSize: 13,
                    background: 'linear-gradient(135deg,#3D6BFF,#6B8FFF)', color: '#FFF', border: 'none',
                    fontFamily: 'var(--display)', cursor: 'pointer', boxShadow: '0 4px 20px rgba(61,107,255,0.4)',
                  }}
                >
                  + Crear Usuario
                </button>
              </form>
            </div>

            {/* Lista Usuarios */}
            <div style={{
              background: t.cardBg, backdropFilter: 'blur(20px)',
              border: `1px solid ${t.border}`, borderRadius: 20,
              padding: 24, boxShadow: isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
            }}>
              <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, marginTop: 0, marginBottom: 16, color: t.text }}>
                Usuarios en Stakeholders ({usuarios.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {usuarios.map((u) => (
                  <div key={u.id} style={{
                    padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                    border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, color: t.text, display: 'block' }}>{u.nombre}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>{u.email}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: 999,
                        background: u.rol === 'desarrollador' ? 'rgba(61,107,255,0.15)' : 'rgba(78,214,161,0.15)',
                        color: u.rol === 'desarrollador' ? (isDark ? '#7DD3FC' : '#0284C7') : (isDark ? '#4ED6A1' : '#16A34A'),
                      }}>
                        {u.rol}
                      </span>

                      <button
                        onClick={() => handleToggleUserActivo(u)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', fontSize: 11,
                          color: u.activo ? (isDark ? '#4ED6A1' : '#16A34A') : '#FF8080', fontFamily: 'var(--mono)',
                        }}
                      >
                        {u.activo ? 'Activo ✓' : 'Inactivo ✕'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: EDITAR LEAD ── */}
      {editingLead && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)' }} onClick={() => setEditingLead(null)} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 500,
            background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: 24,
            padding: '28px 24px', boxShadow: '0 0 80px rgba(61,107,255,0.25)', color: t.text,
          }}>
            <button
              onClick={() => setEditingLead(null)}
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: t.text, fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>

            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 4 }}>
              Edición de Datos
            </span>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, margin: '0 0 20px', color: t.text }}>
              Editar Lead: {editingLead.nombre}
            </h2>

            <form onSubmit={handleSaveEditLead} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext, marginBottom: 6 }}>
                  Nombre Completo
                </label>
                <input
                  type="text" required value={editNombre} onChange={(e) => setEditNombre(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext, marginBottom: 6 }}>
                    Cédula / NIT
                  </label>
                  <input
                    type="text" required value={editCedula} onChange={(e) => setEditCedula(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext, marginBottom: 6 }}>
                    Edad
                  </label>
                  <input
                    type="number" required value={editEdad} onChange={(e) => setEditEdad(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext, marginBottom: 6 }}>
                    Celular
                  </label>
                  <input
                    type="text" value={editCelular} onChange={(e) => setEditCelular(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext, marginBottom: 6 }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext, marginBottom: 6 }}>
                    Estado de Pago
                  </label>
                  <select
                    value={editPagado ? 'true' : 'false'}
                    onChange={(e) => setEditPagado(e.target.value === 'true')}
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="false" style={{ background: t.modalBg, color: t.text }}>❌ No Pagado</option>
                    <option value="true" style={{ background: t.modalBg, color: t.text }}>✅ Pagado (CRM)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext, marginBottom: 6 }}>
                    Etapa del Embudo
                  </label>
                  <select
                    value={editEtapa}
                    onChange={(e) => setEditEtapa(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.inputColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="consultoria" style={{ background: t.modalBg, color: t.text }}>01. Consultoría</option>
                    <option value="documentos" style={{ background: t.modalBg, color: t.text }}>02. Documentos</option>
                    <option value="anticipo" style={{ background: t.modalBg, color: t.text }}>03. Anticipo (50%)</option>
                    <option value="declaracion" style={{ background: t.modalBg, color: t.text }}>04. Declaración</option>
                    <option value="entrega" style={{ background: t.modalBg, color: t.text }}>05. Entrega Final</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="button" onClick={() => setEditingLead(null)}
                  style={{ flex: 1, padding: 12, borderRadius: 999, background: 'none', border: `1px solid ${t.inputBorder}`, color: t.text, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 12, borderRadius: 999, background: 'linear-gradient(135deg,#3D6BFF,#6B8FFF)', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--display)' }}
                >
                  Guardar Cambios ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL POPUP: VER RESPUESTAS ── */}
      {selectedRespuestasLead && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)' }} onClick={() => setSelectedRespuestasLead(null)} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto',
            background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: 24,
            padding: '28px 24px', boxShadow: '0 0 80px rgba(61,107,255,0.25)', color: t.text,
          }}>
            <button
              onClick={() => setSelectedRespuestasLead(null)}
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: t.text, fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>

            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 4 }}>
              Cuestionario Respondido
            </span>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, margin: '0 0 16px', color: t.text }}>
              Respuestas de {selectedRespuestasLead.nombre}
            </h2>

            {selectedRespuestasLead.respuestas?.[0]?.payload ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {Object.entries(selectedRespuestasLead.respuestas[0].payload).map(([key, val]) => (
                  <div key={key} style={{ padding: '10px 14px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext, textTransform: 'uppercase' }}>
                      {key}
                    </span>
                    <span style={{ fontWeight: 600, color: t.text, textAlign: 'right' }}>
                      {typeof val === 'number' && (key.toLowerCase().includes('ingreso') || key.toLowerCase().includes('deuda') || key.toLowerCase().includes('valor') || key.toLowerCase().includes('costo'))
                        ? formatCOP(val)
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: t.subtext }}>
                No hay payload de respuestas registrado para este lead.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styles for mobile responsive & animations */}
      <style>{`
        @keyframes spinLoading { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes popIn { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }

        @media (max-width: 900px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 0 !important;
            padding-top: 16px !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
