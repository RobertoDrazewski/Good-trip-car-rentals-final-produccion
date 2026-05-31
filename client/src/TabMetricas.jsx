// client/src/TabMetricas.jsx
import React, { useState, useMemo } from 'react';
import {
  TrendingUp, DollarSign, MapPin, Users, Sparkles, Loader2,
  BarChart2, Globe, Car, Download
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const PALETA = ['#88BDF2','#34d399','#fbbf24','#f87171','#a78bfa','#fb923c','#22d3ee','#e879f9','#4ade80','#facc15'];

const fmtARS = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

const tipStyle = {
  background: '#121319',
  border: '1px solid #334155',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
  padding: '8px 12px'
};

// Anillo circular para KPIs
function Ring({ pct, color }) {
  const r = 26, c = 2 * Math.PI * r;
  const val = Math.min(Math.max(pct, 0), 100);
  const off = c - (val / 100) * c;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} stroke="#2a2f3d" strokeWidth="6" fill="none" />
      <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="6" fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{Math.round(val)}%</text>
    </svg>
  );
}

function KpiCard({ title, value, sub, icon, color = '#88BDF2', pct = null }) {
  return (
    <div className="bg-[#121319] border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4">
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <p className="text-[10px] font-black uppercase text-[#6F7D93] tracking-widest truncate">{title}</p>
        </div>
        <p className="text-2xl font-black text-white font-mono truncate">{value}</p>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
      {pct !== null && <Ring pct={pct} color={color} />}
    </div>
  );
}

