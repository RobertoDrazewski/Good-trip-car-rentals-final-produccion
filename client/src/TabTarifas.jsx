import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Loader2, Settings2, Car, Wallet, 
  ShieldCheck, Waves, Baby, PlaneTakeoff, PlaneLanding, CreditCard 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Años generados en vivo: desde el año actual hasta +50.
// Se recalcula con new Date() cada vez, así nunca queda viejo.
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 51 }, (_, i) => ANIO_ACTUAL + i);

const EditableValue = ({ label, value, onSave, icon, prefix = '$', suffix = '', readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  const handleSave = async () => {
    setIsEditing(false);
    // Comparar como enteros redondeados para evitar falsos "iguales" con decimales (ej: 45000.00 vs 45000)
    if (Math.floor(Number(val)) !== Math.floor(Number(value))) {
      await onSave(Math.floor(Number(val)));
    }
  };

  const display = `${prefix}${Math.floor(Number(value || 0)).toLocaleString('es-AR')}${suffix}`;

  return (
    <div className="bg-[#121319] p-4 rounded-2xl border border-slate-800/60 flex flex-col justify-center hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-[#88BDF2]">{icon}</span>}
        <p className="text-[10px] font-black uppercase text-[#6F7D93] tracking-widest">{label}</p>
      </div>
      {readOnly ? (
        <div className="text-slate-300 font-mono font-bold text-lg opacity-90" title="Se calcula solo (no editable)">
          {display}
        </div>
      ) : isEditing ? (
        <input 
          autoFocus type="number" value={val} 
          onChange={e => setVal(e.target.value)} 
          onBlur={handleSave} 
          onKeyDown={e => e.key === 'Enter' && handleSave()} 
          className="bg-[#1E222F] text-white font-mono font-bold px-3 py-2 rounded-xl w-full outline-none border border-[#88BDF2]" 
        />
      ) : (
        <div onClick={() => setIsEditing(true)} className="cursor-pointer text-white font-mono font-bold text-lg hover:text-[#88BDF2]">
          {display}
        </div>
      )}
    </div>
  );
};

const GLOBAL_VACIO = {
  cotizacion_dolar: 0, garantia_usd: 0, garantia_ars: 0,
  precio_sillita: 0, cargo_retiro_aeropuerto: 0,
  cargo_devolucion_aeropuerto: 0, precio_lavado: 0,
  recargo_tarjeta_1: 8, recargo_tarjeta_3: 16, recargo_tarjeta_6: 32
};

