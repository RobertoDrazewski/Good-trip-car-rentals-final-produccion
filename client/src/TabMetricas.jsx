// client/src/TabMetricas.jsx
import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, MapPin, Users, Sparkles, Loader2, BarChart2, Globe, Car } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function KpiCard({ title, value, sub, icon, color='#88BDF2' }) {
  return (
    <div className="bg-[#121319] border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span style={{color}}>{icon}</span>
        <p className="text-[10px] font-black uppercase text-[#6F7D93] tracking-widest">{title}</p>
      </div>
      <p className="text-2xl font-black text-white font-mono">{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color='#88BDF2' }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-[10px] text-slate-400 w-32 shrink-0 truncate font-bold uppercase">{label}</p>
      <div className="flex-1 bg-slate-800 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500" style={{width:`${pct}%`, background:color}}/>
      </div>
      <p className="text-[10px] font-mono text-white w-6 text-right">{value}</p>
    </div>
  );
}

export default function TabMetricas({ reservas = [] }) {
  const [aiText,    setAiText]    = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const confirmadas = useMemo(() =>
    reservas.filter(r => ['confirmada','confirmado','contratado'].includes(String(r.estado_reserva||'').toLowerCase())),
    [reservas]
  );

  const totalIngresos = useMemo(() =>
    confirmadas.reduce((s,r) => s + parseFloat(r.monto_total_ars||0), 0), [confirmadas]);

  // Por mes
  const porMes = useMemo(() => {
    const m = Array(12).fill(0).map((_,i) => ({mes:MESES[i], reservas:0, ingresos:0}));
    confirmadas.forEach(r => {
      const match = String(r.fecha_inicio||'').match(/^(\d{4})-(\d{2})/);
      if (match) { const i = parseInt(match[2],10)-1; m[i].reservas++; m[i].ingresos += parseFloat(r.monto_total_ars||0); }
    });
    return m;
  }, [confirmadas]);

  const maxMes = Math.max(...porMes.map(m => m.reservas), 1);
  const mejorMes = [...porMes].sort((a,b) => b.ingresos - a.ingresos)[0] || {mes:'—', reservas:0};

  // Crecimiento vs mes anterior
  const mesActual = new Date().getMonth();
  const crecimiento = mesActual > 0 ? porMes[mesActual].reservas - porMes[mesActual-1].reservas : 0;

  // Por auto
  const porAuto = useMemo(() => {
    const m = {};
    confirmadas.forEach(r => {
      const key = r.modelo || `Auto ${r.auto_id}`;
      m[key] = (m[key]||0) + 1;
    });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,6);
  }, [confirmadas]);
  const maxAuto = porAuto[0]?.[1] || 1;

  // Por origen
  const porOrigen = useMemo(() => {
    const m = {};
    confirmadas.forEach(r => { const k = r.origen||'Argentina'; m[k] = (m[k]||0)+1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,8);
  }, [confirmadas]);
  const maxOrigen = porOrigen[0]?.[1] || 1;

  // Por provincia
  const porProvincia = useMemo(() => {
    const m = {};
    confirmadas.filter(r => !r.origen || r.origen==='Argentina').forEach(r => {
      const k = r.provincia||'Sin especificar'; m[k] = (m[k]||0)+1;
    });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,6);
  }, [confirmadas]);
  const maxProv = porProvincia[0]?.[1] || 1;

  const fetchAI = async () => {
    setAiLoading(true); setAiText('');
    const resumen = `
      Empresa: Good Trip Cars Rentals, Mendoza, Argentina.
      Reservas confirmadas: ${confirmadas.length} de ${reservas.length} totales.
      Ingresos ARS: $${Math.round(totalIngresos).toLocaleString('es-AR')}.
      Mejor mes: ${mejorMes.mes} con ${mejorMes.reservas} reservas.
      Crecimiento mes actual vs anterior: ${crecimiento>=0?'+':''}${crecimiento} reservas.
      Auto más solicitado: ${porAuto[0]?.[0]||'Sin datos'} (${porAuto[0]?.[1]||0} reservas).
      Principales orígenes: ${porOrigen.map(([p,n])=>`${p}(${n})`).join(', ')}.
      Provincias AR: ${porProvincia.map(([p,n])=>`${p}(${n})`).join(', ')}.
    `.trim();

    try {
      const r = await fetch(`${API_BASE_URL}/api/ai-marketing-suggestion`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ resumen })
      });
      if (r.ok) { const d = await r.json(); setAiText(d.suggestion||d.text||'Sin respuesta.'); }
      else throw new Error('no server');
    } catch {
      // Sugerencias locales inteligentes
      const tips = [];
      if (crecimiento < 0) tips.push(`📉 Las reservas bajaron ${Math.abs(crecimiento)} unidades respecto al mes anterior. Activá descuentos anticipados o publicidad en redes para revertirlo.`);
      if (porAuto.length > 0) tips.push(`🏆 El auto más solicitado es ${porAuto[0][0]}. Asegurate de que esté siempre disponible y bien mantenido — es tu producto estrella.`);
      if (porOrigen.length > 0 && porOrigen[0][0] !== 'Argentina') tips.push(`🌎 Tu principal mercado es ${porOrigen[0][0]}. Considerá publicidad en ese idioma y Google Ads segmentado.`);
      if (porProvincia.length > 0 && porProvincia[0][0] !== 'Mendoza') tips.push(`📍 Muchos clientes vienen de ${porProvincia[0][0]}. Grupos de Facebook y publicaciones geolocalizadas en esa provincia pueden traerte más reservas.`);
      tips.push(`⭐ Pedile a tus clientes satisfechos una reseña de Google. El 70% de búsquedas de autos en Mendoza terminan en Google Maps.`);
      tips.push(`💡 Momento ideal para subir precios: ${mejorMes.mes}. Es tu mes histórico con más demanda — no te quedes con precios bajos.`);
      setAiText(tips.join('\n\n'));
    } finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Ingresos Confirmados"  value={`$${Math.round(totalIngresos/1000)}K`} sub="ARS acumulados"         icon={<DollarSign size={16}/>} color="#88BDF2"/>
        <KpiCard title="Reservas Confirmadas"  value={confirmadas.length}                    sub={`de ${reservas.length} totales`} icon={<BarChart2 size={16}/>}  color="#34d399"/>
        <KpiCard title="Mejor Mes"             value={mejorMes.mes}                          sub={`${mejorMes.reservas} reservas`} icon={<TrendingUp size={16}/>} color="#fbbf24"/>
        <KpiCard title="Crecimiento"           value={`${crecimiento>=0?'+':''}${crecimiento}`} sub="vs mes anterior"    icon={<Users size={16}/>}     color={crecimiento>=0?'#34d399':'#f87171'}/>
      </div>

      {/* Gráfico por mes */}
      <div className="bg-[#1E222F]/60 border border-white/10 rounded-[2rem] p-8">
        <h3 className="text-sm font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
          <BarChart2 size={16} className="text-[#88BDF2]"/> Reservas por Mes
        </h3>
        <div className="flex items-end gap-1.5 h-36">
          {porMes.map((m, i) => {
            const pct = maxMes > 0 ? m.reservas / maxMes : 0;
            const isNow = i === new Date().getMonth();
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full rounded-t-md transition-all duration-500"
                  style={{height:`${Math.max(pct*100, 4)}%`, background: isNow ? '#88BDF2' : '#1E3A5F'}}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#121319] border border-slate-700 text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {m.reservas} · ${Math.round(m.ingresos/1000)}K
                  </div>
                </div>
                <span className="text-[7px] text-slate-500 font-bold">{m.mes}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Autos + Orígenes + Provincias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E222F]/60 border border-white/10 rounded-[2rem] p-6">
          <h3 className="text-sm font-black uppercase text-white tracking-widest mb-5 flex items-center gap-2">
            <Car size={16} className="text-amber-400"/> Autos más alquilados
          </h3>
          <div className="space-y-3">
            {porAuto.length > 0
              ? porAuto.map(([a, n]) => <MiniBar key={a} label={a} value={n} max={maxAuto} color="#fbbf24"/>)
              : <p className="text-xs text-slate-500">Sin datos</p>}
          </div>
        </div>

        <div className="bg-[#1E222F]/60 border border-white/10 rounded-[2rem] p-6">
          <h3 className="text-sm font-black uppercase text-white tracking-widest mb-5 flex items-center gap-2">
            <Globe size={16} className="text-[#88BDF2]"/> Origen de Clientes
          </h3>
          <div className="space-y-3">
            {porOrigen.length > 0
              ? porOrigen.map(([p, n]) => <MiniBar key={p} label={p} value={n} max={maxOrigen} color="#88BDF2"/>)
              : <p className="text-xs text-slate-500">Sin datos</p>}
          </div>
        </div>

        <div className="bg-[#1E222F]/60 border border-white/10 rounded-[2rem] p-6">
          <h3 className="text-sm font-black uppercase text-white tracking-widest mb-5 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-400"/> Provincias AR
          </h3>
          <div className="space-y-3">
            {porProvincia.length > 0
              ? porProvincia.map(([p, n]) => <MiniBar key={p} label={p} value={n} max={maxProv} color="#34d399"/>)
              : <p className="text-xs text-slate-500">Sin datos</p>}
          </div>
        </div>
      </div>

      {/* IA Marketing */}
      <div className="bg-[#1E222F]/60 border border-[#88BDF2]/20 rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
            <Sparkles size={16} className="text-[#88BDF2]"/> Asistente de Marketing IA
          </h3>
          <button onClick={fetchAI} disabled={aiLoading}
            className="flex items-center gap-2 bg-[#88BDF2] text-[#121319] text-[11px] font-black px-4 py-2 rounded-xl hover:bg-white transition-all disabled:opacity-50">
            {aiLoading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
            {aiLoading ? 'Analizando...' : 'Analizar y Sugerir'}
          </button>
        </div>
        {aiText ? (
          <div className="bg-[#121319] border border-slate-800 rounded-2xl p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {aiText}
          </div>
        ) : (
          <div className="bg-[#121319] border border-slate-800/40 rounded-2xl p-6 text-center">
            <Sparkles size={24} className="text-slate-600 mx-auto mb-2"/>
            <p className="text-xs text-slate-500">Presioná "Analizar y Sugerir" para obtener recomendaciones basadas en tus datos reales.</p>
          </div>
        )}
      </div>
    </div>
  );
}