function PanelTorta({ titulo, icon, data, vacioTxt }) {
  return (
    <div className="bg-[#1E222F]/60 border border-white/10 rounded-[2rem] p-6">
      <h3 className="text-sm font-black uppercase text-white tracking-widest mb-4 flex items-center gap-2">
        {icon} {titulo}
      </h3>
      {data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={50} outerRadius={85} paddingAngle={3} animationDuration={700}>
                {data.map((e, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
              </Pie>
              <Tooltip contentStyle={tipStyle} itemStyle={{ color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-slate-500 py-12 text-center">{vacioTxt}</p>
      )}
    </div>
  );
}

export default function TabMetricas({ reservas = [] }) {
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const anioActual = new Date().getFullYear();
  const [filtroAnio, setFiltroAnio] = useState(String(anioActual));
  const [filtroMes, setFiltroMes] = useState('todos'); // 'todos' | '1'..'12'

  const getYM = (r) => {
    const m = String(r.fecha_inicio || '').match(/^(\d{4})-(\d{2})/);
    return m ? { y: m[1], mo: parseInt(m[2], 10) } : null;
  };

  const confirmadas = useMemo(() =>
    reservas.filter(r => ['confirmada','confirmado','contratado'].includes(String(r.estado_reserva || '').toLowerCase())),
    [reservas]
  );

  // Generación dinámica de la lista de años (Pasado desde DB + 2025 + Presente + 50 años al futuro)
  const aniosDisponibles = useMemo(() => {
    const conjuntoAnios = new Set();
    
    // 1. Agregar cualquier año de reservas existentes en la base de datos (Historial hacia atrás)
    confirmadas.forEach(r => { 
      const ym = getYM(r); 
      if (ym) conjuntoAnios.add(String(ym.y)); 
    });
    
    // 2. Forzar la inclusión del año 2025
    conjuntoAnios.add("2025");
    
    // 3. Agregar el año actual y extender el catálogo 50 años hacia el futuro
    for (let i = 0; i <= 50; i++) {
      conjuntoAnios.add(String(anioActual + i));
    }
    
    // 4. Ordenar numéricamente para evitar desajustes en el combobox
    return [...conjuntoAnios].sort((a, b) => Number(a) - Number(b));
  }, [confirmadas, anioActual]);

  // confirmadas del año seleccionado
  const delAnio = useMemo(() =>
    confirmadas.filter(r => { const ym = getYM(r); return ym && ym.y === filtroAnio; }),
    [confirmadas, filtroAnio]
  );

  // dataset filtrado (año + mes opcional) → alimenta KPIs, tortas y autos
  const dataFiltrada = useMemo(() => {
    if (filtroMes === 'todos') return delAnio;
    return delAnio.filter(r => { const ym = getYM(r); return ym && ym.mo === parseInt(filtroMes, 10); });
  }, [delAnio, filtroMes]);

  // todas las reservas del período (cualquier estado) → para ratio confirmadas
  const todasDelPeriodo = useMemo(() =>
    reservas.filter(r => {
      const ym = getYM(r); if (!ym || ym.y !== filtroAnio) return false;
      if (filtroMes !== 'todos' && ym.mo !== parseInt(filtroMes, 10)) return false;
      return true;
    }),
    [reservas, filtroAnio, filtroMes]
  );

  // serie mensual del año (para el gráfico de barras + línea)
  const monthlyData = useMemo(() => {
    const arr = MESES.map((mes) => ({ mes, reservas: 0, ingresos: 0 }));
    delAnio.forEach(r => {
      const ym = getYM(r); if (!ym) return;
      arr[ym.mo - 1].reservas++;
      arr[ym.mo - 1].ingresos += parseFloat(r.monto_total_ars || 0);
    });
    return arr;
  }, [delAnio]);

  const totalIngresos = useMemo(() => dataFiltrada.reduce((s, r) => s + parseFloat(r.monto_total_ars || 0), 0), [dataFiltrada]);
  const ingresosAnio = useMemo(() => monthlyData.reduce((s, m) => s + m.ingresos, 0), [monthlyData]);

  const mejorMes = useMemo(() => {
    const top = [...monthlyData].sort((a, b) => b.ingresos - a.ingresos)[0];
    return top && top.ingresos > 0 ? top : { mes: '—', reservas: 0, ingresos: 0 };
  }, [monthlyData]);

  const crecimiento = useMemo(() => {
    const idx = filtroMes !== 'todos' ? parseInt(filtroMes, 10) - 1 : new Date().getMonth();
    if (idx <= 0) return monthlyData[idx]?.reservas || 0;
    return (monthlyData[idx]?.reservas || 0) - (monthlyData[idx - 1]?.reservas || 0);
  }, [monthlyData, filtroMes]);

  // Nacional por provincia
  const nacionalData = useMemo(() => {
    const m = {};
    dataFiltrada.filter(r => !r.origen || r.origen === 'Argentina').forEach(r => {
      const k = r.provincia || 'Sin provincia'; m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dataFiltrada]);

  // Internacional por país
  const internacionalData = useMemo(() => {
    const m = {};
    dataFiltrada.filter(r => r.origen && r.origen !== 'Argentina').forEach(r => {
      const k = r.origen; m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dataFiltrada]);

  // Autos más alquilados
  const autosData = useMemo(() => {
    const m = {};
    dataFiltrada.forEach(r => { const k = r.modelo || `Auto ${r.auto_id}`; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [dataFiltrada]);

  const periodoLabel = filtroMes === 'todos'
    ? `Año ${filtroAnio}`
    : `${MESES_LARGO[parseInt(filtroMes, 10) - 1]} ${filtroAnio}`;

  const ringIngresos = ingresosAnio > 0 ? (totalIngresos / ingresosAnio) * 100 : (totalIngresos > 0 ? 100 : 0);
  const ringConfirm = todasDelPeriodo.length > 0 ? (dataFiltrada.length / todasDelPeriodo.length) * 100 : 0;

  // ============ EXPORTAR PDF DEL PERÍODO ============
  const descargarPDF = () => {
    const filas = [...dataFiltrada].sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));
    const total = filas.reduce((s, r) => s + parseFloat(r.monto_total_ars || 0), 0);
    const rows = filas.map(r => `
      <tr>
        <td>#${r.id}</td>
        <td>${String(r.fecha_inicio || '').substring(0, 10)}</td>
        <td>${r.cliente_nombre || '-'}</td>
        <td>${r.modelo || 'Auto ' + r.auto_id}</td>
        <td>${r.origen || 'Argentina'}${r.provincia ? ' / ' + r.provincia : ''}</td>
        <td>${String(r.metodo_pago || 'efectivo').replace(/_/g, ' ')}</td>
        <td style="text-align:right">$${parseFloat(r.monto_total_ars || 0).toLocaleString('es-AR')}</td>
      </tr>`).join('');
    const w = window.open('', '_blank', 'width=900,height=1000');
    w.document.write(`
      <html><head><title>Ventas ${periodoLabel} - Good Trip</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#000;padding:32px;max-width:850px;margin:auto}
        h1{font-size:20px;margin-bottom:0}
        .sub{color:#555;font-size:12px;margin-bottom:18px}
        .meta{font-size:11px;color:#444;margin-bottom:14px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:7px}
        th{background:#121319;color:#fff;text-align:left;font-size:11px;text-transform:uppercase}
        tfoot td{font-weight:bold;font-size:14px;border-top:2px solid #000}
        .foot{font-size:10px;color:#888;margin-top:24px}
      </style></head><body>
      <h1>🚗 GOOD TRIP CARS RENTALS</h1>
      <div class="sub">Reporte de ventas confirmadas · Mendoza, Argentina</div>
      <div class="meta"><b>Período:</b> ${periodoLabel} &nbsp;·&nbsp; <b>Reservas:</b> ${filas.length} &nbsp;·&nbsp; <b>Emitido:</b> ${new Date().toLocaleDateString('es-AR')}</div>
      <table>
        <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Vehículo</th><th>Origen</th><th>Pago</th><th style="text-align:right">Monto ARS</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:20px">Sin reservas confirmadas en el período</td></tr>'}</tbody>
        <tfoot><tr><td colspan="6">TOTAL FACTURADO ARS</td><td style="text-align:right">$${Math.round(total).toLocaleString('es-AR')}</td></tr></tfoot>
      </table>
      <p class="foot">Documento generado automáticamente para constatación impositiva. Good Trip Mendoza.</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  // ============ ASISTENTE IA ============
  const fetchAI = async () => {
    setAiLoading(true); setAiText('');
    const resumen = `
      Empresa: Good Trip Cars Rentals, Mendoza, Argentina.
      Período analizado: ${periodoLabel}.
      Reservas confirmadas: ${dataFiltrada.length} de ${todasDelPeriodo.length} totales.
      Ingresos ARS: ${fmtARS(totalIngresos)}.
      Mejor mes del año: ${mejorMes.mes} con ${mejorMes.reservas} reservas.
      Crecimiento: ${crecimiento >= 0 ? '+' : ''}${crecimiento} reservas vs mes anterior.
      Auto más solicitado: ${autosData[0]?.name || 'Sin datos'} (${autosData[0]?.value || 0}).
      Mercados internacionales: ${internacionalData.map(d => `${d.name}(${d.value})`).join(', ') || 'ninguno'}.
      Provincias AR: ${nacionalData.map(d => `${d.name}(${d.value})`).join(', ') || 'ninguna'}.
    `.trim();

    try {
      const r = await fetch(`${API_BASE_URL}/api/ai-marketing-suggestion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumen })
      });
      if (r.ok) { const d = await r.json(); setAiText(d.suggestion || d.text || 'Sin respuesta.'); }
      else throw new Error('no server');
    } catch {
      const tips = [];
      if (crecimiento < 0) tips.push(`📉 Las reservas bajaron ${Math.abs(crecimiento)} unidades respecto al mes anterior. Activá descuentos anticipados o publicidad en redes para revertirlo.`);
      if (autosData.length > 0) tips.push(`🏆 El auto más solicitado is ${autosData[0].name}. Mantenelo siempre disponible y bien cuidado — es tu producto estrella.`);
      if (internacionalData.length > 0) tips.push(`🌎 Tenés clientes de ${internacionalData[0].name}. Considerá Google Ads segmentado a ese país y atención en su idioma.`);
      if (nacionalData.length > 0 && nacionalData[0].name !== 'Mendoza' && nacionalData[0].name !== 'Sin provincia') tips.push(`📍 Muchos clientes vienen de ${nacionalData[0].name}. Publicaciones geolocalizadas en esa provincia pueden traerte más reservas.`);
      tips.push(`⭐ Pedile a tus clientes satisfechos una reseña de Google. El 70% de búsquedas de autos en Mendoza terminan en Google Maps.`);
      if (mejorMes.mes !== '—') tips.push(`💡 Tu mes pico es ${mejorMes.mes}. Es el momento ideal para ajustar precios al alza — no te quedes con tarifas bajas en plena demanda.`);
      setAiText(tips.join('\n\n'));
    } finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* BARRA DE FILTROS + EXPORTAR */}
      <div className="bg-[#1E222F] border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h2 className="text-white font-black uppercase tracking-wider text-sm flex items-center gap-2">
          <BarChart2 className="text-[#88BDF2]" size={18} /> Dashboard · {periodoLabel}
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
            className="bg-[#121319] border border-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer">
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
            className="bg-[#121319] border border-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer">
            <option value="todos">Todo el Año</option>
            {MESES_LARGO.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
          <button onClick={descargarPDF}
            className="flex items-center gap-2 bg-[#88BDF2] text-[#121319] text-[11px] font-black px-4 py-2.5 rounded-xl hover:bg-white transition-all uppercase tracking-wider">
            <Download size={14} /> PDF del período
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Ingresos Confirmados" value={fmtARS(totalIngresos)} sub="ARS del período"
          icon={<DollarSign size={16} />} color="#88BDF2" pct={ringIngresos} />
        <KpiCard title="Reservas Confirmadas" value={dataFiltrada.length} sub={`de ${todasDelPeriodo.length} totales`}
          icon={<BarChart2 size={16} />} color="#34d399" pct={ringConfirm} />
        <KpiCard title="Mejor Mes (año)" value={mejorMes.mes} sub={`${mejorMes.reservas} reservas · ${fmtARS(mejorMes.ingresos)}`}
          icon={<TrendingUp size={16} />} color="#fbbf24" />
        <KpiCard title="Crecimiento" value={`${crecimiento >= 0 ? '+' : ''}${crecimiento}`} sub="reservas vs mes anterior"
          icon={<Users size={16} />} color={crecimiento >= 0 ? '#34d399' : '#f87171'} />
      </div>

      {/* GRÁFICO MENSUAL: barras (reservas) + línea (ingresos) */}
      <div className="bg-[#1E222F]/60 border border-white/10 rounded-[2rem] p-6 md:p-8">
        <h3 className="text-sm font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
          <BarChart2 size={16} className="text-[#88BDF2]" /> Reservas e Ingresos por Mes · {filtroAnio}
        </h3>
        
        <div className="w-full overflow-x-auto overflow-y-hidden pb-4">
          <div className="h-72 min-w-[700px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2733" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#1f2733' }} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false} tickLine={false} tickFormatter={v => `$${Math.round(v / 1000)}K`} />
                <Tooltip contentStyle={tipStyle} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  formatter={(value, name) => name === 'Ingresos ARS' ? [fmtARS(value), name] : [value, name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="reservas" name="Reservas" fill="#88BDF2" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Line yAxisId="right" type="monotone" dataKey="ingresos" name="Ingresos ARS" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={800} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TORTAS: nacional por provincia + internacional por país */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PanelTorta
          titulo="Nacional · por Provincia"
          icon={<MapPin size={16} className="text-emerald-400" />}
          data={nacionalData}
          vacioTxt="Sin reservas nacionales en el período (o falta cargar provincia)."
        />
        <PanelTorta
          titulo="Internacional · por País"
          icon={<Globe size={16} className="text-[#88BDF2]" />}
          data={internacionalData}
          vacioTxt="Sin reservas internacionales en el período."
        />
      </div>

      {/* AUTOS MÁS ALQUILADOS (barras horizontales) */}
      <div className="bg-[#1E222F]/60 border border-white/10 rounded-[2rem] p-6 md:p-8">
        <h3 className="text-sm font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
          <Car size={16} className="text-amber-400" /> Autos más alquilados
        </h3>
        {autosData.length > 0 ? (
          <div style={{ height: Math.max(autosData.length * 46, 120) }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={autosData} layout="vertical" margin={{ top: 0, right: 24, left: 10, bottom: 0 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tipStyle} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" name="Reservas" radius={[0, 6, 6, 0]} animationDuration={800}>
                  {autosData.map((e, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-8 text-center">Sin datos en el período seleccionado.</p>
        )}
      </div>

      {/* IA MARKETING */}
      <div className="bg-[#1E222F]/60 border border-[#88BDF2]/20 rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
            <Sparkles size={16} className="text-[#88BDF2]" /> Asistente de Marketing IA
          </h3>
          <button onClick={fetchAI} disabled={aiLoading}
            className="flex items-center gap-2 bg-[#88BDF2] text-[#121319] text-[11px] font-black px-4 py-2 rounded-xl hover:bg-white transition-all disabled:opacity-50">
            {aiLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            {aiLoading ? 'Analizando...' : 'Analizar y Sugerir'}
          </button>
        </div>
        {aiText ? (
          <div className="bg-[#121319] border border-slate-800 rounded-2xl p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {aiText}
          </div>
        ) : (
          <div className="bg-[#121319] border border-slate-800/40 rounded-2xl p-6 text-center">
            <Sparkles size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Presioná "Analizar y Sugerir" para recomendaciones basadas en los datos del período.</p>
          </div>
        )}
      </div>
    </div>
  );
}