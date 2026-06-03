// client/src/App.jsx
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import Home         from './Home';
import Login        from './Login';
import SetupPassword from './SetupPassword';

const TabVentas     = React.lazy(() => import('./TabVentas'));
const TabTarifas    = React.lazy(() => import('./TabTarifas'));
const TabRutas      = React.lazy(() => import('./TabRutas'));
const TabRequisitos = React.lazy(() => import('./TabRequisitos'));
const TabAutos      = React.lazy(() => import('./TabAutos'));
const TabAdmin      = React.lazy(() => import('./TabAdmin'));
const TabCalendario = React.lazy(() => import('./TabCalendario'));
const TabPromos     = React.lazy(() => import('./TabPromos'));
const TabMetricas   = React.lazy(() => import('./TabMetricas'));

import {
  Key, DollarSign, MapPin, ShieldCheck, Percent,
  BarChart3, Car, Sliders, Calendar as CalendarIcon,
  LogOut, Menu, X, User, Database, Loader2,
  BellRing, MessageCircle, FileText, ExternalLink
} from 'lucide-react';

import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Mes en curso (para la facturación mensual). Se recalcula al cargar, nunca queda viejo.
const MESES_NOM = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const _NOW = new Date();
const NOMBRE_MES_ACTUAL = MESES_NOM[_NOW.getMonth()];
const CLAVE_MES_ACTUAL  = `${_NOW.getFullYear()}-${String(_NOW.getMonth() + 1).padStart(2, '0')}`; // ej "2026-06"

// ─────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authToken,    setAuthToken]    = useState(localStorage.getItem('token'));
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    setAuthToken(localStorage.getItem('token'));
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) return (
    <div className="min-h-screen bg-[#121319] flex items-center justify-center text-white font-sans">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#88BDF2] border-t-transparent rounded-full animate-spin mx-auto"/>
        <p className="text-xs font-black uppercase tracking-widest text-[#6F7D93]">Abriendo Servidor...</p>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/"               element={<Home/>}/>
        <Route path="/setup-password" element={<SetupPassword/>}/>
        <Route path="/login"          element={
          authToken
            ? <Navigate to="/admin" replace/>
            : <Login onLoginSuccess={() => setAuthToken(localStorage.getItem('token'))}/>
        }/>
        <Route path="/admin" element={
          authToken
            ? <AdminLayout onLogout={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('adminUser');
                setAuthToken(null);
              }}/>
            : <Navigate to="/login" replace/>
        }/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </Router>
  );
}

