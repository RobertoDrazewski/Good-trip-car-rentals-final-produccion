// client/src/QuoteResult.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  CheckCircle, Car, MapPin, Loader2, ShieldCheck,
  BadgeDollarSign, MessageCircle, Printer, AlertTriangle
} from 'lucide-react';
import { trackLead, trackContact } from './analytics';
import LOGO_TICKET from './logoTicket'; // logo embebido (base64) → siempre imprime, sin depender de red

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function QuoteResult({ quote, onClose }) {
  const [confirmado, setConfirmado] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [leido,      setLeido]      = useState(false);
  const [nro] = useState(Math.floor(Math.random()*90000)+10000);

  if (!quote || !quote.enviado) return null;

  // ── Sanitizar valores ────────────────────────────────────────────
  const dias        = Math.max(1, parseFloat(quote.dias)||1);
  const diasTexto   = Number.isInteger(dias) ? String(dias) : dias.toFixed(1).replace('.', ',');
  const precioDia   = parseFloat(quote.precio_renta_mes_ars||0);
  const rentaBase   = precioDia * dias;
  const costoRetiro = parseFloat(quote.costo_retiro_aero||0);
  const costoDevol  = parseFloat(quote.costo_devolucion_aero||0);
  const costoSillita= parseFloat(quote.costo_sillita||0);
  const costoLavado = parseFloat(quote.costo_lavado||0);
  const montoTotal  = parseFloat(quote.monto_total_ars||0);
  const descPromo   = parseFloat(quote.descuento_promo||0);
  const descPromoArs= parseFloat(quote.descuento_promo_ars||0);
  const promoTitulo = quote.promo_titulo || '';
  const garantiaUsd = parseFloat(quote.garantia_usd||400);
  const cotizacion  = parseFloat(quote.cotizacion||1450);
  // Garantía en ARS = USD × cotización (consistente con el panel de control)
  const garantiaArs = garantiaUsd * cotizacion;

  const factorTexto = quote.metodo_pago==='tarjeta_1' ? 'Tarjeta crédito — 1 pago'
                    : quote.metodo_pago==='tarjeta_3' ? 'Tarjeta crédito — 3 cuotas'
                    : quote.metodo_pago==='tarjeta_6' ? 'Tarjeta crédito — 6 cuotas'
                    : 'Efectivo / Transferencia / Débito';

  const recargo = montoTotal - (rentaBase + costoRetiro + costoDevol + costoSillita + costoLavado);

  // ── Imprimir presupuesto (mismo diseño profesional que el ticket de reserva) ──
  const imprimir = () => {
    const money = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('es-AR');
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
    };

    const internac = (quote.origen && quote.origen !== 'Argentina');
    const esTarjeta = String(quote.metodo_pago || '').includes('tarjeta');
    const planTxt = { tarjeta_1: '1 pago', tarjeta_3: '3 cuotas', tarjeta_6: '6 cuotas' }[quote.metodo_pago] || '';

    // Recargo de financiación = total − (ítems − descuento). Cuadra exacto al total.
    const itemsGross  = rentaBase + costoRetiro + costoDevol + costoSillita + costoLavado;
    const recargoFin  = Math.round(montoTotal - (itemsGross - descPromoArs));

    const fila = (ic, label, valor, cls = '') =>
      `<div class="brk ${cls}"><span class="bl">${svg(ic)}<span>${label}</span></span><span class="bv">${cls === 'neg' ? '− ' : ''}${money(valor)}</span></div>`;

    let desgloseHtml =
      fila(IC.car, `Renta · ${diasTexto} día${dias === 1 ? '' : 's'} × ${money(precioDia)}`, rentaBase) +
      (costoRetiro  > 0 ? fila(IC.planeUp, 'Retiro en aeropuerto', costoRetiro) : '') +
      (costoDevol   > 0 ? fila(IC.planeDn, 'Devolución en aeropuerto', costoDevol) : '') +
      (costoSillita > 0 ? fila(IC.baby, 'Sillita de bebé', costoSillita) : '') +
      (costoLavado  > 0 ? fila(IC.drop, 'Lavado e higiene', costoLavado) : '') +
      (descPromo    > 0 ? fila(IC.tag2, `Descuento${promoTitulo ? ' · ' + promoTitulo : ''} (−${descPromo}%)`, descPromoArs, 'neg') : '') +
      (esTarjeta && recargoFin >= 1 ? fila(IC.card, `Recargo financiación${planTxt ? ' · ' + planTxt : ''}`, recargoFin) : '');

    const grStar = '<svg viewBox="0 0 24 24" width="13" height="13" fill="#F59E0B"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
    const grGoogle = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
    const reviewsHtml = `<div class="gr">${grGoogle}<span class="gr-stars">${grStar.repeat(5)}</span><span class="gr-num">5,0</span><span class="gr-lbl">Calificación en Google Reviews</span></div>`;

    const w = window.open('', '_blank', 'width=760,height=1000');
    w.document.write(`
      <html><head><title>Good Trip · Presupuesto #${nro}</title>
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
        .total{ display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding:12px 14px; background:var(--tinta); color:#fff; border-radius:10px; }
        .total .tl{ display:flex; flex-direction:column; gap:2px; }
        .total .tl .a{ display:flex; align-items:center; gap:8px; font-size:11px; letter-spacing:2px; text-transform:uppercase; }
        .total .tl .b{ font-size:9px; color:#94A3B8; letter-spacing:1px; text-transform:uppercase; }
        .total .tv{ font-size:22px; font-weight:800; font-variant-numeric:tabular-nums; }
        .gar{ margin-top:12px; border:1px solid var(--linea); border-left:4px solid var(--azul); border-radius:8px; padding:11px 14px; background:#F8FAFC; }
        .gar .gt{ display:flex; align-items:center; justify-content:space-between; font-size:13px; font-weight:700; }
        .gar .gt .gl{ display:flex; align-items:center; gap:8px; color:var(--tinta); }
        .gar .gv{ color:var(--azul); }
        .gar .gd{ font-size:10px; color:var(--gris); margin-top:4px; line-height:1.4; }
        .gar .gd strong{ color:#334155; }
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
        @media print{ .no-print{ display:none !important; } body{ padding:0; } .total,.gar,.gr{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
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
          <div class="nro"><div class="lab">Presupuesto Nº</div><div class="num">${nro}</div></div>
        </div>

        ${reviewsHtml}

        <div class="grid">
          <div class="it"><span class="k">${svg(IC.user)} Cliente</span><span class="v">${quote.cliente_nombre || '-'}</span></div>
          <div class="it"><span class="k">${svg(IC.phone)} WhatsApp</span><span class="v">${quote.cliente_whatsapp || '-'}</span></div>
          <div class="it full"><span class="k">${svg(IC.car)} Vehículo</span><span class="v">${quote.auto_modelo || 'Auto'}${quote.auto_patente ? ' · ' + quote.auto_patente : ''}</span></div>
          <div class="it"><span class="k">${svg(internac ? IC.globe : IC.pin)} Origen</span><span class="v">${quote.origen || 'Argentina'}${quote.provincia ? ' · ' + quote.provincia : ''}</span></div>
          <div class="it"><span class="k">${svg(IC.cal)} Días</span><span class="v">${diasTexto}</span></div>
          <div class="it full"><span class="k">${svg(IC.planeUp)} Retiro</span><span class="v">${quote.desde} ${quote.hora_inicio || ''} · ${quote.entrega}</span></div>
          <div class="it full"><span class="k">${svg(IC.planeDn)} Devolución</span><span class="v">${quote.hasta} ${quote.hora_fin || ''} · ${quote.devolucion}</span></div>
          <div class="it"><span class="k">${svg(IC.card)} Pago</span><span class="v">${factorTexto}</span></div>
        </div>

        <div class="sec-tit">${svg(IC.dollar)} Detalle de la cotización</div>
        ${desgloseHtml}

        <div class="total">
          <span class="tl"><span class="a">${svg(IC.dollar)} Total estimado</span><span class="b">${factorTexto}</span></span>
          <span class="tv">ARS ${Math.round(montoTotal).toLocaleString('es-AR')}</span>
        </div>

        <div class="gar">
          <div class="gt">
            <span class="gl">${svg(IC.shield)} Garantía / Franquicia</span>
            <span class="gv">USD ${garantiaUsd}${garantiaArs ? ' · ARS $' + Math.round(garantiaArs).toLocaleString('es-AR') : ''}</span>
          </div>
          <div class="gd">
            <strong>No forma parte del total de la reserva.</strong> Se entrega en efectivo, transferencia o dólares al
            tipo de cambio vendedor del BNA al momento de la entrega del auto, y se reintegra al devolver el vehículo en igual condición.
          </div>
        </div>

        <div class="footer">Cotización estimada, no contractual. Buenos vientos 🌬️ — Good Trip Mendoza</div>
      </div>
      </body></html>`);
    w.document.close();
  };

  // ── WhatsApp ─────────────────────────────────────────────────────
  const enviarWA = () => {
    trackContact({ method: 'whatsapp', source: 'quote_summary' });
    const tel = String(quote.cliente_whatsapp||'').replace(/\D/g,'');
    const fmt = tel.startsWith('54') ? tel : `54${tel}`;
    const msg = encodeURIComponent(
      `Hola ${quote.cliente_nombre}! 👋 Tu presupuesto Good Trip Nº${nro} está listo:\n\n` +
      `🚗 ${quote.auto_modelo}\n` +
      `📅 ${quote.desde} → ${quote.hasta} (${diasTexto} días)\n` +
      `📍 Retiro: ${quote.entrega}\n` +
      `📍 Devolución: ${quote.devolucion}\n\n` +
      `💰 Total: ARS $${Math.round(montoTotal).toLocaleString('es-AR')}\n` +
      `🛡️ Garantía: USD ${garantiaUsd}\n\n` +
      `Requisitos: mayor de 21 años, licencia vigente y garantía (efectivo, transferencia o dólares).\n¡Muchas gracias! 🙌`
    );
    window.open(`https://wa.me/${fmt}?text=${msg}`, '_blank');
  };

  // ── WhatsApp Good Trip (se abre automáticamente al confirmar) ────
  const abrirWAGoodTrip = () => {
    const msg = encodeURIComponent(
      `🚨 NUEVA RESERVA #${nro}\n\n` +
      `👤 Cliente: ${quote.cliente_nombre}\n` +
      `📱 WhatsApp: ${quote.cliente_whatsapp}\n` +
      `🚗 Vehículo: ${quote.auto_modelo}\n` +
      `📅 Retiro: ${quote.desde} ${quote.hora_inicio}hs · ${quote.entrega}\n` +
      `📅 Devolución: ${quote.hasta} ${quote.hora_fin}hs · ${quote.devolucion}\n` +
      `💰 Total: ARS $${Math.round(montoTotal).toLocaleString('es-AR')}\n` +
      `🛡️ Garantía: USD ${garantiaUsd}\n` +
      `💳 Pago: ${factorTexto}`
    );
    // FIX: faltaba el "9" de la numeración móvil argentina (54 9 ...).
    window.open(`https://wa.me/5492612764618?text=${msg}`, '_blank');
  };

  // ── Confirmar reserva ────────────────────────────────────────────
  const confirmar = async () => {
    if (!leido) { alert('Debés aceptar los Requisitos antes de continuar.'); return; }
    setLoading(true);
    try {
      const payload = {
        auto_id:          parseInt(quote.auto_id,10),
        cliente_nombre:   quote.cliente_nombre,
        cliente_whatsapp: quote.cliente_whatsapp,
        fecha_inicio:     quote.desde,
        hora_inicio:      quote.hora_inicio||'10:00:00',
        fecha_fin:        quote.hasta,
        hora_fin:         quote.hora_fin||'10:00:00',
        lugar_retiro:     quote.entrega,
        lugar_devolucion: quote.devolucion,
        sillita:          !!quote.sillita,
        metodo_pago:      quote.metodo_pago,
        origen:           quote.origen||'Argentina',
        provincia:        quote.provincia||'',
        monto_total_ars:  Math.round(montoTotal),
        descuento_promo:  descPromo,
        tasa_dolar_usada: cotizacion,
        garantia_usd:     garantiaUsd,
      };
      const res = await axios.post(`${API}/api/reservas`, payload);
      if (res.data.success) {
        setConfirmado(true);
        // 📊 Conversión principal (Meta Pixel "Lead" + GA4/Ads "generate_lead")
        trackLead({
          value: Math.round(montoTotal),
          currency: 'ARS',
          content_name: quote.auto_modelo || 'Auto',
          dias: diasTexto,
        });
        // Abrir WhatsApp de Good Trip automáticamente con los datos del lead
        setTimeout(() => abrirWAGoodTrip(), 800);
      }
      else alert('Hubo un problema. Intentá nuevamente.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error||'Error de comunicación con el servidor.');
    } finally { setLoading(false); }
  };

  // ── Pantalla de éxito ────────────────────────────────────────────
  if (confirmado) return (
    <div className="bg-[#1E222F] border border-emerald-500/30 rounded-[2.5rem] p-10 text-center space-y-5 shadow-2xl">
      <CheckCircle className="text-emerald-400 mx-auto" size={64} strokeWidth={1.5}/>
      <h3 className="text-2xl font-black text-white uppercase">¡Solicitud Registrada!</h3>
      <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
        Tu solicitud para el <strong className="text-white">{quote.auto_modelo}</strong> fue registrada correctamente.
        Un asesor te contactará al <strong>{quote.cliente_whatsapp}</strong> a la brevedad.
      </p>
      <div className="bg-[#121319]/50 px-6 py-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 inline-block">
        Nº DE GESTIÓN: #{nro}
      </div>
      <div className="flex gap-3 justify-center mt-4">
        <button onClick={enviarWA}
          className="flex items-center gap-2 bg-emerald-500 text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition-colors">
          <MessageCircle size={14}/> Enviar resumen por WhatsApp
        </button>
        <button onClick={imprimir}
          className="flex items-center gap-2 bg-slate-700 text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-slate-600 transition-colors">
          <Printer size={14}/> Imprimir ticket
        </button>
      </div>
      {typeof onClose==='function' && (
        <button onClick={onClose} className="mt-4 text-xs text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors block mx-auto">
          Cerrar
        </button>
      )}
    </div>
  );

  // ── Vista principal ──────────────────────────────────────────────
  return (
    <div className="bg-[#1E222F] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-black text-[#88BDF2] uppercase tracking-tight">Presupuesto Calculado</h3>
        <p className="text-xs text-slate-400 mt-1">Revisá el desglose antes de confirmar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* IZQUIERDA */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
            <Car size={13}/> Vehículo e Itinerario
          </h4>
          <div className="bg-[#121319]/50 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Vehículo</p>
            <p className="font-bold text-white uppercase">{quote.auto_modelo} {quote.auto_patente&&<span className="text-slate-400 font-mono text-[10px]">· {quote.auto_patente}</span>}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Cliente</p>
            <p className="font-bold text-slate-300 uppercase">{quote.cliente_nombre}</p>
            {quote.origen&&(
              <>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Origen</p>
                <p className="text-slate-300">{quote.origen}{quote.provincia&&` · ${quote.provincia}`}</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Retiro', color:'text-emerald-400', lugar:quote.entrega, fecha:quote.desde, hora:quote.hora_inicio},
              {label:'Devolución', color:'text-amber-400', lugar:quote.devolucion, fecha:quote.hasta, hora:quote.hora_fin},
            ].map(f=>(
              <div key={f.label} className="bg-[#121319]/50 p-4 rounded-xl border border-slate-800 text-xs">
                <p className={`text-[10px] ${f.color} uppercase font-black tracking-widest mb-1 flex items-center gap-1`}>
                  <MapPin size={9}/> {f.label}
                </p>
                <p className="text-white font-bold uppercase truncate">{f.lugar}</p>
                <p className="text-slate-400 text-[10px] mt-1">{f.fecha} · {f.hora} hs</p>
              </div>
            ))}
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs">
            <p className="text-[10px] text-rose-400 uppercase font-black tracking-widest flex items-center gap-1 mb-1.5">
              <ShieldCheck size={11}/> Garantía / Franquicia
            </p>
            <p className="text-slate-300 leading-relaxed">
              Garantía de <strong className="text-white">USD {garantiaUsd}</strong>
              {' '}o su equivalente en pesos argentinos, al tipo de cambio vendedor del BNA al momento de la entrega del auto.
              Se entrega en efectivo, transferencia o dólares y se reintegra al devolver el vehículo en igual condición.
            </p>
          </div>

          {quote.esMendoza&&(
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-400 font-bold">
              <AlertTriangle size={13}/> Teléfono local Mendoza — ¡cliente potencial de la zona!
            </div>
          )}
        </div>

        {/* DERECHA */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
            <BadgeDollarSign size={13}/> Desglose Comercial
          </h4>

          <div className="bg-[#121319]/50 p-5 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Renta Base ({diasTexto}d × ${Math.round(precioDia).toLocaleString('es-AR')}):</span>
              <span className="text-white font-bold">${Math.round(rentaBase).toLocaleString('es-AR')}</span>
            </div>
            {costoRetiro>0&&(
              <div className="flex justify-between text-slate-400">
                <span>Retiro Aeropuerto:</span>
                <span className="text-white font-bold">${Math.round(costoRetiro).toLocaleString('es-AR')}</span>
              </div>
            )}
            {costoDevol>0&&(
              <div className="flex justify-between text-slate-400">
                <span>Devolución Aeropuerto:</span>
                <span className="text-white font-bold">${Math.round(costoDevol).toLocaleString('es-AR')}</span>
              </div>
            )}
            {costoSillita>0&&(
              <div className="flex justify-between text-slate-400">
                <span>Sillita Bebé:</span>
                <span className="text-white font-bold">${Math.round(costoSillita).toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400 pb-2 border-b border-slate-800/50">
              <span>Lavado e Higiene:</span>
              <span className="text-white font-bold">${Math.round(costoLavado).toLocaleString('es-AR')}</span>
            </div>
            {descPromo > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold pb-2 border-b border-slate-800/50">
                <span>Descuento{promoTitulo ? ` (${promoTitulo})` : ''} −{descPromo}%:</span>
                <span>−${Math.round(descPromoArs).toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="pt-2 flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <span className="text-[9px] text-slate-500 font-sans uppercase tracking-widest font-black">Total Estimado</span>
                <span className="text-2xl text-[#88BDF2] font-black">ARS ${Math.round(montoTotal).toLocaleString('es-AR')}</span>
              </div>
              <span className="text-right text-[9px] text-slate-500 font-sans uppercase">{factorTexto}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 font-sans">
              <label className="flex items-start gap-2 bg-[#1E222F] border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
                <input type="checkbox" className="mt-0.5 accent-[#88BDF2]" checked={leido} onChange={e=>setLeido(e.target.checked)}/>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Acepto los <span className="text-[#88BDF2] font-bold underline">Requisitos</span>: mayor de 21 años, licencia vigente y garantía (efectivo, transferencia o dólares).
                </span>
              </label>

              <button onClick={confirmar} disabled={loading}
                className="w-full bg-[#88BDF2] text-[#121319] font-black py-4 rounded-xl uppercase text-[11px] tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed">
                {loading?<Loader2 className="animate-spin" size={16}/>:'CONFIRMAR Y SOLICITAR RESERVA'}
              </button>

              <div className="flex gap-2">
                <button onClick={imprimir}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-700 text-slate-400 text-[10px] font-black py-2.5 rounded-xl hover:border-slate-500 hover:text-white transition-colors uppercase">
                  <Printer size={11}/> Imprimir
                </button>
                <button onClick={enviarWA}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-700/40 text-emerald-400 text-[10px] font-black py-2.5 rounded-xl hover:border-emerald-500 transition-colors uppercase">
                  <MessageCircle size={11}/> WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
