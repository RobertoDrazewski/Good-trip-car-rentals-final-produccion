// client/src/BookingForm.jsx — v4
import React, { useState, useEffect } from 'react';
import { Baby, Loader2, Car, Info, AlertTriangle, MessageCircle, Globe, Calendar, Cog, User, Phone, MapPin } from 'lucide-react';
import { trackQuote, trackContact } from './analytics';

const PAISES = [
  "Argentina","Chile","Brasil","Uruguay","Bolivia","Paraguay","Perú",
  "Colombia","Venezuela","Ecuador","México","Estados Unidos","Canadá",
  "España","Francia","Italia","Alemania","Reino Unido","Otro País"
];
const PROVINCIAS_AR = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe",
  "Santiago del Estero","Tierra del Fuego","Tucumán"
];
const HORAS = [];
for (let h=0;h<24;h++) for(let m=0;m<60;m+=30) HORAS.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
const HOY = new Date().toISOString().split('T')[0];

const calcDias = (d1,h1,d2,h2) => {
  const ini = new Date(`${d1}T${h1}:00`);
  const fin = new Date(`${d2}T${h2}:00`);
  const diffH = Math.max(0, Math.round((fin-ini)/3_600_000 * 2) / 2);
  const full  = Math.floor(diffH / 24);
  const resto = diffH - full * 24;
  let extra = 0;
  if (resto >= 8)      extra = 1;
  else if (resto > 3.5) extra = 0.5;
  return Math.max(1, full + extra);
};
const esMendoza = w => { const t=String(w||'').replace(/\D/g,''); return t.startsWith('261')||t.startsWith('54261'); };