// ─────────────────────────────────────────────────────────────────
// ADMIN LAYOUT
// ─────────────────────────────────────────────────────────────────
function AdminLayout({ onLogout }) {
  const [activeTab,   setActiveTab]   = useState('TabVentas');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const adminUser = localStorage.getItem('adminUser') || 'admin';

  // ── Estado global de reservas ─────────────────────────────────
  const [reservas,   setReservas]   = useState([]);
  const [leadAlert,  setLeadAlert]  = useState(false);
  const [recentLead, setRecentLead] = useState({ id:0, name:'', phone:'', modelo:'' });
  const maxId = useRef(0);
  const first = useRef(true);

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  // ── Polling ───────────────────────────────────────────────────
  const fetchReservas = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/ventas?t=${Date.now()}`, auth());
      const rows = Array.isArray(data) ? data : [];
      setReservas(rows);

      if (rows.length > 0) {
        const curMax = Math.max(...rows.map(r => r.id || 0));
        if (first.current) {
          maxId.current = curMax;
          first.current = false;
        } else if (curMax > maxId.current) {
          const nl = rows.find(r => r.id === curMax) || rows[0];
          setRecentLead({
            id:     nl.id,
            name:   nl.cliente_nombre   || 'Nuevo cliente',
            phone:  nl.cliente_whatsapp || '',
            modelo: nl.modelo           || 'Auto',
          });
          setLeadAlert(true);
          try { const a = new Audio('/alert-sound.mp3'); a.volume = 0.85; await a.play(); } catch {}
          maxId.current = curMax;
        }
      }
    } catch (err) {
      console.error('❌ fetchReservas:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
    const iv = setInterval(fetchReservas, 10000);
    return () => clearInterval(iv);
  }, [fetchReservas]);

  // ── KPIs calculados ───────────────────────────────────────────
  const pendientes  = reservas.filter(r => String(r.estado_reserva || 'pendiente').toLowerCase() === 'pendiente').length;
  const confirmadas = reservas.filter(r => ['confirmada','confirmado','contratado'].includes(String(r.estado_reserva || '').toLowerCase())).length;
  const ingresos    = reservas.reduce((s, r) => s + parseFloat(r.monto_total_ars || 0), 0);
  // Facturación SOLO del mes en curso y SOLO de reservas confirmadas (por fecha de retiro).
  const esConfirmada = (r) => ['confirmada','confirmado','contratado'].includes(String(r.estado_reserva || '').toLowerCase());
  const ingresosMes = reservas.reduce(
    (s, r) => (esConfirmada(r) && String(r.fecha_inicio || '').slice(0, 7) === CLAVE_MES_ACTUAL ? s + parseFloat(r.monto_total_ars || 0) : s),
    0
  );

  // ── Acciones ──────────────────────────────────────────────────
  const cambiarEstadoReserva = async (id, estado) => {
    try {
      await axios.patch(`${API}/api/ventas/${id}/estado`, { estado_reserva: estado }, auth());
      setReservas(p => p.map(r => r.id === id ? { ...r, estado_reserva: estado } : r));
      setTimeout(fetchReservas, 500);
    } catch { alert('Error al actualizar estado.'); }
  };

  const eliminarReserva = async (id) => {
    if (!window.confirm('¿Eliminar esta reserva? No se puede deshacer.')) return;
    try {
      await axios.delete(`${API}/api/ventas/${id}`, auth());
      setReservas(p => p.filter(r => r.id !== id));
    } catch { alert('Error al eliminar.'); }
  };

  // ── WhatsApp del lead ─────────────────────────────────────────
  const waLead = () => {
    if (!recentLead.phone) return;
    const tel = recentLead.phone.replace(/\D/g, '');
    const fmt = tel.startsWith('54') ? tel : `54${tel}`;
    const msg = encodeURIComponent(`Hola ${recentLead.name}! 👋 Te contactamos desde Good Trip Cars Mendoza. Tu solicitud fue recibida y la estamos procesando. 🚗`);
    window.open(`https://wa.me/${fmt}?text=${msg}`, '_blank');
  };

  // ── Imprimir ticket del lead ──────────────────────────────────
  const imprimirLead = () => {
    const r = reservas.find(x => x.id === recentLead.id);
    if (!r) return;
    const d1 = new Date(`${String(r.fecha_inicio||'').split('T')[0]}T00:00:00`);
    const d2 = new Date(`${String(r.fecha_fin||'').split('T')[0]}T00:00:00`);
    const dias = Math.max(1, Math.ceil((d2-d1)/86400000));
    const w = window.open('', '_blank', 'width=700,height=900');
    w.document.write(`<html><head><title>Good Trip #${r.id}</title>
    <style>
      body{font-family:monospace;padding:32px;max-width:600px;margin:auto}
      h1{text-align:center;margin-bottom:4px}
      .sub{text-align:center;color:#555;font-size:12px;margin-bottom:24px}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc;font-size:13px}
      .total{font-size:18px;font-weight:bold;display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:2px solid #000}
      .badge{background:#000;color:#fff;display:inline-block;padding:2px 8px;font-size:11px;margin-bottom:8px}
      .footer{margin-top:32px;font-size:10px;color:#888;text-align:center}
    </style></head><body>
    <h1>🚗 GOOD TRIP CARS</h1>
    <div class="sub">goodtripmendoza@gmail.com</div>
    <div class="badge">RESERVA #${r.id}</div>
    <div class="row"><span>Cliente</span><span>${r.cliente_nombre||'-'}</span></div>
    <div class="row"><span>WhatsApp</span><span>${r.cliente_whatsapp||'-'}</span></div>
    <div class="row"><span>Vehículo</span><span>${r.modelo||'Auto'}${r.patente?' · '+r.patente:''}</span></div>
    <div class="row"><span>Retiro</span><span>${String(r.fecha_inicio||'').substring(0,10)} · ${r.lugar_retiro||'-'}</span></div>
    <div class="row"><span>Devolución</span><span>${String(r.fecha_fin||'').substring(0,10)} · ${r.lugar_devolucion||'-'}</span></div>
    <div class="row"><span>Días</span><span>${dias}</span></div>
    <div class="row"><span>Sillita</span><span>${r.sillita?'Sí':'No'}</span></div>
    <div class="row"><span>Pago</span><span>${String(r.metodo_pago||'efectivo').replace(/_/g,' ')}</span></div>
    <div class="row"><span>Garantía</span><span>USD ${r.garantia_usd||400}</span></div>
    <div class="total"><span>TOTAL</span><span>$${parseFloat(r.monto_total_ars||0).toLocaleString('es-AR')} ARS</span></div>
    <div class="footer">Buenos vientos 🌬️ · Good Trip Mendoza</div>
    <script>window.print();</script>
    </body></html>`);
    w.document.close();
  };

  // ── Menu ──────────────────────────────────────────────────────
  const menuItems = [
    { id:'TabVentas',     label:'Control Ventas',     icon:Key,          badge: pendientes },
    { id:'TabTarifas',    label:'Matriz Tarifas',      icon:DollarSign },
    { id:'TabCalendario', label:'Calendario Flota',    icon:CalendarIcon },
    { id:'TabAutos',      label:'Flota Activa',        icon:Car },
    { id:'TabMetricas',   label:'Métricas',            icon:BarChart3 },
    { id:'TabRutas',      label:'Guía de Rutas',       icon:MapPin },
    { id:'TabRequisitos', label:'Requisitos Contrato', icon:ShieldCheck },
    { id:'TabPromos',     label:'Cupones & Promos',    icon:Percent },
    { id:'TabAdmin',      label:'Staff Admin',         icon:Sliders },
  ];

  const LoadingTab = () => (
    <div className="w-full h-64 flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-[#88BDF2]" size={32}/>
      <p className="text-xs font-black uppercase tracking-widest text-[#6F7D93]">Cargando Módulo...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121319] text-white font-sans antialiased flex relative">

      {/* ── BANNER NUEVO LEAD ── */}
      {leadAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 p-5 rounded-2xl shadow-2xl border border-emerald-400 flex flex-col gap-3 max-w-sm w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BellRing size={16} className="animate-pulse"/>
              <span className="font-black text-xs tracking-widest uppercase">¡Nuevo Lead!</span>
            </div>
            <button onClick={() => setLeadAlert(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/40">
              <X size={13}/>
            </button>
          </div>
          <div className="bg-slate-950/10 p-3 rounded-xl">
            <p className="text-sm font-black">👤 {recentLead.name}</p>
            <p className="text-xs font-semibold mt-0.5">🚗 {recentLead.modelo}</p>
            <p className="text-xs font-mono font-bold mt-0.5">📱 {recentLead.phone}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={waLead}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-slate-950 text-[10px] font-black py-2 rounded-xl transition-colors">
              <MessageCircle size={13}/> WhatsApp
            </button>
            <button onClick={imprimirLead}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-slate-950 text-[10px] font-black py-2 rounded-xl transition-colors">
              <FileText size={13}/> Ticket
            </button>
          </div>
        </div>
      )}

      {/* ── HAMBURGUESA MOBILE ── */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-50 p-2.5 bg-[#1E222F] border border-slate-800 rounded-xl text-white shadow-2xl cursor-pointer">
        {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
      </button>

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#1E222F] border-r border-slate-800/60 flex flex-col transition-transform duration-300 z-40 p-5 ${sidebarOpen?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="pt-2 lg:pt-0 border-b border-slate-800/50 pb-4 mb-3 flex items-center gap-2.5 shrink-0">
          <div className="p-2 bg-[#88BDF2]/10 rounded-xl text-[#88BDF2] border border-[#88BDF2]/10">
            <Database size={18}/>
          </div>
          <div className="text-left">
            <h1 className="text-lg font-black uppercase italic tracking-tighter text-white leading-none">Good Trip</h1>
            <span className="text-[#6F7D93] font-black text-[9px] uppercase tracking-widest block mt-1">Management OS</span>
          </div>
        </div>

        {/* KPIs mini */}
        <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
          {[
            { label:'Pendientes', val: pendientes,                          color:'text-amber-400' },
            { label:`Fact. ${NOMBRE_MES_ACTUAL}`, val:`$${Math.round(ingresosMes).toLocaleString('es-AR')}`, color:'text-[#88BDF2]' },
          ].map(k => (
            <div key={k.label} className="bg-[#121319] rounded-xl p-2.5 border border-slate-800/40 text-center">
              <p className={`text-base font-black ${k.color}`}>{k.val}</p>
              <p className="text-[8px] text-slate-500 font-bold uppercase">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Operador */}
        <div className="bg-[#121319] p-3 rounded-xl border border-slate-800/40 flex items-center gap-3 mb-3 shrink-0">
          <div className="w-9 h-9 bg-[#88BDF2]/10 border border-[#88BDF2]/20 text-[#88BDF2] rounded-lg flex items-center justify-center">
            <User size={16}/>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[9px] text-[#6F7D93] font-black uppercase tracking-wider">Operador</p>
            <p className="text-xs font-bold text-white truncate font-mono">{adminUser}</p>
          </div>
        </div>

        {/* Nav — flex-1 para ocupar el espacio disponible */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
          {menuItems.map(item => {
            const Icon = item.icon;
            const sel  = activeTab === item.id;
            return (
              <button key={item.id}
                onClick={() => { setActiveTab(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-left group relative ${sel?'bg-[#88BDF2] text-[#121319] shadow-lg':'text-slate-400 hover:text-white hover:bg-[#121319]/40'}`}>
                <Icon size={14} className={sel?'text-[#121319]':'text-[#6F7D93] group-hover:text-[#88BDF2] transition-colors'}/>
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute right-3 top-2.5 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Botones de acción al fondo */}
        <div className="flex flex-col gap-2 mt-3 shrink-0">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 text-[#88BDF2] hover:text-white bg-[#88BDF2]/10 hover:bg-[#88BDF2]/20 py-3 rounded-xl border border-[#88BDF2]/20 hover:border-[#88BDF2]/40 text-xs font-black uppercase tracking-widest transition-all cursor-pointer">
            <ExternalLink size={13}/> Ver Sitio Web
          </a>
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 py-3 rounded-xl border border-rose-500/10 hover:border-rose-500/20 text-xs font-black uppercase tracking-widest transition-all cursor-pointer">
            <LogOut size={13}/> Desconectar
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 min-w-0 min-h-screen flex flex-col bg-[#121319]">
        <header className="h-20 border-b border-slate-800/30 px-6 lg:px-10 flex items-center justify-between bg-[#1E222F]/10 backdrop-blur-md sticky top-0 z-30">
          <div className="pl-12 lg:pl-0 text-left">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#6F7D93]">Consola de Producción</h2>
            <p className="text-sm font-black text-white uppercase italic mt-0.5 tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> SQL SYNC: ACTIVE
          </div>
        </header>

        <main className="p-4 md:p-8 lg:p-10 flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto w-full">
            <Suspense fallback={<LoadingTab/>}>
              {activeTab==='TabVentas'     && <TabVentas reservas={reservas} cambiarEstadoReserva={cambiarEstadoReserva} eliminarReserva={eliminarReserva}/>}
              {activeTab==='TabMetricas'   && <TabMetricas reservas={reservas}/>}
              {activeTab==='TabTarifas'    && <TabTarifas/>}
              {activeTab==='TabCalendario' && <TabCalendario/>}
              {activeTab==='TabAutos'      && <TabAutos/>}
              {activeTab==='TabRutas'      && <TabRutas/>}
              {activeTab==='TabRequisitos' && <TabRequisitos/>}
              {activeTab==='TabPromos'     && <TabPromos/>}
              {activeTab==='TabAdmin'      && <TabAdmin/>}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
