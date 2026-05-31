// client/src/TabVentas.jsx
import React, { useState, useMemo } from 'react';
import { FileText, MessageCircle, Trash2, Filter, AlertTriangle, Globe, MapPin, Calendar } from 'lucide-react';

const MESES_OPTS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Años generados en vivo: desde 2024 hasta el año actual + 50.
// Al calcularse con new Date(), nunca queda desactualizado.
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: (ANIO_ACTUAL + 50) - 2024 + 1 }, (_, i) => 2024 + i);

export default function TabVentas({
  reservas = [],
  cambiarEstadoReserva,
  eliminarReserva,
}) {
  const [filtroMes,    setFiltroMes]    = useState('todos');
  const [filtroAnio,   setFiltroAnio]   = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  const calcularDias = (inicio, fin) => {
    if (!inicio || !fin) return 1;
    const d1 = new Date(`${String(inicio).split('T')[0].split(' ')[0]}T00:00:00`);
    const d2 = new Date(`${String(fin).split('T')[0].split(' ')[0]}T00:00:00`);
    const diff = Math.ceil((d2 - d1) / 86400000);
    return diff > 0 ? diff : 1;
  };

  const reservasFiltradas = useMemo(() => {
    return reservas.filter(r => {
      const est = String(r.estado_reserva || r.estado || 'pendiente').toLowerCase();
      if (filtroEstado !== 'todas' && est !== filtroEstado) return false;
      const match = String(r.fecha_inicio || '').match(/^(\d{4})-(\d{2})/);
      if (!match) return true;
      if (filtroAnio !== 'todos' && match[1] !== filtroAnio) return false;
      if (filtroMes  !== 'todos' && parseInt(match[2],10).toString() !== filtroMes) return false;
      return true;
    });
  }, [reservas, filtroMes, filtroAnio, filtroEstado]);

  // Badge de estado
  const getBadge = (estado) => {
    const e = String(estado || '').toLowerCase();
    if (e === 'confirmada' || e === 'confirmado') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (e === 'cancelada'  || e === 'cancelado')  return 'bg-rose-500/20    text-rose-400    border-rose-500/40';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  };

  const esInternacional = (r) => r.origen && r.origen !== 'Argentina';

  // Imprimir ticket individual
  const handleImprimirTicket = (r) => {
    const dias = calcularDias(r.fecha_inicio, r.fecha_fin);
    const w = window.open('', '_blank', 'width=700,height=900');
    w.document.write(`
      <html><head><title>Ticket Good Trip #${r.id}</title>
      <style>
        body{font-family:monospace;background:#fff;color:#000;padding:32px;max-width:600px;margin:auto}
        h1{font-size:22px;text-align:center}
        .sub{text-align:center;color:#555;font-size:12px;margin-bottom:24px}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc;font-size:13px}
        .total{font-size:18px;font-weight:bold;display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:2px solid #000}
        .footer{margin-top:32px;font-size:10px;color:#888;text-align:center}
        .badge{background:#000;color:#fff;display:inline-block;padding:2px 8px;font-size:11px;margin-bottom:8px}
      </style></head><body>
      <h1>🚗 GOOD TRIP CARS</h1>
      <div class="sub">Mendoza, Argentina · goodtripmendoza@gmail.com</div>
      <div class="badge">RESERVA Nº ${r.id}</div>
      <div class="row"><span>Cliente</span><span>${r.cliente_nombre || '-'}</span></div>
      <div class="row"><span>WhatsApp</span><span>${r.cliente_whatsapp || '-'}</span></div>
      <div class="row"><span>Vehículo</span><span>${r.modelo || 'Auto'}</span></div>
      <div class="row"><span>Origen</span><span>${r.origen || 'Argentina'}${r.provincia ? ' · '+r.provincia : ''}</span></div>
      <div class="row"><span>Retiro</span><span>${String(r.fecha_inicio||'').substring(0,10)} — ${r.lugar_retiro || '-'}</span></div>
      <div class="row"><span>Devolución</span><span>${String(r.fecha_fin||'').substring(0,10)} — ${r.lugar_devolucion || '-'}</span></div>
      <div class="row"><span>Días</span><span>${dias}</span></div>
      <div class="row"><span>Método de Pago</span><span>${String(r.metodo_pago||'efectivo').replace('_',' ')}</span></div>
      <div class="row"><span>Garantía</span><span>USD ${r.garantia_usd || 400}</span></div>
      <div class="total"><span>TOTAL</span><span>ARS $${parseFloat(r.monto_total_ars||0).toLocaleString('es-AR')}</span></div>
      <div class="row" style="margin-top:16px"><span>Estado</span><span>${r.estado_reserva || r.estado || 'pendiente'}</span></div>
      <div class="footer">Buenos vientos 🌬️ — Good Trip Mendoza</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  // WhatsApp al cliente
  const handleWhatsApp = (r) => {
    const dias = calcularDias(r.fecha_inicio, r.fecha_fin);
    const msg = encodeURIComponent(
      `Hola ${r.cliente_nombre}! 👋 Te escribimos desde Good Trip Cars Rentals Mendoza.\n\n` +
      `Tu reserva Nº${r.id} está ${r.estado_reserva || 'pendiente'}.\n` +
      `🚗 ${r.modelo || 'Vehículo'} — ${dias} días\n` +
      `📅 ${String(r.fecha_inicio||'').substring(0,10)} → ${String(r.fecha_fin||'').substring(0,10)}\n` +
      `💰 Total: ARS $${parseFloat(r.monto_total_ars||0).toLocaleString('es-AR')}\n\n` +
      `¿En qué más podemos ayudarte? 😊`
    );
    const tel = String(r.cliente_whatsapp || '').replace(/\D/g,'');
    const telFmt = tel.startsWith('54') ? tel : `54${tel}`;
    window.open(`https://wa.me/${telFmt}?text=${msg}`, '_blank');
  };

  // Detectar teléfono Mendoza
  const esMendoza = (wpp) => {
    const t = String(wpp || '').replace(/\D/g,'');
    return t.startsWith('261') || t.startsWith('54261');
  };

  const totalFiltrado = reservasFiltradas.reduce((s, r) => s + parseFloat(r.monto_total_ars || 0), 0);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">

      {/* FILTROS */}
      <div className="bg-[#1E222F] border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3 text-white font-black uppercase tracking-wider text-sm">
          <Filter className="text-[#88BDF2]" size={18}/>
          <span>{reservasFiltradas.length} reservas</span>
          {totalFiltrado > 0 && (
            <span className="text-[#88BDF2] font-mono text-xs ml-2">
              · ARS ${Math.round(totalFiltrado).toLocaleString('es-AR')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
            className="bg-[#121319] border border-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer">
            <option value="todos">Todos los Meses</option>
            {MESES_OPTS.map((m,i) => <option key={i} value={String(i+1)}>{m}</option>)}
          </select>
          <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
            className="bg-[#121319] border border-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer">
            <option value="todos">Todos los Años</option>
            {ANIOS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="bg-[#121319] border border-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer uppercase">
            <option value="todas">Todos los Estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* GRILLA DE TARJETAS (sin scroll lateral) */}
      {reservasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reservasFiltradas.map(r => {
            const dias = calcularDias(r.fecha_inicio, r.fecha_fin);
            const mendoza = esMendoza(r.cliente_whatsapp);
            const internacional = esInternacional(r);
            return (
              <div key={r.id}
                className="bg-[#1E222F] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl hover:border-[#88BDF2]/30 transition-colors">

                {/* Cabecera: ID + estado */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-[#88BDF2] text-sm">#{r.id}</span>
                  <select
                    value={String(r.estado_reserva || r.estado || 'pendiente').toLowerCase()}
                    onChange={e => cambiarEstadoReserva && cambiarEstadoReserva(r.id, e.target.value)}
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border outline-none cursor-pointer ${getBadge(r.estado_reserva || r.estado)}`}
                  >
                    <option value="pendiente">PENDIENTE</option>
                    <option value="confirmada">CONFIRMADA</option>
                    <option value="cancelada">CANCELADA</option>
                  </select>
                </div>

                {/* Cliente */}
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-white uppercase text-sm leading-tight">{r.cliente_nombre}</span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                    {mendoza && <AlertTriangle size={11} className="text-amber-400"/>}
                    {r.cliente_whatsapp}
                  </span>
                  {mendoza && <span className="text-[9px] text-amber-400 font-bold">📍 Local Mendoza</span>}
                </div>

                {/* Vehículo + Origen */}
                <div className="grid grid-cols-2 gap-3 bg-[#121319]/60 rounded-xl p-3 border border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-black text-[#6F7D93] tracking-widest mb-0.5">Vehículo</span>
                    <span className="font-black uppercase text-slate-200 text-xs truncate">{r.modelo || 'Eliminado'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-black text-[#6F7D93] tracking-widest mb-0.5">Origen</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-200">
                      {internacional
                        ? <><Globe size={11} className="text-[#88BDF2]"/> {r.origen}</>
                        : <><MapPin size={11} className="text-emerald-400"/> {r.provincia || 'Argentina'}</>}
                    </span>
                    {!internacional && r.provincia && <span className="text-[9px] text-slate-500">Argentina</span>}
                  </div>
                </div>

                {/* Fechas + días */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-emerald-400"><Calendar size={11}/> {String(r.fecha_inicio||'').substring(0,10)}</span>
                    <span className="flex items-center gap-1 text-rose-400"><Calendar size={11}/> {String(r.fecha_fin||'').substring(0,10)}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-black text-white leading-none">{dias}</span>
                    <span className="text-[8px] uppercase text-[#6F7D93] font-black tracking-wider">días</span>
                  </div>
                </div>

                {/* Monto + método */}
                <div className="flex items-end justify-between pt-3 border-t border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="font-black text-[#88BDF2] text-lg font-mono">
                      ${parseFloat(r.monto_total_ars||0).toLocaleString('es-AR')}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">
                      {String(r.metodo_pago||'efectivo').replace(/_/g,' ')}
                    </span>
                  </div>

                  {/* ACCIONES siempre visibles */}
                  <div className="flex gap-2 items-center">
                    <button onClick={() => handleWhatsApp(r)}
                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="WhatsApp">
                      <MessageCircle size={16}/>
                    </button>
                    <button onClick={() => handleImprimirTicket(r)}
                      className="p-2 rounded-xl bg-[#88BDF2]/10 text-[#88BDF2] hover:bg-[#88BDF2]/20 transition-colors" title="Imprimir Ticket / PDF">
                      <FileText size={16}/>
                    </button>
                    <button onClick={() => eliminarReserva && eliminarReserva(r.id)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" title="Eliminar">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#1E222F] border border-slate-800 rounded-2xl p-12 text-center font-black text-slate-600 tracking-widest uppercase">
          No hay reservas para los filtros seleccionados
        </div>
      )}
    </div>
  );
}
