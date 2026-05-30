// client/src/TabCalendario.jsx
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { Calendar as CalendarIcon, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TabCalendario() {
  const [autos,        setAutos]        = useState([]);
  const [reservas,     setReservas]     = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fmt = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      // /api/cars es público, /api/ventas devuelve reservas con JOIN
      const [resAutos, resReservas] = await Promise.all([
        axios.get(`${API}/api/cars`),
        axios.get(`${API}/api/ventas`, auth()),
      ]);
      const aData = Array.isArray(resAutos.data) ? resAutos.data
                  : Array.isArray(resAutos.data?.[0]) ? resAutos.data[0] : [];
      const rData = Array.isArray(resReservas.data) ? resReservas.data : [];
      setAutos(aData);
      setReservas(rData);
    } catch (err) {
      console.error('❌ TabCalendario:', err);
      setError('No se pudo cargar el calendario.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const hoy = fmt(selectedDate);

  // Una reserva aparece en el calendario si estado=1 (confirmada/contratada)
  // o si estado_reserva es confirmada/confirmado/contratado
  const esActiva = (r) => {
    const est = String(r.estado_reserva || '').toLowerCase();
    return r.estado === 1 || r.estado === '1' ||
           ['confirmada','confirmado','contratado'].includes(est);
  };

  if (loading) return (
    <div className="bg-[#1E222F] p-12 rounded-[2rem] border border-slate-800/40 flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-[#88BDF2] mb-3" size={32}/>
      <p className="text-xs font-black uppercase tracking-widest text-[#6F7D93]">Cargando calendario...</p>
    </div>
  );

  if (error) return (
    <div className="bg-[#1E222F] p-8 rounded-[2rem] border border-rose-500/10 flex items-center gap-3 text-rose-400">
      <AlertCircle size={20} className="shrink-0"/>
      <p className="text-xs font-bold uppercase">{error}</p>
    </div>
  );

  return (
    <div className="bg-[#1E222F] p-4 md:p-8 rounded-[2rem] shadow-xl border border-slate-800/40 w-full">
      <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
        <CalendarIcon size={24} className="text-[#88BDF2]"/> Calendario
        <span className="text-slate-500 text-sm not-italic font-bold">Operativo</span>
      </h2>

      <div className="overflow-x-auto w-full pb-4">
        <div className="min-w-[800px] w-full">
          <style>{`
            .react-calendar{width:100%;border:none!important;background:transparent!important;font-family:inherit;color:#fff}
            .react-calendar__navigation{margin-bottom:20px}
            .react-calendar__navigation button{color:#88BDF2;min-width:44px;background:#121319;border:1px solid #1E222F;border-radius:12px;margin:0 4px;font-weight:900;text-transform:uppercase;letter-spacing:2px;cursor:pointer}
            .react-calendar__navigation button:enabled:hover{background-color:#88BDF2;color:#121319}
            .react-calendar__month-view__weekdays{text-transform:uppercase;font-weight:900;font-size:.7rem;color:#6F7D93;letter-spacing:1px}
            .react-calendar__month-view__weekdays__weekday abbr{text-decoration:none}
            .react-calendar__tile{height:110px!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;align-items:center!important;padding:6px 3px!important;border:1px solid #1E222F!important;background:#121319;color:#fff;transition:all .2s;cursor:pointer}
            .react-calendar__tile:enabled:hover{background-color:#1E222F!important}
            .react-calendar__tile--now{background:#1E222F!important;border:1px solid #5383B3!important;font-weight:bold}
            .react-calendar__tile--active{background-color:#1E222F!important;border:2px solid #88BDF2!important;color:#88BDF2!important}
            .patente-tag{font-size:7px!important;font-weight:900!important;text-transform:uppercase;background:#121319!important;color:#88BDF2!important;padding:2px 4px!important;border-radius:4px!important;width:100%!important;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(136,189,242,.2)}
            .car-thumb{width:100%;height:30px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))}
          `}</style>

          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            formatDay={(_, date) => date.getDate()}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;
              const celda = fmt(date);
              const del_dia = reservas.filter(r => {
                if (!r.fecha_inicio || !r.fecha_fin || !esActiva(r)) return false;
                const ri = String(r.fecha_inicio).split('T')[0].split(' ')[0];
                const rf = String(r.fecha_fin).split('T')[0].split(' ')[0];
                return ri <= celda && rf >= celda;
              });
              if (!del_dia.length) return null;
              return (
                <div className="w-full flex flex-col gap-0.5 mt-1 px-0.5 overflow-y-auto h-full">
                  {del_dia.slice(0,2).map((r, i) => {
                    const auto = autos.find(a => parseInt(a.id,10) === parseInt(r.auto_id,10));
                    return (
                      <div key={i} className="w-full flex flex-col items-center bg-[#1E222F] border border-slate-700/40 rounded p-0.5"
                        title={`${auto?.modelo||'Auto'} · ${r.cliente_nombre||'Cliente'}`}>
                        {auto?.imagen_url && (
                          <img src={auto.imagen_url.startsWith('http') ? auto.imagen_url : `${API}${auto.imagen_url}`}
                            alt="" className="car-thumb"/>
                        )}
                        <span className="patente-tag">{auto?.patente||r.cliente_nombre?.substring(0,8)||'—'}</span>
                      </div>
                    );
                  })}
                  {del_dia.length > 2 && (
                    <span className="text-[7px] text-[#88BDF2] font-black text-center">+{del_dia.length-2} más</span>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Estado de flota para la fecha seleccionada */}
      <div className="mt-8 pt-6 border-t border-slate-800/60">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-4 flex items-center gap-2">
          Estado de Flota —
          <span className="text-[#88BDF2] font-mono not-italic">{hoy}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {autos.map(auto => {
            const reservaActiva = reservas.find(r => {
              if (parseInt(r.auto_id,10) !== parseInt(auto.id,10)) return false;
              if (!esActiva(r)) return false;
              const ri = String(r.fecha_inicio).split('T')[0].split(' ')[0];
              const rf = String(r.fecha_fin).split('T')[0].split(' ')[0];
              return ri <= hoy && rf >= hoy;
            });
            return (
              <div key={auto.id}
                className={`flex items-center p-4 rounded-2xl border transition-all ${
                  reservaActiva
                    ? 'border-rose-900/40 bg-rose-950/20'
                    : 'border-slate-800/40 bg-[#121319]/50 hover:border-emerald-500/30'
                }`}>
                <div className="w-20 h-14 bg-[#121319] rounded-xl flex items-center justify-center border border-slate-800/40 shrink-0 overflow-hidden">
                  {auto.imagen_url
                    ? <img src={auto.imagen_url.startsWith('http') ? auto.imagen_url : `${API}${auto.imagen_url}`}
                        alt={auto.modelo} className="w-full h-full object-contain"/>
                    : <span className="text-[9px] text-slate-600 font-bold uppercase">Sin foto</span>
                  }
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-bold text-white text-xs truncate uppercase">{auto.modelo}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{auto.patente||'S/P'}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {reservaActiva ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-75"/>
                          <span className="relative rounded-full h-2 w-2 bg-rose-500"/>
                        </span>
                        <span className="text-[9px] font-black text-rose-400 uppercase truncate">
                          {reservaActiva.cliente_nombre||'Reservado'}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={11} className="text-emerald-500"/>
                        <span className="text-[9px] font-black text-emerald-500 uppercase">Disponible</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
