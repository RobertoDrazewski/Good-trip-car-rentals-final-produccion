// client/src/TabVentas.jsx
import React, { useState, useMemo } from 'react';
import { FileText, MessageCircle, Trash2, Filter, AlertTriangle } from 'lucide-react';

const MESES_OPTS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

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
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
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

      {/* TABLA */}
      <div className="bg-[#1E222F] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead className="bg-[#121319] border-b border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-400">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Vehículo</th>
              <th className="p-4">Origen</th>
              <th className="p-4">Fechas</th>
              <th className="p-4 text-center">Días</th>
              <th className="p-4">Monto</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-xs font-medium text-slate-300">
            {reservasFiltradas.length > 0 ? reservasFiltradas.map(r => {
              const dias = calcularDias(r.fecha_inicio, r.fecha_fin);
              const mendoza = esMendoza(r.cliente_whatsapp);
              return (
                <tr key={r.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors odd:bg-[#121319]/60 even:bg-[#1E222F]">

                  <td className="p-4 font-mono font-black text-[#88BDF2]">#{r.id}</td>

                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white uppercase">{r.cliente_nombre}</span>
                      <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                        {mendoza && <AlertTriangle size={10} className="text-amber-400"/>}
                        {r.cliente_whatsapp}
                      </span>
                      {mendoza && <span className="text-[9px] text-amber-400 font-bold">📍 Local Mendoza</span>}
                    </div>
                  </td>

                  <td className="p-4 font-black uppercase text-slate-300 max-w-[140px]">
                    <span className="truncate block">{r.modelo || 'Eliminado'}</span>
                  </td>

                  <td className="p-4 text-[10px] text-slate-400">
                    <span className="block">{r.origen || 'Argentina'}</span>
                    {r.provincia && <span className="text-slate-500">{r.provincia}</span>}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col text-[10px]">
                      <span className="text-emerald-400">▶ {String(r.fecha_inicio||'').substring(0,10)}</span>
                      <span className="text-rose-400">◀ {String(r.fecha_fin||'').substring(0,10)}</span>
                    </div>
                  </td>

                  <td className="p-4 text-center font-black">{dias}</td>

                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-black text-[#88BDF2]">
                        ${parseFloat(r.monto_total_ars||0).toLocaleString('es-AR')}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        {String(r.metodo_pago||'efectivo').replace(/_/g,' ')}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <select
                      value={String(r.estado_reserva || r.estado || 'pendiente').toLowerCase()}
                      onChange={e => cambiarEstadoReserva && cambiarEstadoReserva(r.id, e.target.value)}
                      className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border bg-[#1E222F] outline-none cursor-pointer ${getBadge(r.estado_reserva || r.estado)}`}
                    >
                      <option value="pendiente">PENDIENTE</option>
                      <option value="confirmada">CONFIRMADA</option>
                      <option value="cancelada">CANCELADA</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 justify-center items-center">
                      <button onClick={() => handleWhatsApp(r)}
                        className="text-emerald-400 hover:scale-110 transition-transform" title="WhatsApp">
                        <MessageCircle size={16}/>
                      </button>
                      <button onClick={() => handleImprimirTicket(r)}
                        className="text-[#88BDF2] hover:scale-110 transition-transform" title="Imprimir Ticket">
                        <FileText size={16}/>
                      </button>
                      <button onClick={() => eliminarReserva && eliminarReserva(r.id)}
                        className="text-rose-500 hover:scale-110 transition-transform" title="Eliminar">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="9" className="p-12 text-center font-black text-slate-600 tracking-widest uppercase">
                  No hay reservas para los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
