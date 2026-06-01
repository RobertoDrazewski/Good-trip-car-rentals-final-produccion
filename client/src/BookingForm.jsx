// client/src/BookingForm.jsx — v4
import React, { useState, useEffect } from 'react';
import { Baby, Loader2, Car, Info, AlertTriangle, MessageCircle, Globe, Calendar, Cog } from 'lucide-react';

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

// Regla de 6 horas: si sobran más de 6h del día se cobra 1 día más
const calcDias = (d1,h1,d2,h2) => {
  const ini = new Date(`${d1}T${h1}:00`);
  const fin = new Date(`${d2}T${h2}:00`);
  const diffH = Math.max(0,(fin-ini)/3_600_000);
  return Math.max(1, Math.floor(diffH/24) + (diffH%24 > 6 ? 1 : 0));
};
const esMendoza = w => { const t=String(w||'').replace(/\D/g,''); return t.startsWith('261')||t.startsWith('54261'); };

export default function BookingForm({ autos=[], tarifas=[], reservas=[], onQuoteGenerated }) {
  const [loading, setLoading]         = useState(false);
  const [ocupado, setOcupado]         = useState(null);
  const [form, setForm] = useState({
    auto_id:'', cliente_nombre:'', cliente_whatsapp:'',
    desde:HOY, hora_inicio:'10:00', hasta:HOY, hora_fin:'10:00',
    entrega:'Mendoza (Microcentro)', devolucion:'Mendoza (Microcentro)',
    sillita:false, metodo_pago:'efectivo', origen:'Argentina', provincia:'Mendoza',
  });

  const set = e => { const {name,value}=e.target; setForm(p=>({...p,[name]:value})); };

  // País: si no es Argentina, la provincia no aplica (se limpia)
  const setOrigen = e => {
    const value = e.target.value;
    setForm(p => ({ ...p, origen: value, provincia: value === 'Argentina' ? (p.provincia || 'Mendoza') : '' }));
  };

  // Al cambiar la fecha de retiro, encadenamos la devolución (nunca antes del retiro)
  const onChangeDesde = e => {
    const v = e.target.value;
    setForm(p => ({ ...p, desde: v, hasta: (!p.hasta || p.hasta < v) ? v : p.hasta }));
  };

  // Abrir el calendario nativo al hacer clic en cualquier parte del campo
  const abrirCalendario = e => { try { e.currentTarget.showPicker(); } catch (_) {} };

  // 🚗 Escuchar la selección de vehículo disparada desde el CarGrid (botón "Alquilar")
  // El CarGrid emite: window.dispatchEvent(new CustomEvent('autoSeleccionarVehiculo', { detail: { autoId } }))
  useEffect(() => {
    const onSeleccionarVehiculo = (e) => {
      const autoId = e?.detail?.autoId;
      if (autoId === undefined || autoId === null) return;
      setForm(p => ({ ...p, auto_id: String(autoId) }));
    };
    window.addEventListener('autoSeleccionarVehiculo', onSeleccionarVehiculo);
    return () => window.removeEventListener('autoSeleccionarVehiculo', onSeleccionarVehiculo);
  }, []);

  // Verificar disponibilidad al cambiar auto o fechas
  useEffect(() => {
    if (!form.auto_id||!form.desde||!form.hasta) { setOcupado(null); return; }
    const aid = parseInt(form.auto_id,10);
    const r = reservas.find(r => {
      if (parseInt(r.auto_id,10)!==aid) return false;
      const est=String(r.estado_reserva||'').toLowerCase();
      if (!['confirmada','confirmado','contratado'].includes(est)) return false;
      const ri=String(r.fecha_inicio).split('T')[0].split(' ')[0];
      const rf=String(r.fecha_fin).split('T')[0].split(' ')[0];
      return !(form.hasta<ri||form.desde>rf);
    });
    setOcupado(r||null);
  }, [form.auto_id,form.desde,form.hasta,reservas]);

  const dias = calcDias(form.desde,form.hora_inicio,form.hasta,form.hora_fin);
  const recargo = {tarjeta_1:'+8%',tarjeta_3:'+16%',tarjeta_6:'+32%'}[form.metodo_pago]||'Sin recargo';

  const handleSubmit = async e => {
    e.preventDefault();
    if (ocupado || !form.auto_id) return;
    setLoading(true);
    try {
      const aid = parseInt(form.auto_id,10);
      const autoSel = autos.find(a=>parseInt(a.id,10)===aid);
      const mes  = parseInt(form.desde.split('-')[1],10);
      const anio = parseInt(form.desde.split('-')[0],10);

      // Buscar tarifa exacta → fallback al auto → fallback al mes → fallback vacío
      const tarifa =
        tarifas.find(t=>parseInt(t.auto_id,10)===aid && parseInt(t.mes,10)===mes && parseInt(t.anio,10)===anio) ||
        tarifas.find(t=>parseInt(t.auto_id,10)===aid) ||
        tarifas.find(t=>parseInt(t.mes,10)===mes && parseInt(t.anio,10)===anio) || {};

      console.log('[BookingForm] tarifa usada:', tarifa, '| auto:', autoSel?.modelo, '| dias:', dias);

      const precioDia    = parseFloat(tarifa.precio_auto_mensual_ars || autoSel?.prices_ars || 45000);
      const precSillita  = parseFloat(tarifa.precio_sillita          || 5000);
      const precLavado   = parseFloat(tarifa.precio_lavado           || 18000);
      const cRetiro      = parseFloat(tarifa.cargo_retiro_aeropuerto || 16000);
      const cDevol       = parseFloat(tarifa.cargo_devolucion_aeropuerto||16000);
      const garantiaUsd  = parseFloat(tarifa.garantia_usd            || 400);
      const garantiaArs  = parseFloat(tarifa.garantia_ars            || 580000);
      const cotizacion   = parseFloat(tarifa.cotizacion_dolar        || 1450);

      const rentaBase    = precioDia * dias;
      const costoSillita = form.sillita ? precSillita : 0;
      const costoRetiro  = form.entrega.toLowerCase().includes('aeropuerto')    ? cRetiro : 0;
      const costoDevol   = form.devolucion.toLowerCase().includes('aeropuerto') ? cDevol  : 0;
      const costoLavado  = precLavado;
      const subtotal     = rentaBase + costoSillita + costoRetiro + costoDevol + costoLavado;
      const factor       = form.metodo_pago==='tarjeta_1'?1.08:form.metodo_pago==='tarjeta_3'?1.16:form.metodo_pago==='tarjeta_6'?1.32:1;
      const total        = subtotal * factor;

      onQuoteGenerated({
        enviado:true,
        auto_id:aid, auto_modelo:autoSel?.modelo||'Vehículo', auto_patente:autoSel?.patente||'',
        dias,
        precio_renta_mes_ars:precioDia,
        costo_retiro_aero:costoRetiro, costo_devolucion_aero:costoDevol,
        costo_sillita:costoSillita, costo_lavado:costoLavado,
        subtotal_neto:subtotal, monto_total_ars:total,
        garantia_usd:garantiaUsd, garantia_ars:garantiaArs,
        cotizacion, tasa_dolar_usada:cotizacion,
        esMendoza:esMendoza(form.cliente_whatsapp),
        ...form,
        // La provincia SOLO aplica a clientes de Argentina; del extranjero va null
        provincia: form.origen === 'Argentina' ? (form.provincia || null) : null,
      });
    } catch(err) {
      console.error(err);
      alert('Error al calcular el presupuesto.');
    } finally { setLoading(false); }
  };

  const inp='w-full bg-[#121319] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-[#88BDF2] outline-none text-white';
  const lbl='text-[10px] uppercase text-slate-400 font-bold ml-1 mb-1 block';

  const disponibles = autos.filter(a => a.estado?.toLowerCase() === 'disponible' || a.estado === 'Disponible');

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#1E222F] border border-slate-800 rounded-[2rem] p-8 shadow-2xl font-sans text-white">
      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 mb-8">
        <Car className="text-[#88BDF2]" size={28}/> Cotizar Alquiler
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="cliente_nombre" required value={form.cliente_nombre} onChange={set} placeholder="Nombre Completo" className={inp}/>
          <div>
            <input name="cliente_whatsapp" required value={form.cliente_whatsapp} onChange={set} placeholder="WhatsApp (ej: 2614123456)" className={inp}/>
            {esMendoza(form.cliente_whatsapp)&&<p className="text-[10px] text-emerald-400 font-bold mt-1 ml-1">📍 Teléfono local Mendoza</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><Globe size={10} className="inline mr-1"/>País de origen del cliente</label>
            <select name="origen" value={form.origen} onChange={setOrigen} className={inp}>
              {PAISES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {form.origen==='Argentina'&&(
            <div>
              <label className={lbl}>Provincia</label>
              <select name="provincia" value={form.provincia} onChange={set} className={inp}>
                {PROVINCIAS_AR.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* SELECTOR DE VEHÍCULO CON MINIATURA */}
        <div>
          <label className={lbl}>Vehículo</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {disponibles.map(a => {
              const selected = String(form.auto_id) === String(a.id);
              return (
                <button type="button" key={a.id}
                  onClick={() => setForm(p => ({ ...p, auto_id: String(a.id) }))}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${selected ? 'border-[#88BDF2] bg-[#88BDF2]/10 ring-1 ring-[#88BDF2]/40' : 'border-slate-800 bg-[#121319] hover:border-slate-600'}`}>
                  <div className="w-24 h-16 rounded-lg bg-[#1E222F] overflow-hidden flex items-center justify-center shrink-0 border border-slate-800/60">
                    {a.imagen_url
                      ? <img src={a.imagen_url} alt={a.modelo} className="object-contain w-full h-full p-1"/>
                      : <Car size={26} className="text-slate-600"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black uppercase text-xs text-white truncate">{a.modelo}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[9px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{a.patente}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Cog size={9}/> {a.transmision}
                      </span>
                    </div>
                    <p className="text-[#88BDF2] font-black font-mono text-sm mt-1">
                      ${parseInt(a.prices_ars||0).toLocaleString('es-AR')}
                      <span className="text-[9px] text-slate-500 font-normal"> /día</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {disponibles.length === 0 && (
            <p className="text-[11px] text-slate-500 mt-2 ml-1">No hay vehículos disponibles en este momento.</p>
          )}
          {disponibles.length > 0 && !form.auto_id && (
            <p className="text-[10px] text-slate-500 mt-2 ml-1">Seleccioná un vehículo para cotizar.</p>
          )}
        </div>

        {ocupado&&(
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <AlertTriangle className="text-amber-400 shrink-0" size={24}/>
            <div className="flex-1">
              <p className="text-sm font-black text-amber-300 uppercase">¡Vehículo no disponible en esas fechas!</p>
              <p className="text-xs text-slate-400 mt-1">Ya hay una reserva activa. Podemos ofrecerte otra opción.</p>
            </div>
            <button type="button" onClick={()=>window.open(`https://wa.me/5492614000000?text=${encodeURIComponent('Hola, quiero consultar disponibilidad para '+form.desde+' al '+form.hasta)}`)
            } className="flex items-center gap-2 bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-emerald-400 shrink-0">
              <MessageCircle size={14}/> WhatsApp
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={lbl}>Retiro</label><input type="date" name="desde" min={HOY} required value={form.desde} onChange={onChangeDesde} onClick={abrirCalendario} className={`${inp} cursor-pointer`}/></div>
          <div><label className={lbl}>Hora Retiro</label><select name="hora_inicio" value={form.hora_inicio} onChange={set} className={inp}>{HORAS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
          <div><label className={lbl}>Devolución</label><input type="date" name="hasta" min={form.desde} required value={form.hasta} onChange={set} onClick={abrirCalendario} className={`${inp} cursor-pointer`}/></div>
          <div><label className={lbl}>Hora Devol.</label><select name="hora_fin" value={form.hora_fin} onChange={set} className={inp}>{HORAS.map(h=><option key={h} value={h}>{h}</option>)}</select></div>
        </div>

        <div className="bg-[#88BDF2]/10 border border-[#88BDF2]/20 rounded-xl px-4 py-2.5 text-xs font-bold text-[#88BDF2] flex items-center gap-2">
          <Calendar size={13}/> {dias} día{dias!==1?'s':''} de alquiler
          <span className="text-slate-500 font-normal ml-1">(+1 día si superás 6h)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Lugar de Retiro</label>
            <select name="entrega" value={form.entrega} onChange={set} className={inp}>
              <option value="Mendoza (Microcentro)">Mendoza (Microcentro)</option>
              <option value="Aeropuerto (El Plumerillo)">Aeropuerto El Plumerillo</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Lugar de Devolución</label>
            <select name="devolucion" value={form.devolucion} onChange={set} className={inp}>
              <option value="Mendoza (Microcentro)">Mendoza (Microcentro)</option>
              <option value="Aeropuerto (El Plumerillo)">Aeropuerto El Plumerillo</option>
            </select>
          </div>
        </div>

        <div className="bg-[#121319] p-4 rounded-xl border border-slate-800 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-[#88BDF2]" checked={form.sillita} onChange={e=>setForm(p=>({...p,sillita:e.target.checked}))}/>
            <span className="text-sm font-bold uppercase flex items-center gap-2"><Baby size={16}/> Sillita de Bebé</span>
          </label>
          <div>
            <label className={lbl}>Método de Pago</label>
            <select name="metodo_pago" value={form.metodo_pago} onChange={set} className="w-full bg-[#1E222F] border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none text-white">
              <option value="efectivo">Efectivo / Transferencia / Débito</option>
              <option value="tarjeta_1">Tarjeta Crédito — 1 Pago (+8%)</option>
              <option value="tarjeta_3">Tarjeta Crédito — 3 Cuotas (+16%)</option>
              <option value="tarjeta_6">Tarjeta Crédito — 6 Cuotas (+32%)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1 flex items-center gap-1"><Info size={10} className="text-[#88BDF2]"/> {recargo}</p>
          </div>
        </div>

        <button type="submit" disabled={loading||!!ocupado||!form.auto_id}
          className="w-full bg-[#88BDF2] text-[#121319] font-black uppercase text-sm py-4 rounded-xl hover:bg-white transition-all disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading?<Loader2 className="animate-spin" size={20}/>:'CALCULAR Y COTIZAR'}
        </button>
      </form>
    </div>
  );
}
