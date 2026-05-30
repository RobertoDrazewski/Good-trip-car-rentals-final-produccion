// client/src/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity, LogOut, Menu, X, BellRing,
  Users, DollarSign, Calendar, ShieldAlert,
  BarChart2, CalendarDays, Car, Tag, MessageCircle, FileText
} from 'lucide-react';

import TabVentas     from './TabVentas';
import TabCalendario from './TabCalendario';
import TabMetricas   from './TabMetricas';
import TabTarifas    from './TabTarifas';
import TabAutos      from './TabAutos';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState('ventas');
  const [sidebar,   setSidebar]   = useState(true);
  const [loading,   setLoading]   = useState(true);
  const [reservas,  setReservas]  = useState([]);
  const [metrics,   setMetrics]   = useState({ total:0, pendientes:0, confirmadas:0, ingresos:0 });
  const [leadAlert, setLeadAlert] = useState(false);
  const [recentLead,setRecentLead]= useState({ name:'', phone:'', modelo:'', id:0 });
  const maxId = useRef(0);
  const first = useRef(true);

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/ventas?t=${Date.now()}`, auth());
      const rows = Array.isArray(data) ? data : [];
      setReservas(rows);

      const pend = rows.filter(r => String(r.estado_reserva||'pendiente').toLowerCase() === 'pendiente').length;
      const conf = rows.filter(r => ['confirmada','confirmado','contratado'].includes(String(r.estado_reserva||'').toLowerCase())).length;
      const ing  = rows.reduce((s,r) => s + parseFloat(r.monto_total_ars||0), 0);
      setMetrics({ total:rows.length, pendientes:pend, confirmadas:conf, ingresos:ing });

      if (rows.length > 0) {
        const curMax = Math.max(...rows.map(r => r.id||0));
        if (first.current) {
          maxId.current = curMax;
          first.current = false;
        } else if (curMax > maxId.current) {
          const nl = rows.find(r => r.id === curMax) || rows[0];
          setRecentLead({
            id:     nl.id,
            name:   nl.cliente_nombre  || 'Nuevo cliente',
            phone:  nl.cliente_whatsapp|| '',
            modelo: nl.modelo          || 'Auto',
          });
          setLeadAlert(true);
          try { const a=new Audio('/alert-sound.mp3'); a.volume=0.85; await a.play(); } catch {}
          maxId.current = curMax;
        }
      }
    } catch (err) {
      console.error('❌ fetchData:', err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token'); navigate('/login');
      }
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000);   // polling cada 10s
    return () => clearInterval(iv);
  }, [fetchData]);

  // ── Acciones ─────────────────────────────────────────────────────
  const cambiarEstado = async (id, estado) => {
    try {
      // Intenta PATCH /api/ventas/:id/estado primero
      await axios.patch(`${API}/api/ventas/${id}/estado`, { estado_reserva: estado }, auth());
      setReservas(p => p.map(r => r.id===id ? {...r, estado_reserva:estado} : r));
      fetchData();
    } catch (err) {
      console.error('cambiarEstado error:', err.message);
      alert('Error al actualizar estado.');
    }
  };

  const eliminarReserva = async (id) => {
    if (!window.confirm('¿Eliminar esta reserva? No se puede deshacer.')) return;
    try {
      await axios.delete(`${API}/api/ventas/${id}`, auth());
      setReservas(p => p.filter(r => r.id !== id));
      fetchData();
    } catch { alert('Error al eliminar.'); }
  };

  // Abrir WhatsApp del lead
  const waLead = () => {
    if (!recentLead.phone) return;
    const tel = recentLead.phone.replace(/\D/g,'');
    const fmt = tel.startsWith('54') ? tel : `54${tel}`;
    const msg = encodeURIComponent(`Hola ${recentLead.name}! Te contactamos desde Good Trip Cars Rentals Mendoza. Tu reserva está siendo procesada. 🚗`);
    window.open(`https://wa.me/${fmt}?text=${msg}`, '_blank');
  };

  // Imprimir ticket del lead
  const imprimirLead = () => {
    const r = reservas.find(x => x.id === recentLead.id);
    if (!r) return;
    const w = window.open('','_blank','width=700,height=900');
    w.document.write(`<html><head><title>Good Trip #${r.id}</title>
    <style>body{font-family:monospace;padding:32px;max-width:600px;margin:auto}
    h1{text-align:center}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc;font-size:13px}
    .total{font-size:18px;font-weight:bold;display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:2px solid #000}
    .badge{background:#000;color:#fff;display:inline-block;padding:2px 8px;font-size:11px;margin-bottom:8px}
    .footer{margin-top:32px;font-size:10px;color:#888;text-align:center}</style></head><body>
    <h1>🚗 GOOD TRIP CARS</h1>
    <p style="text-align:center;color:#555;font-size:12px">goodtripmendoza@gmail.com</p>
    <div class="badge">RESERVA #${r.id}</div>
    <div class="row"><span>Cliente</span><span>${r.cliente_nombre||'-'}</span></div>
    <div class="row"><span>WhatsApp</span><span>${r.cliente_whatsapp||'-'}</span></div>
    <div class="row"><span>Vehículo</span><span>${r.modelo||'Auto'} ${r.patente?'· '+r.patente:''}</span></div>
    <div class="row"><span>Retiro</span><span>${String(r.fecha_inicio||'').substring(0,10)} · ${r.lugar_retiro||'-'}</span></div>
    <div class="row"><span>Devolución</span><span>${String(r.fecha_fin||'').substring(0,10)} · ${r.lugar_devolucion||'-'}</span></div>
    <div class="row"><span>Sillita</span><span>${r.sillita?'Sí':'No'}</span></div>
    <div class="row"><span>Pago</span><span>${String(r.metodo_pago||'efectivo').replace(/_/g,' ')}</span></div>
    <div class="row"><span>Garantía</span><span>USD ${r.garantia_usd||400}</span></div>
    <div class="total"><span>TOTAL</span><span>$${parseFloat(r.monto_total_ars||0).toLocaleString('es-AR')} ARS</span></div>
    <div class="footer">Buenos vientos 🌬️ · Good Trip Mendoza</div>
    <script>window.print();</script></body></html>`);
    w.document.close();
  };

  const TABS = [
    { id:'ventas',     icon:<Activity size={15}/>,     label:'Ventas',     badge:metrics.pendientes },
    { id:'calendario', icon:<CalendarDays size={15}/>, label:'Calendario' },
    { id:'metricas',   icon:<BarChart2 size={15}/>,    label:'Métricas' },
    { id:'tarifas',    icon:<Tag size={15}/>,           label:'Tarifas' },
    { id:'autos',      icon:<Car size={15}/>,           label:'Flota' },
  ];

  return (
    <div className="flex min-h-screen bg-[#121319] text-slate-300 font-sans overflow-x-hidden">

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

      {/* ── HAMBURGUESA ── */}
      <button onClick={() => setSidebar(!sidebar)}
        className="xl:hidden fixed top-4 left-4 z-50 bg-[#1E222F] p-2 rounded-xl border border-slate-800 text-white shadow-lg">
        {sidebar ? <X size={20}/> : <Menu size={20}/>}
      </button>

      {/* ── SIDEBAR ── */}
      <aside className={`w-60 bg-[#1E222F] border-r border-slate-800/80 p-5 flex flex-col fixed h-full z-40 transition-transform duration-300 xl:sticky xl:top-0 ${sidebar?'translate-x-0':'-translate-x-full'} xl:translate-x-0`}>
        <div className="flex items-center gap-2 mb-8 mt-4 xl:mt-0">
          <div className="w-3 h-3 rounded-full bg-[#88BDF2] animate-pulse"/>
          <h2 className="text-base font-black text-white uppercase italic tracking-wider">Good Trip OS</h2>
        </div>
        <nav className="space-y-1 flex-1">
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); if (window.innerWidth < 1280) setSidebar(false); }}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-xs font-bold uppercase tracking-wider relative ${tab===t.id?'bg-[#88BDF2] text-[#121319]':'hover:bg-slate-800/60 text-slate-400 hover:text-white'}`}>
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span className="absolute right-3 top-3 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
          className="text-rose-400 hover:text-rose-300 font-bold p-3 flex items-center gap-3 text-xs uppercase tracking-wider transition-colors border-t border-slate-800/80 mt-auto">
          <LogOut size={15}/> Cerrar Sesión
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 p-4 md:p-8 pt-16 xl:pt-8 w-full min-w-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-[#88BDF2] font-black text-sm tracking-widest uppercase animate-pulse">Sincronizando...</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label:'Total Leads',    val:metrics.total,                              color:'text-[#88BDF2]',  icon:<Users size={18}/> },
                { label:'Pendientes',     val:metrics.pendientes,                         color:'text-amber-400',  icon:<ShieldAlert size={18}/> },
                { label:'Confirmadas',    val:metrics.confirmadas,                        color:'text-emerald-400',icon:<Calendar size={18}/> },
                { label:'Facturación',    val:`$${Math.round(metrics.ingresos/1000)}K`,   color:'text-[#88BDF2]',  icon:<DollarSign size={18}/> },
              ].map(k => (
                <div key={k.label} className="bg-[#1E222F] border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{k.label}</p>
                    <h3 className={`text-2xl font-black mt-1 ${k.color}`}>{k.val}</h3>
                  </div>
                  <div className={`p-2.5 bg-slate-800/50 rounded-xl ${k.color}`}>{k.icon}</div>
                </div>
              ))}
            </div>

            {/* Contenido del tab */}
            <div className="animate-in fade-in duration-200">
              {tab==='ventas'     && <TabVentas reservas={reservas} cambiarEstadoReserva={cambiarEstado} eliminarReserva={eliminarReserva}/>}
              {tab==='calendario' && <TabCalendario/>}
              {tab==='metricas'   && <TabMetricas reservas={reservas}/>}
              {tab==='tarifas'    && <TabTarifas/>}
              {tab==='autos'      && <TabAutos/>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
