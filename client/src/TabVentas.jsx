// client/src/TabVentas.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { FileText, MessageCircle, Trash2, Filter, AlertTriangle, Globe, MapPin, Calendar } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const LOGO_URL = 'https://res.cloudinary.com/damerwlrc/image/upload/v1780316649/logocuadrado_wgykmp.png';

const MESES_OPTS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Años generados en vivo: desde 2024 hasta el año actual + 50.
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
  const [requisitos,   setRequisitos]   = useState([]);

  // Cargamos los requisitos una vez para poder anexarlos al PDF del ticket
  useEffect(() => {
    const fetchReqs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/requisitos`);
        setRequisitos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('No se pudieron cargar los requisitos para el ticket:', err);
      }
    };
    fetchReqs();
  }, []);

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

  // Imprimir ticket individual con logo, íconos y requisitos
  const handleImprimirTicket = (r) => {
    const dias = calcularDias(r.fecha_inicio, r.fecha_fin);
    const esTarjeta = String(r.metodo_pago || '').includes('tarjeta');
    const pagoEmoji = esTarjeta ? '💳' : '💵';
    const origenEmoji = esInternacional(r) ? '🌎' : '📍';

    // Bloque de requisitos (mismos que el componente Requirements)
    const reqsHtml = requisitos.length ? `
      <div class="reqs">
        <h2>📋 Requisitos a tener en cuenta</h2>
        ${requisitos.map(req => `
          <div class="req">
            <span class="req-ico">${req.icono || '📌'}</span>
            <div class="req-body">
              <div class="req-tit">${req.titulo || ''}</div>
              <div class="req-desc">${req.descripcion || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>` : '';

    const w = window.open('', '_blank', 'width=720,height=950');
    w.document.write(`
      <html><head><title>Ticket Good Trip #${r.id}</title>
      <meta charset="utf-8"/>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000;padding:28px;max-width:620px;margin:auto}
        .logo{display:block;margin:0 auto 10px;width:110px;height:auto}
        h1{font-size:22px;text-align:center;margin:6px 0}
        .sub{text-align:center;color:#555;font-size:12px;margin-bottom:20px}
        .badge{background:#000;color:#fff;display:inline-block;padding:3px 10px;font-size:11px;margin-bottom:10px;border-radius:4px}
        .row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px dashed #ccc;font-size:13px;gap:12px}
        .row .lbl{display:flex;align-items:center;gap:7px;color:#333}
        .row .val{text-align:right;font-weight:600}
        .total{font-size:18px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:2px solid #000}
        .reqs{margin-top:28px;border-top:2px dashed #999;padding-top:16px}
        .reqs h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
        .req{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}
        .req-ico{font-size:18px;line-height:1.2;flex-shrink:0}
        .req-tit{font-size:12px;font-weight:bold;text-transform:uppercase}
        .req-desc{font-size:11px;color:#555;line-height:1.4}
        .footer{margin-top:28px;font-size:10px;color:#888;text-align:center}
        /* Barra de acciones: visible en pantalla, oculta al imprimir */
        .toolbar{display:flex;gap:12px;justify-content:center;margin-bottom:22px}
        .toolbar button{font-size:13px;font-weight:bold;padding:10px 18px;border-radius:10px;border:none;cursor:pointer}
        .btn-print{background:#88BDF2;color:#121319}
        .btn-close{background:#eee;color:#333}
        @media print{ .no-print{display:none !important} body{padding:0} }
      </style></head><body>

      <div class="toolbar no-print">
        <button class="btn-print" onclick="window.print()">⬇️ Descargar / Imprimir PDF</button>
        <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
      </div>

      <img class="logo" src="${LOGO_URL}" alt="Good Trip Cars"/>
      <h1>GOOD TRIP CARS</h1>
      <div class="sub">Mendoza, Argentina · goodtripmendoza@gmail.com</div>

      <div style="text-align:center"><span class="badge">RESERVA Nº ${r.id}</span></div>

      <div class="row"><span class="lbl">🧑 Cliente</span><span class="val">${r.cliente_nombre || '-'}</span></div>
      <div class="row"><span class="lbl">👤 WhatsApp</span><span class="val">${r.cliente_whatsapp || '-'}</span></div>
      <div class="row"><span class="lbl">🚗 Vehículo</span><span class="val">${r.modelo || 'Auto'}</span></div>
      <div class="row"><span class="lbl">${origenEmoji} Origen</span><span class="val">${r.origen || 'Argentina'}${r.provincia ? ' · '+r.provincia : ''}</span></div>
      <div class="row"><span class="lbl">🛫 Retiro</span><span class="val">${String(r.fecha_inicio||'').substring(0,10)} — ${r.lugar_retiro || '-'}</span></div>
      <div class="row"><span class="lbl">🛬 Devolución</span><span class="val">${String(r.fecha_fin||'').substring(0,10)} — ${r.lugar_devolucion || '-'}</span></div>
      <div class="row"><span class="lbl">📅 Días</span><span class="val">${dias}</span></div>
      <div class="row"><span class="lbl">${pagoEmoji} Método de Pago</span><span class="val">${String(r.metodo_pago||'efectivo').replace(/_/g,' ')}</span></div>
      <div class="row"><span class="lbl">🛡️ Garantía</span><span class="val">USD ${r.garantia_usd || 400}</span></div>

      <div class="total"><span class="lbl">💰 TOTAL</span><span>ARS $${parseFloat(r.monto_total_ars||0).toLocaleString('es-AR')}</span></div>

      <div class="row" style="margin-top:14px"><span class="lbl">🏷️ Estado</span><span class="val">${r.estado_reserva || r.estado || 'pendiente'}</span></div>

      ${reqsHtml}

      <div class="footer">Buenos vientos 🌬️ — Good Trip Mendoza</div>
      </body></html>
    `);
    w.document.close();
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