export default function TabTarifas() {
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(ANIO_ACTUAL);
  const [autos, setAutos] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [loading, setLoading] = useState(true);

  const mesesNom = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const t = new Date().getTime();
      const [resAutos, resPrecios] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/cars?t=${t}`),
        axios.get(`${API_BASE_URL}/api/precios-mensuales?t=${t}`)
      ]);

      const dataAutos = Array.isArray(resAutos.data[0]) ? resAutos.data[0] : resAutos.data;
      const dataPrecios = Array.isArray(resPrecios.data) ? resPrecios.data : [];

      setAutos(dataAutos);
      setPrecios(dataPrecios);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tarifasDelMes = precios.filter(p => p.mes === selectedMes && p.anio === selectedAnio);

  // FIX: buscar primero el registro base (auto_id=0), si no hay usar cualquiera del mes
  const globalConfig = (() => {
    if (tarifasDelMes.length === 0) return GLOBAL_VACIO;
    const base = tarifasDelMes.find(p => p.auto_id === 0);
    return base ?? tarifasDelMes[0];
  })();

  // FIX: la ruta correcta es /api/precios-mensuales/global (sin /admin/)
  // Verificá en tu app.js cómo está montado el router. Si está como:
  //   app.use('/api/precios-mensuales', precioMensualRoutes)  → usar la URL de abajo
  //   app.use('/api/admin/precios-mensuales', precioMensualRoutes) → cambiar el prefijo
  const handleUpdateGlobal = async (campo, valor) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/precios-mensuales/global`,
        { mes: selectedMes, anio: selectedAnio, campo, valor },
        getAuthConfig()
      );
      await fetchData();
    } catch (error) {
      console.error("Error al guardar variable global:", error.response?.data || error.message);
      alert(`Error al guardar ${campo}: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateCarPrice = async (autoId, newPrice) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/precios-mensuales`,
        {
          mes: selectedMes, anio: selectedAnio, auto_id: autoId,
          precio_auto_mensual_ars: newPrice,
          // Pasamos los globales actuales para el caso de INSERT nuevo
          cotizacion_dolar: globalConfig.cotizacion_dolar,
          garantia_ars: globalConfig.garantia_ars,
          garantia_usd: globalConfig.garantia_usd,
          precio_sillita: globalConfig.precio_sillita,
          cargo_retiro_aeropuerto: globalConfig.cargo_retiro_aeropuerto,
          cargo_devolucion_aeropuerto: globalConfig.cargo_devolucion_aeropuerto,
          precio_lavado: globalConfig.precio_lavado,
          recargo_tarjeta_1: globalConfig.recargo_tarjeta_1,
          recargo_tarjeta_3: globalConfig.recargo_tarjeta_3,
          recargo_tarjeta_6: globalConfig.recargo_tarjeta_6,
        },
        getAuthConfig()
      );
      await fetchData();
    } catch (error) {
      console.error("Error al actualizar precio del auto:", error.response?.data || error.message);
      alert(`Error al actualizar precio: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-10">
      <Loader2 className="animate-spin text-[#88BDF2]" size={32}/>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Selector de Fecha */}
      <div className="bg-[#1E222F]/60 p-6 rounded-[2rem] border border-white/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="text-[#88BDF2]" />
          <h2 className="text-xl font-black text-white uppercase italic">Segmentación de Tarifas</h2>
        </div>
        <div className="flex gap-2">
          <select value={selectedMes} onChange={e => setSelectedMes(Number(e.target.value))} className="bg-[#121319] text-white border border-slate-700 rounded-xl px-4 py-2 font-bold outline-none">
            {mesesNom.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={selectedAnio} onChange={e => setSelectedAnio(Number(e.target.value))} className="bg-[#121319] text-white border border-slate-700 rounded-xl px-4 py-2 font-bold outline-none">
            {ANIOS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Variables Globales */}
      <div className="bg-[#1E222F]/60 p-8 rounded-[2rem] border border-white/10 shadow-xl">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
          <Settings2 size={16} className="text-emerald-400"/> Globales ({mesesNom[selectedMes-1]} {selectedAnio})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EditableValue label="Cotización Dólar" icon={<Wallet size={14}/>}       value={globalConfig.cotizacion_dolar}           onSave={v => handleUpdateGlobal('cotizacion_dolar', v)} />
          <EditableValue label="Garantía USD"      icon={<ShieldCheck size={14}/>}  prefix="USD " value={globalConfig.garantia_usd}    onSave={v => handleUpdateGlobal('garantia_usd', v)} />
          <EditableValue label="Garantía ARS (auto)" icon={<ShieldCheck size={14}/>} readOnly value={Math.floor(Number(globalConfig.garantia_usd||0)) * Math.floor(Number(globalConfig.cotizacion_dolar||0))} />
          <EditableValue label="Precio Lavado"    icon={<Waves size={14}/>}        value={globalConfig.precio_lavado}              onSave={v => handleUpdateGlobal('precio_lavado', v)} />
          <EditableValue label="Sillita Bebé"     icon={<Baby size={14}/>}         value={globalConfig.precio_sillita}             onSave={v => handleUpdateGlobal('precio_sillita', v)} />
          <EditableValue label="Retiro Aero"      icon={<PlaneTakeoff size={14}/>} value={globalConfig.cargo_retiro_aeropuerto}    onSave={v => handleUpdateGlobal('cargo_retiro_aeropuerto', v)} />
          <EditableValue label="Devol Aero"       icon={<PlaneLanding size={14}/>} value={globalConfig.cargo_devolucion_aeropuerto} onSave={v => handleUpdateGlobal('cargo_devolucion_aeropuerto', v)} />
        </div>
      </div>

      {/* Recargos por Cuotas (lo que se le suma al cliente según el plan de pago) */}
      <div className="bg-[#1E222F]/60 p-8 rounded-[2rem] border border-white/10 shadow-xl">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-2 flex items-center gap-2">
          <CreditCard size={16} className="text-[#88BDF2]"/> Recargos por Cuotas ({mesesNom[selectedMes-1]} {selectedAnio})
        </h3>
        <p className="text-[11px] text-slate-500 mb-6">Porcentaje que se suma al total según el plan de pago. Poné <strong className="text-slate-300">0</strong> para "cuotas sin interés".</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EditableValue label="Tarjeta · 1 Pago"  icon={<CreditCard size={14}/>} suffix="%" prefix="" value={globalConfig.recargo_tarjeta_1} onSave={v => handleUpdateGlobal('recargo_tarjeta_1', v)} />
          <EditableValue label="Tarjeta · 3 Cuotas" icon={<CreditCard size={14}/>} suffix="%" prefix="" value={globalConfig.recargo_tarjeta_3} onSave={v => handleUpdateGlobal('recargo_tarjeta_3', v)} />
          <EditableValue label="Tarjeta · 6 Cuotas" icon={<CreditCard size={14}/>} suffix="%" prefix="" value={globalConfig.recargo_tarjeta_6} onSave={v => handleUpdateGlobal('recargo_tarjeta_6', v)} />
        </div>
      </div>

      {/* Matriz de Vehículos */}
      <div className="bg-[#1E222F]/60 p-8 rounded-[2rem] border border-white/10 shadow-xl">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
          <Car size={16} className="text-amber-400"/> Matriz de Vehículos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {autos.map(auto => {
            // Coercionar a número en la comparación para evitar "5" !== 5
            const tarifaMes = tarifasDelMes.find(t => Number(t.auto_id) === Number(auto.id));
            const precioActual = Math.floor(Number(tarifaMes ? tarifaMes.precio_auto_mensual_ars : auto.prices_ars)) || 0;

            return (
              // Incluir precioActual en la key fuerza a React a remontar EditableValue cuando cambia el precio
              <div key={`${auto.id}-${precioActual}`} className="bg-[#121319] p-5 rounded-2xl border border-slate-800 flex items-center gap-4 hover:border-slate-600 transition-all">
                <img src={auto.imagen_url} alt={auto.modelo} className="w-16 h-12 object-cover rounded-lg bg-slate-900" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-[#6F7D93] uppercase tracking-wider truncate">{auto.modelo}</p>
                  <EditableValue 
                    label="Tarifa Mensual" 
                    value={precioActual} 
                    onSave={(val) => handleUpdateCarPrice(auto.id, val)} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
