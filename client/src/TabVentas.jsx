// client/src/TabVentas.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { FileText, MessageCircle, Trash2, Filter, AlertTriangle, Globe, MapPin, Calendar } from 'lucide-react';
import LOGO_TICKET from './logoTicket'; // logo embebido (base64) → siempre se imprime, sin depender de red

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MESES_OPTS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Años generados en vivo: desde 2024 hasta el año actual + 50.
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: (ANIO_ACTUAL + 50) - 2024 + 1 }, (_, i) => 2024 + i);

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function TabVentas({
  reservas = [],
  cambiarEstadoReserva,
  eliminarReserva,
}) {
  const [filtroMes,    setFiltroMes]    = useState('todos');
  const [filtroAnio,   setFiltroAnio]   = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [requisitos,   setRequisitos]   = useState([]);
  const [precios,      setPrecios]      = useState([]); // precios_mensuales → para reconstruir el desglose del ticket

  // Cargamos requisitos + precios una sola vez para armar el PDF detallado
  useEffect(() => {
    const cargar = async () => {
      try {
        const [resReqs, resPrecios] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/requisitos`),
          axios.get(`${API_BASE_URL}/api/precios-mensuales`),
        ]);
        setRequisitos(Array.isArray(resReqs.data) ? resReqs.data : []);
        setPrecios(Array.isArray(resPrecios.data) ? resPrecios.data : []);
      } catch (err) {
        console.error('No se pudieron cargar los datos para el ticket:', err);
      }
    };
    cargar();
  }, []);

  // Días con medios días según la hora — MISMA regla que el cotizador y el servidor.
  //   24h = 1 día · resto ≤3:30 → +0 · resto 4:00–7:30 → +0,5 · resto ≥8:00 → +1
  const calcularDias = (fIni, hIni, fFin, hFin) => {
    if (!fIni || !fFin) return 1;
    const limpiarFecha = (f) => String(f).split('T')[0].split(' ')[0];
    const limpiarHora  = (h) => (h ? String(h) : '10:00').slice(0, 5);
    const ini = new Date(`${limpiarFecha(fIni)}T${limpiarHora(hIni)}:00`);
    const fin = new Date(`${limpiarFecha(fFin)}T${limpiarHora(hFin)}:00`);
    const diffH = Math.max(0, Math.round((fin - ini) / 3_600_000 * 2) / 2);
    const full  = Math.floor(diffH / 24);
    const resto = diffH - full * 24;
    let extra = 0;
    if (resto >= 8)       extra = 1;
    else if (resto > 3.5) extra = 0.5;
    return Math.max(1, full + extra);
  };

  const diasTexto = (d) => (Number.isInteger(d) ? String(d) : d.toFixed(1).replace('.', ','));

  // Reconstruye el desglose de la reserva desde precios_mensuales (no se guarda en BD).
  // El TOTAL siempre es el guardado (monto_total_ars); las líneas se arman para cuadrar a ese total.
  const reconstruirDesglose = (r) => {
    const dias = calcularDias(r.fecha_inicio, r.hora_inicio, r.fecha_fin, r.hora_fin);
    const mes  = parseInt(String(r.fecha_inicio).slice(5, 7), 10);
    const anio = parseInt(String(r.fecha_inicio).slice(0, 4), 10);
    const aid  = parseInt(r.auto_id, 10);

    // Tarifa del mes exacto del auto; si no, cualquiera del auto.
    const t = precios.find(p => +p.auto_id === aid && +p.mes === mes && +p.anio === anio)
           || precios.find(p => +p.auto_id === aid)
           || {};
    const hayTarifa = num(t.precio_auto_mensual_ars) > 0;

    const precioDia = num(t.precio_auto_mensual_ars);
    const enAeroRet = String(r.lugar_retiro || '').toLowerCase().includes('aeropuerto');
    const enAeroDev = String(r.lugar_devolucion || '').toLowerCase().includes('aeropuerto');

    const rentaBase    = Math.round(precioDia * dias);
    const costoRetiro  = enAeroRet ? Math.round(num(t.cargo_retiro_aeropuerto)) : 0;
    const costoDevol   = enAeroDev ? Math.round(num(t.cargo_devolucion_aeropuerto)) : 0;
    const costoSillita = (r.sillita ? 1 : 0) * Math.round(num(t.precio_sillita));
    const costoLavado  = Math.round(num(t.precio_lavado));

    const itemsSubtotal = rentaBase + costoRetiro + costoDevol + costoSillita + costoLavado;
    const total  = Math.round(num(r.monto_total_ars));
    // Lo que el total ya incluye y no está en las líneas: recargo de tarjeta (+) o descuento de promo (−).
    const ajuste = total - itemsSubtotal;

    return { dias, precioDia, rentaBase, costoRetiro, costoDevol, costoSillita, costoLavado, total, ajuste, hayTarifa };
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

  // Imprimir ticket individual: desglose detallado, garantía aparte y requisitos al pie (1 hoja).
  const handleImprimirTicket = (r) => {
    const money = (v) => '$' + Math.round(num(v)).toLocaleString('es-AR');
    const svg = (inner) => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
    const IC = {
      user:    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      phone:   '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
      car:     '<path d="M5 17H3v-4l2-5h12l2 5v4h-2"/><path d="M5 11h14"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
      pin:     '<path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
      globe:   '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
      planeUp: '<path d="M2 22h20"/><path d="m5 18 14-5.5a2 2 0 0 0-1.4-3.7L13 10 8 3 6 3.7l3 6.3-4 1.2-2-1.6L1.5 11z"/>',
      planeDn: '<path d="M2 22h20"/><path d="M17.8 19.8 22 18a2 2 0 0 0 0-3.8L7 9 6 3 4 3.7 5 11l-3.5 1.3L0 11l-.8.7 3 4z"/>',
      cal:     '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      card:    '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
      baby:    '<circle cx="12" cy="6" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/>',
      drop:    '<path d="M12 2.7S6 9 6 14a6 6 0 0 0 12 0c0-5-6-11.3-6-11.3z"/>',
      shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      dollar:  '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      tag:     '<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
      tag2:    '<path d="M9 5H4v5l9 9 5-5-9-9z"/><circle cx="6.5" cy="7.5" r="1"/>',
      clip:    '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/>',
    };

    const d = reconstruirDesglose(r);
    const internac = esInternacional(r);
    const esTarjeta = String(r.metodo_pago || '').includes('tarjeta');
    const planTxt = { tarjeta_1: '1 pago', tarjeta_3: '3 cuotas', tarjeta_6: '6 cuotas' }[r.metodo_pago] || '';
    const metodoTxt = {
      efectivo:'Efectivo / Transferencia / Débito',
      tarjeta_1:'Tarjeta crédito · 1 pago',
      tarjeta_3:'Tarjeta crédito · 3 cuotas',
      tarjeta_6:'Tarjeta crédito · 6 cuotas',
    }[String(r.metodo_pago || 'efectivo')] || String(r.metodo_pago || 'efectivo').replace(/_/g, ' ');

    const fila = (ic, label, valor, cls = '') =>
      `<div class="brk ${cls}"><span class="bl">${svg(ic)}<span>${label}</span></span><span class="bv">${cls === 'neg' ? '− ' : ''}${money(valor)}</span></div>`;

    // Desglose: si encontramos la tarifa reconstruimos línea por línea; si no, renglón único.
    let desgloseHtml;
    if (d.hayTarifa) {
      desgloseHtml =
        fila(IC.car, `Renta · ${diasTexto(d.dias)} día${d.dias === 1 ? '' : 's'} × ${money(d.precioDia)}`, d.rentaBase) +
        (d.costoRetiro  > 0 ? fila(IC.planeUp, 'Retiro en aeropuerto', d.costoRetiro) : '') +
        (d.costoDevol   > 0 ? fila(IC.planeDn, 'Devolución en aeropuerto', d.costoDevol) : '') +
        (d.costoSillita > 0 ? fila(IC.baby, 'Sillita de bebé', d.costoSillita) : '') +
        (d.costoLavado  > 0 ? fila(IC.drop, 'Lavado e higiene', d.costoLavado) : '');
      // Ajuste para cuadrar al total guardado (recargo tarjeta o descuento)
      if (d.ajuste >= 1) {
        const lbl = esTarjeta ? `Recargo financiación${planTxt ? ' · ' + planTxt : ''}` : 'Otros cargos';
        desgloseHtml += fila(IC.card, lbl, d.ajuste);
      } else if (d.ajuste <= -1) {
        desgloseHtml += fila(IC.tag2, 'Descuento aplicado', -d.ajuste, 'neg');
      }
    } else {
      desgloseHtml = fila(IC.car, `Renta y servicios · ${diasTexto(d.dias)} día${d.dias === 1 ? '' : 's'}`, d.total) +
        `<div class="nota-mini">Detalle por ítem no disponible para esta reserva.</div>`;
    }

    const garantiaUsd = Math.round(num(r.garantia_usd)) || 400;
    const tasa        = Math.round(num(r.tasa_dolar_usada));
    const garantiaArs = tasa > 0 ? garantiaUsd * tasa : 0;

    const reqsHtml = requisitos.length ? `
      <div class="reqs">
        <h2>${svg(IC.clip)} Requisitos a tener en cuenta</h2>
        <div class="reqs-grid">
          ${requisitos.map(req => `
            <div class="req">
              <span class="req-ico">${req.icono || '📌'}</span>
              <div class="req-body">
                <div class="req-tit">${req.titulo || ''}</div>
                <div class="req-desc">${req.descripcion || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : '';

    const grStar = '<svg viewBox="0 0 24 24" width="13" height="13" fill="#F59E0B"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
    const grGoogle = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
    const reviewsHtml = `<div class="gr">${grGoogle}<span class="gr-stars">${grStar.repeat(5)}</span><span class="gr-num">5,0</span><span class="gr-lbl">Calificación en Google Reviews</span></div>`;

    const w = window.open('', '_blank', 'width=760,height=1000');
    w.document.write(`
      <html><head><title>Ticket Good Trip #${r.id}</title>
      <meta charset="utf-8"/>
      <style>
        :root{ --azul:#2563EB; --tinta:#0F172A; --gris:#64748B; --linea:#E2E8F0; }
        *{ box-sizing:border-box; }
        body{ font-family:'Segoe UI',Arial,Helvetica,sans-serif; background:#fff; color:var(--tinta); margin:0; padding:24px; }
        .hoja{ max-width:680px; margin:auto; }
        .head{ display:flex; align-items:center; gap:14px; border-bottom:2px solid var(--tinta); padding-bottom:12px; }
        .logo{ height:48px; width:auto; max-width:120px; object-fit:contain; }
        .head h1{ font-size:20px; margin:0; letter-spacing:.5px; }
        .head .sub{ font-size:11px; color:var(--gris); margin-top:2px; }
        .nro{ margin-left:auto; text-align:right; }
        .nro .lab{ font-size:9px; letter-spacing:2px; color:var(--gris); text-transform:uppercase; }
        .nro .num{ font-size:22px; font-weight:800; color:var(--azul); }
        .grid{ display:grid; grid-template-columns:1fr 1fr; gap:6px 22px; margin:16px 0; }
        .it{ display:flex; align-items:center; gap:10px; padding:5px 0; border-bottom:1px solid var(--linea); font-size:12px; }
        .it .k{ display:flex; align-items:center; gap:7px; color:var(--gris); width:96px; flex-shrink:0; }
        .it .v{ font-weight:600; }
        .it.full{ grid-column:1 / -1; }
        .sec-tit{ font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:var(--gris); margin:18px 0 8px; display:flex; align-items:center; gap:7px; }
        .brk{ display:flex; align-items:center; justify-content:space-between; padding:7px 2px; border-bottom:1px dashed var(--linea); font-size:13px; }
        .brk .bl{ display:flex; align-items:center; gap:8px; color:#334155; }
        .brk .bv{ font-weight:600; font-variant-numeric:tabular-nums; }
        .brk.neg .bv,.brk.neg .bl{ color:#16A34A; }
        .nota-mini{ font-size:10px; color:var(--gris); font-style:italic; padding:6px 2px; }
        .total{ display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding:12px 14px; background:var(--tinta); color:#fff; border-radius:10px; }
        .total .tl{ display:flex; align-items:center; gap:8px; font-size:11px; letter-spacing:2px; text-transform:uppercase; }
        .total .tv{ font-size:22px; font-weight:800; font-variant-numeric:tabular-nums; }
        .gar{ margin-top:12px; border:1px solid var(--linea); border-left:4px solid var(--azul); border-radius:8px; padding:11px 14px; background:#F8FAFC; }
        .gar .gt{ display:flex; align-items:center; justify-content:space-between; font-size:13px; font-weight:700; }
        .gar .gt .gl{ display:flex; align-items:center; gap:8px; color:var(--tinta); }
        .gar .gv{ color:var(--azul); }
        .gar .gd{ font-size:10px; color:var(--gris); margin-top:4px; line-height:1.4; }
        .gar .gd strong{ color:#334155; }
        .reqs{ margin-top:20px; border-top:2px dashed #CBD5E1; padding-top:14px; }
        .reqs h2{ font-size:12px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 10px; display:flex; align-items:center; gap:7px; color:var(--tinta); }
        .reqs-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }
        .req{ display:flex; gap:9px; align-items:flex-start; }
        .req-ico{ font-size:15px; line-height:1.2; flex-shrink:0; }
        .req-tit{ font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.3px; }
        .req-desc{ font-size:9.5px; color:var(--gris); line-height:1.35; margin-top:1px; }
        .gr{ display:flex; align-items:center; justify-content:center; gap:0; margin:14px 0 2px; padding:8px 12px; border:1px solid var(--linea); border-radius:10px; background:#F8FAFC; }
        .gr-stars{ display:inline-flex; gap:1px; margin:0 8px 0 6px; }
        .gr-num{ font-weight:800; font-size:13px; color:var(--tinta); }
        .gr-lbl{ font-size:10px; color:var(--gris); text-transform:uppercase; letter-spacing:1px; font-weight:700; margin-left:9px; }
        .footer{ margin-top:18px; font-size:10px; color:var(--gris); text-align:center; }
        .toolbar{ display:flex; gap:12px; justify-content:center; margin-bottom:20px; }
        .toolbar button{ font-size:13px; font-weight:700; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; }
        .btn-print{ background:var(--azul); color:#fff; }
        .btn-close{ background:#eef2f7; color:#334155; }
        @page{ size:A4; margin:12mm; }
        @media print{
          .no-print{ display:none !important; }
          body{ padding:0; }
          .total,.gar,.gr{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        }
      </style></head><body>
      <div class="hoja">
        <div class="toolbar no-print">
          <button class="btn-print" onclick="window.print()">⬇ Descargar / Imprimir PDF</button>
          <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
        </div>

        <div class="head">
          <img class="logo" src="${LOGO_TICKET}" alt="Good Trip Cars"/>
          <div>
            <h1>GOOD TRIP CARS</h1>
            <div class="sub">Mendoza, Argentina · goodtripmendoza@gmail.com</div>
          </div>
          <div class="nro"><div class="lab">Reserva Nº</div><div class="num">${r.id}</div></div>
        </div>

        ${reviewsHtml}

        <div class="grid">
          <div class="it"><span class="k">${svg(IC.user)} Cliente</span><span class="v">${r.cliente_nombre || '-'}</span></div>
          <div class="it"><span class="k">${svg(IC.phone)} WhatsApp</span><span class="v">${r.cliente_whatsapp || '-'}</span></div>
          <div class="it full"><span class="k">${svg(IC.car)} Vehículo</span><span class="v">${r.modelo || 'Auto'}${r.patente ? ' · ' + r.patente : ''}</span></div>
          <div class="it"><span class="k">${svg(internac ? IC.globe : IC.pin)} Origen</span><span class="v">${r.origen || 'Argentina'}${r.provincia ? ' · ' + r.provincia : ''}</span></div>
          <div class="it"><span class="k">${svg(IC.cal)} Días</span><span class="v">${diasTexto(d.dias)}</span></div>
          <div class="it full"><span class="k">${svg(IC.planeUp)} Retiro</span><span class="v">${String(r.fecha_inicio || '').substring(0, 10)} ${String(r.hora_inicio || '').slice(0,5)} · ${r.lugar_retiro || '-'}</span></div>
          <div class="it full"><span class="k">${svg(IC.planeDn)} Devolución</span><span class="v">${String(r.fecha_fin || '').substring(0, 10)} ${String(r.hora_fin || '').slice(0,5)} · ${r.lugar_devolucion || '-'}</span></div>
          <div class="it"><span class="k">${svg(IC.card)} Pago</span><span class="v">${metodoTxt}</span></div>
          <div class="it"><span class="k">${svg(IC.tag)} Estado</span><span class="v" style="text-transform:capitalize">${r.estado_reserva || r.estado || 'pendiente'}</span></div>
        </div>

        <div class="sec-tit">${svg(IC.dollar)} Detalle de la cotización</div>
        ${desgloseHtml}

        <div class="total">
          <span class="tl">${svg(IC.dollar)} Total de la reserva</span>
          <span class="tv">ARS ${d.total.toLocaleString('es-AR')}</span>
        </div>

        <div class="gar">
          <div class="gt">
            <span class="gl">${svg(IC.shield)} Garantía / Franquicia</span>
            <span class="gv">USD ${garantiaUsd}${garantiaArs ? ' · ARS $' + garantiaArs.toLocaleString('es-AR') : ''}</span>
          </div>
          <div class="gd">
            <strong>No forma parte del total de la reserva.</strong> Se entrega en efectivo, transferencia o dólares al
            tipo de cambio vendedor del BNA al momento de la entrega del auto, y se reintegra al devolver el vehículo en igual condición.
          </div>
        </div>

        ${reqsHtml}

        <div class="footer">Cotización sujeta a confirmación. Buenos vientos 🌬️ — Good Trip Mendoza</div>
      </div>
      </body></html>
    `);
    w.document.close();
  };

  // WhatsApp al cliente
  const handleWhatsApp = (r) => {
    const dias = calcularDias(r.fecha_inicio, r.hora_inicio, r.fecha_fin, r.hora_fin);
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
            const dias = calcularDias(r.fecha_inicio, r.hora_inicio, r.fecha_fin, r.hora_fin);
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