export default function BookingForm({ autos=[], tarifas=[], reservas=[], promos=[], onQuoteGenerated }) {
  const [loading, setLoading]         = useState(false);
  const [ocupado, setOcupado]         = useState(null);
  const [form, setForm] = useState({
    auto_id:'', cliente_nombre:'', cliente_whatsapp:'',
    desde:HOY, hora_inicio:'10:00', hasta:HOY, hora_fin:'10:00',
    entrega:'Mendoza (Microcentro)', devolucion:'Mendoza (Microcentro)',
    sillita:false, metodo_pago:'efectivo', origen:'Argentina', provincia:'Mendoza',
  });

  const set = e => { const {name,value}=e.target; setForm(p=>({...p,[name]:value})); };

  const setOrigen = e => {
    const value = e.target.value;
    setForm(p => ({ ...p, origen: value, provincia: value === 'Argentina' ? (p.provincia || 'Mendoza') : '' }));
  };

  const onChangeDesde = e => {
    const v = e.target.value;
    setForm(p => ({ ...p, desde: v, hasta: (!p.hasta || p.hasta < v) ? v : p.hasta }));
  };

  const abrirCalendario = e => { try { e.currentTarget.showPicker(); } catch (_) {} };

  useEffect(() => {
    const onSeleccionarVehiculo = (e) => {
      const autoId = e?.detail?.autoId;
      if (autoId === undefined || autoId === null) return;
      setForm(p => ({ ...p, auto_id: String(autoId) }));
    };
    window.addEventListener('autoSeleccionarVehiculo', onSeleccionarVehiculo);
    return () => window.removeEventListener('autoSeleccionarVehiculo', onSeleccionarVehiculo);
  }, []);

  useEffect(() => {
    if (!form.auto_id||!form.desde||!form.hasta) { setOcupado(null); return; }
    const aid = parseInt(form.auto_id,10);
    const autoSel = autos.find(a => parseInt(a.id,10)===aid);
    const enTaller = autoSel && !(autoSel.estado?.toLowerCase() === 'disponible' || autoSel.estado === 'Disponible');
    if (enTaller) { setOcupado({ porMantenimiento: true }); return; }

    const r = reservas.find(r => {
      if (parseInt(r.auto_id,10)!==aid) return false;
      const est=String(r.estado_reserva||'').toLowerCase();
      if (!['confirmada','confirmado','contratado'].includes(est)) return false;
      const ri=String(r.fecha_inicio).split('T')[0].split(' ')[0];
      const rf=String(r.fecha_fin).split('T')[0].split(' ')[0];
      return !(form.hasta<ri||form.desde>rf);
    });
    setOcupado(r||null);
  }, [form.auto_id,form.desde,form.hasta,reservas,autos]);

  const dias = calcDias(form.desde,form.hora_inicio,form.hasta,form.hora_fin);
  const diasTexto = Number.isInteger(dias) ? String(dias) : dias.toFixed(1).replace('.', ',');
  const cumpleMinimo = dias >= 3;

  const handleSubmit = async e => {
    e.preventDefault();
    if (ocupado || !form.auto_id || !cumpleMinimo) return;
    setLoading(true);
    try {
      const aid = parseInt(form.auto_id,10);
      const autoSel = autos.find(a=>parseInt(a.id,10)===aid);
      const mes  = parseInt(form.desde.split('-')[1],10);
      const anio = parseInt(form.desde.split('-')[0],10);

      const tarifa =
        tarifas.find(t=>parseInt(t.auto_id,10)===aid && parseInt(t.mes,10)===mes && parseInt(t.anio,10)===anio) ||
        tarifas.find(t=>parseInt(t.auto_id,10)===aid) ||
        tarifas.find(t=>parseInt(t.mes,10)===mes && parseInt(t.anio,10)===anio) || {};

      const precioDia    = parseFloat(tarifa.precio_auto_mensual_ars || autoSel?.prices_ars || 45000);
      const precSillita  = parseFloat(tarifa.precio_sillita          || 5000);
      const precLavado   = parseFloat(tarifa.precio_lavado           || 18000);
      const cRetiro      = parseFloat(tarifa.cargo_retiro_aeropuerto || 16000);
      const cDevol       = parseFloat(tarifa.cargo_devolucion_aeropuerto||16000);
      const garantiaUsd  = parseFloat(tarifa.garantia_usd            || 400);
      const cotizacion   = parseFloat(tarifa.cotizacion_dolar        || 1450);
      const garantiaArs  = garantiaUsd * cotizacion;

      const rentaBase    = precioDia * dias;
      const costoSillita = form.sillita ? precSillita : 0;
      const costoRetiro  = form.entrega.toLowerCase().includes('aeropuerto')    ? cRetiro : 0;
      const costoDevol   = form.devolucion.toLowerCase().includes('aeropuerto') ? cDevol  : 0;
      const costoLavado  = precLavado;
      const subtotal     = rentaBase + costoSillita + costoRetiro + costoDevol + costoLavado;

      const promoAplicable = (promos || [])
        .filter(p => {
          const ini = p.fecha_inicio ? String(p.fecha_inicio).slice(0,10) : null;
          const fin = p.fecha_fin    ? String(p.fecha_fin).slice(0,10)    : null;
          const desdeOk = !ini || form.desde >= ini;
          const hastaOk = !fin || form.desde <= fin;
          return desdeOk && hastaOk && Number(p.descuento) > 0;
        })
        .sort((a,b) => Number(b.descuento) - Number(a.descuento))[0] || null;

      const descPromo     = promoAplicable ? Number(promoAplicable.descuento) : 0;
      const descuentoArs   = subtotal * (descPromo / 100);
      const subtotalNeto   = subtotal - descuentoArs;

      const recT1        = parseFloat(tarifa.recargo_tarjeta_1 ?? 8);
      const recT3        = parseFloat(tarifa.recargo_tarjeta_3 ?? 16);
      const recT6        = parseFloat(tarifa.recargo_tarjeta_6 ?? 32);
      const factor       = form.metodo_pago==='tarjeta_1' ? 1 + recT1/100
                         : form.metodo_pago==='tarjeta_3' ? 1 + recT3/100
                         : form.metodo_pago==='tarjeta_6' ? 1 + recT6/100 : 1;
      const total        = subtotalNeto * factor;

      trackQuote({
        value: Math.round(total),
        currency: 'ARS',
        content_name: autoSel?.modelo || 'Vehículo',
        dias,
      });

      onQuoteGenerated({
        enviado:true,
        auto_id:aid, auto_modelo:autoSel?.modelo||'Vehículo', auto_patente:autoSel?.patente||'',
        dias,
        precio_renta_mes_ars:precioDia,
        costo_retiro_aero:costoRetiro, costo_devolucion_aero:costoDevol,
        costo_sillita:costoSillita, costo_lavado:costoLavado,
        subtotal_neto:subtotal, monto_total_ars:total,
        descuento_promo:descPromo, descuento_promo_ars:Math.round(descuentoArs), promo_titulo:promoAplicable?.titulo || '',
        garantia_usd:garantiaUsd, garantia_ars:garantiaArs,
        cotizacion, tasa_dolar_usada:cotizacion,
        esMendoza:esMendoza(form.cliente_whatsapp),
        ...form,
        provincia: form.origen === 'Argentina' ? (form.provincia || null) : null,
      });
    } catch(err) {
      console.error(err);
      alert('Error al calcular el presupuesto.');
    } finally { setLoading(false); }
  };

  // Reducimos el padding en móviles (p-3 o py-2.5) pero lo mantenemos en PC (px-4 py-3)
  const inpBox = 'relative bg-[#121319] border border-slate-800 rounded-xl overflow-hidden focus-within:border-[#88BDF2] transition-colors';
  const inpIn = 'w-full bg-transparent px-3 md:px-4 py-2.5 md:py-3 text-sm outline-none text-white appearance-none';
  const lbl = 'text-[9px] md:text-[10px] uppercase text-slate-400 font-bold ml-1 mb-1 block tracking-wider';

  const disponibles = autos;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#1E222F] md:border md:border-slate-800 rounded-2xl md:rounded-[2rem] p-5 md:p-8 md:shadow-2xl font-sans text-white">
      
      <div className="flex flex-col items-center md:items-start border-b border-slate-800/60 pb-5 mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
          <Car className="text-[#88BDF2]" size={28}/> Cotizar Alquiler
        </h2>
        <p className="text-xs text-slate-400 mt-2 text-center md:text-left">Completá los datos y obtené tu presupuesto al instante.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

        {/* 1. DATOS DEL CLIENTE */}
        <div className="space-y-4 md:space-y-5">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Datos Personales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Nombre Completo</label>
              <div className={inpBox}>
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500"><User size={16}/></div>
                <input name="cliente_nombre" required value={form.cliente_nombre} onChange={set} placeholder="Ej: Juan Pérez" className={`${inpIn} pl-10`}/>
              </div>
            </div>
            
            <div>
              <label className={lbl}>WhatsApp / Celular</label>
              <div className={inpBox}>
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500"><Phone size={16}/></div>
                <input name="cliente_whatsapp" required type="tel" value={form.cliente_whatsapp} onChange={set} placeholder="Ej: 2614123456" className={`${inpIn} pl-10`}/>
              </div>
              {esMendoza(form.cliente_whatsapp) && <p className="text-[10px] text-emerald-400 font-bold mt-1.5 ml-1 flex items-center gap-1"><MapPin size={10}/> Teléfono local Mendoza</p>}
            </div>
          </div>

          {/* En móvil: País y Provincia en la misma fila (50/50) */}
          <div className={`grid gap-4 ${form.origen === 'Argentina' ? 'grid-cols-2 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <label className={lbl}><Globe size={10} className="inline mr-1"/>País</label>
              <div className={inpBox}>
                <select name="origen" value={form.origen} onChange={setOrigen} className={inpIn}>
                  {PAISES.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {form.origen === 'Argentina' && (
              <div>
                <label className={lbl}>Provincia</label>
                <div className={inpBox}>
                  <select name="provincia" value={form.provincia} onChange={set} className={inpIn}>
                    {PROVINCIAS_AR.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. FECHAS Y HORARIOS */}
        <div className="space-y-4 md:space-y-5">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Período de Alquiler</h3>
          
          {/* En móvil: Fecha y Hora en la misma fila para Retiro y otra fila para Devolución */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
            
            {/* Bloque Retiro */}
            <div className="bg-[#121319]/50 p-3 rounded-2xl border border-slate-800/60">
              <span className="text-[10px] text-[#88BDF2] font-black uppercase mb-3 block">Retiro de la unidad</span>
              <div className="grid grid-cols-7 gap-2">
                <div className="col-span-4">
                  <label className="text-[9px] uppercase text-slate-500 font-bold ml-1 mb-1 block">Fecha</label>
                  <div className={inpBox}>
                    <input type="date" name="desde" min={HOY} required value={form.desde} onChange={onChangeDesde} onClick={abrirCalendario} className={`${inpIn} cursor-pointer text-xs sm:text-sm`}/>
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] uppercase text-slate-500 font-bold ml-1 mb-1 block">Hora</label>
                  <div className={inpBox}>
                    <select name="hora_inicio" value={form.hora_inicio} onChange={set} className={`${inpIn} text-xs sm:text-sm`}>{HORAS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque Devolución */}
            <div className="bg-[#121319]/50 p-3 rounded-2xl border border-slate-800/60">
              <span className="text-[10px] text-emerald-400 font-black uppercase mb-3 block">Devolución</span>
              <div className="grid grid-cols-7 gap-2">
                <div className="col-span-4">
                  <label className="text-[9px] uppercase text-slate-500 font-bold ml-1 mb-1 block">Fecha</label>
                  <div className={inpBox}>
                    <input type="date" name="hasta" min={form.desde} required value={form.hasta} onChange={set} onClick={abrirCalendario} className={`${inpIn} cursor-pointer text-xs sm:text-sm`}/>
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] uppercase text-slate-500 font-bold ml-1 mb-1 block">Hora</label>
                  <div className={inpBox}>
                    <select name="hora_fin" value={form.hora_fin} onChange={set} className={`${inpIn} text-xs sm:text-sm`}>{HORAS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-[#88BDF2]/10 border border-[#88BDF2]/20 rounded-xl px-4 py-3 text-xs font-bold text-[#88BDF2] flex items-center justify-center gap-2">
              <Calendar size={15}/> Calculado: {diasTexto} día{dias===1?'':'s'} de alquiler
            </div>
            {!cumpleMinimo && (
              <div className="flex-1 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-xs font-bold text-rose-300 flex items-center justify-center gap-2 text-center">
                <AlertTriangle size={15} className="shrink-0"/> Mínimo 3 días requeridos
              </div>
            )}
          </div>
        </div>

        {/* 3. LOGÍSTICA Y VEHÍCULO */}
        <div className="space-y-4 md:space-y-5">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Logística y Unidad</h3>
          
          {/* Lugares apilados en móvil, en línea en PC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#121319]/30 p-4 rounded-2xl border border-slate-800/40">
            <div>
              <label className={lbl}>📍 Punto de Retiro</label>
              <div className={inpBox}>
                <select name="entrega" value={form.entrega} onChange={set} className={inpIn}>
                  <option value="Mendoza (Microcentro)">Mendoza (Microcentro)</option>
                  <option value="Aeropuerto (El Plumerillo)">Aeropuerto El Plumerillo</option>
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>🏁 Punto de Devolución</label>
              <div className={inpBox}>
                <select name="devolucion" value={form.devolucion} onChange={set} className={inpIn}>
                  <option value="Mendoza (Microcentro)">Mendoza (Microcentro)</option>
                  <option value="Aeropuerto (El Plumerillo)">Aeropuerto El Plumerillo</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className={lbl}>Selecciona un Vehículo</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {disponibles.map(a => {
                const selected = String(form.auto_id) === String(a.id);
                return (
                  <button type="button" key={a.id}
                    onClick={() => setForm(p => ({ ...p, auto_id: String(a.id) }))}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all ${selected ? 'border-[#88BDF2] bg-[#88BDF2]/10 ring-1 ring-[#88BDF2]/40 shadow-lg' : 'border-slate-800 bg-[#121319] hover:border-slate-600'}`}>
                    <div className="w-20 h-14 md:w-24 md:h-16 rounded-xl bg-[#1E222F] overflow-hidden flex items-center justify-center shrink-0 border border-slate-800/60">
                      {a.imagen_url
                        ? <img src={a.imagen_url} alt={a.modelo} className="object-contain w-full h-full p-1"/>
                        : <Car size={24} className="text-slate-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-xs md:text-sm text-white truncate leading-tight">{a.modelo}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[8px] md:text-[9px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded leading-none">{a.patente}</span>
                        <span className="text-[8px] md:text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1 leading-none">
                          <Cog size={10}/> {a.transmision}
                        </span>
                      </div>
                      {selected && <p className="text-[#88BDF2] font-black uppercase text-[9px] mt-1.5 tracking-wider">✓ Seleccionado</p>}
                    </div>
                  </button>
                );
              })}
            </div>
            {disponibles.length === 0 && <p className="text-[11px] text-slate-500 mt-2 ml-1">No hay vehículos disponibles en este momento.</p>}
          </div>

          {ocupado && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center shadow-lg">
              <AlertTriangle className="text-amber-400 shrink-0 hidden sm:block" size={24}/>
              <div className="flex-1">
                <p className="text-xs md:text-sm font-black text-amber-300 uppercase flex items-center gap-2">
                  <AlertTriangle className="sm:hidden" size={16}/> ¡Vehículo no disponible!
                </p>
                <p className="text-[11px] md:text-xs text-slate-300 mt-1">Ya hay una reserva para esas fechas. Contactanos y te ofrecemos alternativas.</p>
              </div>
              <button type="button" onClick={()=>{ trackContact({ method:'whatsapp', source:'booking_unavailable' }); window.open(`https://wa.me/5492612764618?text=${encodeURIComponent('Hola, quiero consultar disponibilidad para '+form.desde+' al '+form.hasta)}`); }} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#25D366] text-[#121319] text-xs font-black px-4 py-2.5 rounded-xl hover:bg-[#1ebd5a] shrink-0 uppercase tracking-wide">
                <MessageCircle size={16}/> Escribir al WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* 4. ADICIONALES Y PAGO */}
        <div className="space-y-4 md:space-y-5">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Finalizar</h3>
          
          <div className="bg-[#121319] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-5 md:gap-8">
            <label className="flex items-center gap-3 cursor-pointer w-full md:w-auto bg-[#1E222F] md:bg-transparent p-3 md:p-0 rounded-xl border border-slate-800 md:border-none">
              <input type="checkbox" className="w-5 h-5 accent-[#88BDF2] rounded cursor-pointer" checked={form.sillita} onChange={e=>setForm(p=>({...p,sillita:e.target.checked}))}/>
              <span className="text-xs md:text-sm font-bold uppercase flex items-center gap-2 text-white"><Baby size={18} className="text-[#88BDF2]"/> Agregar Sillita de Bebé</span>
            </label>
            
            <div className="w-full md:flex-1">
              <label className={lbl}>Método de Pago Preferido</label>
              <div className={inpBox}>
                <select name="metodo_pago" value={form.metodo_pago} onChange={set} className={inpIn}>
                  <option value="efectivo">Efectivo / Transferencia / Débito</option>
                  <option value="tarjeta_1">Tarjeta Crédito — 1 Pago</option>
                  <option value="tarjeta_3">Tarjeta Crédito — 3 Cuotas</option>
                  <option value="tarjeta_6">Tarjeta Crédito — 6 Cuotas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÓN SUBMIT */}
        <div className="pt-2">
          <button type="submit" disabled={loading||!!ocupado||!form.auto_id||!cumpleMinimo}
            className="w-full bg-[#88BDF2] text-[#121319] font-black uppercase text-sm md:text-base py-4 md:py-5 rounded-2xl hover:bg-white transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin" size={24}/> : 'Calcular Presupuesto'}
          </button>
          <p className="text-center text-[10px] text-slate-500 mt-3 font-medium">Al cotizar no se realiza ningún cargo. El presupuesto detallado aparecerá a continuación.</p>
        </div>

      </form>
    </div>
  );
}