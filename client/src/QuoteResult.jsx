// client/src/QuoteResult.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  CheckCircle, Car, MapPin, Loader2, ShieldCheck,
  BadgeDollarSign, MessageCircle, Printer, AlertTriangle
} from 'lucide-react';
import { trackLead, trackContact } from './analytics';

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

  // ── Imprimir ─────────────────────────────────────────────────────
  const imprimir = () => {
    const w = window.open('','_blank','width=700,height=900');
    w.document.write(`<html><head><title>Good Trip Presupuesto #${nro}</title>
    <style>
      body{font-family:monospace;padding:32px;max-width:600px;margin:auto}
      h1{text-align:center;margin-bottom:4px}
      .sub{text-align:center;color:#555;font-size:12px;margin-bottom:24px}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc;font-size:13px}
      .total{font-size:20px;font-weight:bold;display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:2px solid #000}
      .badge{background:#000;color:#fff;display:inline-block;padding:3px 10px;font-size:11px;margin-bottom:12px;letter-spacing:1px}
      .footer{margin-top:32px;font-size:10px;color:#888;text-align:center}
    </style></head><body>
    <h1>🚗 GOOD TRIP CARS</h1>
    <div class="sub">Mendoza, Argentina · Goodtripmendoza@gmail.com</div>
    <div class="badge">PRESUPUESTO Nº ${nro}</div>
    <div class="row"><span>Cliente</span><span>${quote.cliente_nombre||'-'}</span></div>
    <div class="row"><span>WhatsApp</span><span>${quote.cliente_whatsapp||'-'}</span></div>
    <div class="row"><span>Vehículo</span><span>${quote.auto_modelo||'Auto'}${quote.auto_patente?' · '+quote.auto_patente:''}</span></div>
    <div class="row"><span>Origen</span><span>${quote.origen||'Argentina'}${quote.provincia?' · '+quote.provincia:''}</span></div>
    <div class="row"><span>Retiro</span><span>${quote.desde} ${quote.hora_inicio}hs · ${quote.entrega}</span></div>
    <div class="row"><span>Devolución</span><span>${quote.hasta} ${quote.hora_fin}hs · ${quote.devolucion}</span></div>
    <div class="row"><span>Días</span><span>${diasTexto}</span></div>
    <div class="row"><span>Renta (${diasTexto}d × $${Math.round(precioDia).toLocaleString('es-AR')})</span><span>$${Math.round(rentaBase).toLocaleString('es-AR')}</span></div>
    ${costoRetiro>0?`<div class="row"><span>Retiro Aeropuerto</span><span>$${Math.round(costoRetiro).toLocaleString('es-AR')}</span></div>`:''}
    ${costoDevol>0?`<div class="row"><span>Devolución Aeropuerto</span><span>$${Math.round(costoDevol).toLocaleString('es-AR')}</span></div>`:''}
    ${costoSillita>0?`<div class="row"><span>Sillita Bebé</span><span>$${Math.round(costoSillita).toLocaleString('es-AR')}</span></div>`:''}
    <div class="row"><span>Lavado</span><span>$${Math.round(costoLavado).toLocaleString('es-AR')}</span></div>
    ${descPromo>0?`<div class="row"><span>Descuento ${promoTitulo||''} −${descPromo}%</span><span>−$${Math.round(descPromoArs).toLocaleString('es-AR')}</span></div>`:''}
    <div class="row"><span>Método de pago</span><span>${factorTexto}</span></div>
    <div class="total"><span>TOTAL ESTIMADO</span><span>ARS $${Math.round(montoTotal).toLocaleString('es-AR')}</span></div>
    <div class="row" style="margin-top:16px"><span>Garantía</span><span>USD ${garantiaUsd}</span></div>
    <div style="font-size:10px;color:#666;margin-top:2px">o su equivalente en pesos argentinos, al tipo de cambio vendedor del BNA al momento de la entrega del auto.</div>
    <div class="footer">Cotización estimada, no contractual. Buenos vientos 🌬️</div>
    <script>window.print();</script>
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
