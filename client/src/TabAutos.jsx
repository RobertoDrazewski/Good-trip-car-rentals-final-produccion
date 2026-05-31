// client/src/TabAutos.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Car, Trash2, Loader2, Plus, X, AlertCircle,
  Snowflake, Bluetooth, Navigation, Armchair, Sun, ShieldCheck,
  Disc, Baby, Camera, Gauge, Settings2, Cog, Fuel, Droplet,
  Leaf, Mountain, SlidersHorizontal
} from 'lucide-react';

export default function TabAutos() {
  const [autos, setAutos] = useState([]);
  const [showAddAuto, setShowAddAuto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // 🛠️ Estructura maestra de íconos agrupados por categorías.
  // Cada item lleva su componente de ícono (Icon) de lucide-react.
  const CONFIG_CATEGORIAS = {
    confort: [
      { id: 'aire', label: 'Aire Acondicionado', Icon: Snowflake },
      { id: 'bluetooth', label: 'Conexión Bluetooth', Icon: Bluetooth },
      { id: 'pantalla', label: 'Pantalla Táctil / GPS', Icon: Navigation },
      { id: 'asientos_cuero', label: 'Asientos de Cuero', Icon: Armchair },
      { id: 'techo', label: 'Techo Corredizo', Icon: Sun }
    ],
    seguridad: [
      { id: 'airbag', label: 'Airbags Seguros', Icon: ShieldCheck },
      { id: 'abs', label: 'Frenos ABS', Icon: Disc },
      { id: 'isofix', label: 'Anclajes ISOFIX', Icon: Baby },
      { id: 'camara', label: 'Cámara de Retroceso', Icon: Camera },
      { id: 'control_traccion', label: 'Control de Estabilidad (ESP)', Icon: Gauge }
    ],
    ficha: [
      { id: 'caja_manual', label: 'Transmisión Manual', Icon: Settings2 },
      { id: 'caja_auto', label: 'Transmisión Automática', Icon: Cog },
      { id: 'motor_nafta', label: 'Motor Nafta', Icon: Fuel },
      { id: 'motor_diesel', label: 'Motor Diesel', Icon: Droplet },
      { id: 'motor_hibrido', label: 'Motor Híbrido / Eléctrico', Icon: Leaf },
      { id: 'traccion_4x4', label: 'Tracción 4x4 / 4WD / AWD', Icon: Mountain },
      { id: 'tipo_sedan', label: 'Carrocería Sedán', Icon: Car },
      { id: 'perfil_manejo', label: 'Modos de Manejo (Sport/Eco)', Icon: SlidersHorizontal }
    ]
  };

  const estadoInicialAuto = {
    modelo: '',
    patente: '',
    transmision: 'Manual',
    color: '#121319',
    descripcion_larga: '',
    prices_ars: '', // 👈 CORREGIDO: Sincronizado con la columna real de tu base de datos y chatController
    estado: 'Disponible',
    odometro: '',
    puntaje_confort: 5,
    puntaje_seguridad: 5,
    puntaje_ficha: 5,
    iconos_seleccionados: {}
  };

  const [newAuto, setNewAuto] = useState(estadoInicialAuto);

  useEffect(() => {
    fetchAutos();
  }, []);

  const fetchAutos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/cars`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutos(res.data || []);
    } catch (err) {
      console.error(err);
      setError('No se pudo sincronizar el catálogo de la flota.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIcono = (id) => {
    setNewAuto(prev => ({
      ...prev,
      iconos_seleccionados: {
        ...prev.iconos_seleccionados,
        [id]: !prev.iconos_seleccionados[id]
      }
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      alert("⚠️ Error de autenticación: No se encontró sesión activa. Por favor reingresa al panel.");
      setIsSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('modelo', newAuto.modelo);
      formData.append('patente', newAuto.patente);
      formData.append('transmision', newAuto.transmision);
      formData.append('color', newAuto.color);
      formData.append('descripcion_larga', newAuto.descripcion_larga);
      formData.append('prices_ars', newAuto.prices_ars || 0); // 👈 Campo clave enviado mapeado correctamente
      formData.append('estado', newAuto.estado);
      formData.append('odometro', newAuto.odometro || 0);

      const paqueteFeatures = {
        puntaje_confort: parseInt(newAuto.puntaje_confort),
        puntaje_seguridad: parseInt(newAuto.puntaje_seguridad),
        puntaje_ficha: parseInt(newAuto.puntaje_ficha),
        iconos: newAuto.iconos_seleccionados
      };
      formData.append('features', JSON.stringify(paqueteFeatures));

      if (fileInputRef.current?.files[0]) {
        formData.append('imagen', fileInputRef.current.files[0]);
      }

      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/cars`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert("🚗 ¡Vehículo creado y publicado con éxito!");
      setNewAuto(estadoInicialAuto);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowAddAuto(false);
      fetchAutos();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert('⚠️ Su token de seguridad ha expirado. Por favor cierre sesión y vuelva a ingresar.');
      } else {
        alert('Error al guardar el auto. Verifique la conexión con el servidor MySQL.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Remover este vehículo permanentemente de la flota?\nEsta acción no se puede deshacer.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAutos();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar. Verifique que el auto no cuente con reservas activas ligadas.');
    }
  };

  return (
    <div className="w-full text-slate-100 p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Car className="text-[#88BDF2]" size={22} /> Gestión Avanzada de Flota
          </h2>
          <p className="text-xs text-[#6F7D93] uppercase font-bold tracking-wider mt-0.5">Asignación de barras de rendimiento e íconos</p>
        </div>
        <button
          onClick={() => setShowAddAuto(!showAddAuto)}
          className="px-4 py-2.5 bg-[#88BDF2] text-[#121319] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-white transition-all flex items-center gap-2 cursor-pointer"
        >
          {showAddAuto ? <X size={14} /> : <Plus size={14} />}
          {showAddAuto ? 'Cancelar' : 'Agregar Vehículo'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-xs uppercase font-bold mb-6">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {showAddAuto && (
        <form onSubmit={handleSubmit} className="bg-[#1E222F] border border-slate-800 rounded-3xl p-6 mb-8 max-w-4xl mx-auto text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Modelo / Marca del Vehículo</label>
              <input required type="text" className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-[#88BDF2]" value={newAuto.modelo} onChange={e => setNewAuto({...newAuto, modelo: e.target.value})} placeholder="Ej: Chevrolet Onix 1.4" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Patente / Dominio</label>
              <input required type="text" className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-[#88BDF2] font-mono uppercase" value={newAuto.patente} onChange={e => setNewAuto({...newAuto, patente: e.target.value})} placeholder="AE123CD" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Tarifa Diaria (ARS)</label>
              <input required type="number" className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-[#88BDF2] font-mono" value={newAuto.prices_ars} onChange={e => setNewAuto({...newAuto, prices_ars: e.target.value})} placeholder="45000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Tipo de Caja</label>
              <select className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-[#88BDF2]" value={newAuto.transmision} onChange={e => setNewAuto({...newAuto, transmision: e.target.value})}>
                <option value="Manual">Manual</option>
                <option value="Automático">Automático</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Kilometraje / Odómetro</label>
              <input type="number" className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-[#88BDF2]" value={newAuto.odometro} onChange={e => setNewAuto({...newAuto, odometro: e.target.value})} placeholder="Ej: 45000" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Estado Operativo</label>
              <select className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-[#88BDF2]" value={newAuto.estado} onChange={e => setNewAuto({...newAuto, estado: e.target.value})}>
                <option value="Disponible">Disponible para Alquiler</option>
                <option value="Mantenimiento">En Taller / Mantenimiento</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Descripción General Comercial (Para cotizador e IA)</label>
            <textarea rows="2" className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-[#88BDF2]" value={newAuto.descripcion_larga} onChange={e => setNewAuto({...newAuto, descripcion_larga: e.target.value})} placeholder="Escribe detalles del equipamiento del vehículo..."></textarea>
          </div>

          {/* 📊 SECCIÓN DE BARRAS DE PROGRESO */}
          <div className="bg-[#121319] p-4 rounded-2xl border border-slate-800/60 mb-6">
            <h4 className="text-xs font-black uppercase text-[#88BDF2] tracking-widest mb-4">Métricas de Rendimiento (Barras de Nivel 1 a 10)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between text-[10px] uppercase font-black mb-1.5">
                  <span className="text-white">Nivel de Confort</span>
                  <span className="text-[#88BDF2] font-mono">{newAuto.puntaje_confort}/10</span>
                </div>
                <input type="range" min="1" max="10" className="w-full accent-[#88BDF2]" value={newAuto.puntaje_confort} onChange={e => setNewAuto({...newAuto, puntaje_confort: e.target.value})} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] uppercase font-black mb-1.5">
                  <span className="text-white">Nivel de Seguridad</span>
                  <span className="text-[#88BDF2] font-mono">{newAuto.puntaje_seguridad}/10</span>
                </div>
                <input type="range" min="1" max="10" className="w-full accent-[#88BDF2]" value={newAuto.puntaje_seguridad} onChange={e => setNewAuto({...newAuto, puntaje_seguridad: e.target.value})} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] uppercase font-black mb-1.5">
                  <span className="text-white">Ficha Técnica Gral.</span>
                  <span className="text-[#88BDF2] font-mono">{newAuto.puntaje_ficha}/10</span>
                </div>
                <input type="range" min="1" max="10" className="w-full accent-[#88BDF2]" value={newAuto.puntaje_ficha} onChange={e => setNewAuto({...newAuto, puntaje_ficha: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 🛠️ ASIGNADOR DE ÍCONOS AGRUPADOS POR SECCIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#121319]/50 p-4 rounded-2xl border border-slate-800/40">
              <h5 className="text-[10px] uppercase font-black text-[#88BDF2] tracking-wider mb-3 border-b border-slate-800 pb-1.5">Íconos de Confort</h5>
              <div className="space-y-2">
                {CONFIG_CATEGORIAS.confort.map(item => {
                  const ItemIcon = item.Icon;
                  return (
                    <label key={item.id} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input type="checkbox" className="accent-[#88BDF2]" checked={!!newAuto.iconos_seleccionados[item.id]} onChange={() => handleToggleIcono(item.id)} />
                      <ItemIcon size={14} className="text-[#88BDF2] shrink-0" />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121319]/50 p-4 rounded-2xl border border-slate-800/40">
              <h5 className="text-[10px] uppercase font-black text-emerald-400 tracking-wider mb-3 border-b border-slate-800 pb-1.5">Íconos de Seguridad</h5>
              <div className="space-y-2">
                {CONFIG_CATEGORIAS.seguridad.map(item => {
                  const ItemIcon = item.Icon;
                  return (
                    <label key={item.id} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input type="checkbox" className="accent-emerald-400" checked={!!newAuto.iconos_seleccionados[item.id]} onChange={() => handleToggleIcono(item.id)} />
                      <ItemIcon size={14} className="text-emerald-400 shrink-0" />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121319]/50 p-4 rounded-2xl border border-slate-800/40">
              <h5 className="text-[10px] uppercase font-black text-amber-400 tracking-wider mb-3 border-b border-slate-800 pb-1.5">Íconos de Ficha Técnica</h5>
              <div className="space-y-2">
                {CONFIG_CATEGORIAS.ficha.map(item => {
                  const ItemIcon = item.Icon;
                  return (
                    <label key={item.id} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input type="checkbox" className="accent-amber-400" checked={!!newAuto.iconos_seleccionados[item.id]} onChange={() => handleToggleIcono(item.id)} />
                      <ItemIcon size={14} className="text-amber-400 shrink-0" />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carga de Imagen */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-[#121319]/40 rounded-2xl border border-slate-800/60">
            <div className="flex-1 w-full">
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Fotografía del Vehículo</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer" />
            </div>
            {imagePreview && (
              <div className="w-32 h-20 bg-[#121319] rounded-xl border border-slate-800 overflow-hidden p-1 flex items-center justify-center">
                <img src={imagePreview} className="object-contain h-full w-full" alt="Vista previa" />
              </div>
            )}
          </div>

          <button type="submit" disabled={isSaving} className="w-full mt-6 bg-[#88BDF2] text-[#121319] font-black uppercase text-xs tracking-widest py-3.5 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Guardar y Publicar Automóvil'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#88BDF2]" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {autos.length > 0 ? autos.map(a => (
            <div key={a.id} className="bg-[#1E222F] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div className="w-full h-32 bg-[#121319]/60 rounded-xl flex items-center justify-center overflow-hidden mb-3">
                {a.imagen_url ? <img src={a.imagen_url} className="object-contain h-full p-2" alt={a.modelo} /> : <Car size={36} className="opacity-20" />}
              </div>
              <h4 className="font-black text-white uppercase text-xs tracking-tight text-center truncate mb-1">{a.modelo}</h4>
              <p className="text-center text-emerald-400 font-mono text-xs font-bold mb-3">
                ${a.prices_ars ? parseInt(a.prices_ars).toLocaleString('es-AR') : '0'} / día
              </p>
              <div className="flex justify-between items-center bg-[#121319] p-2 rounded-xl border border-slate-800/40">
                <span className="text-[9px] font-mono font-bold px-2 text-slate-400">{a.patente || 'SIN PATENTE'}</span>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center py-12 text-[#6F7D93] uppercase font-mono tracking-wider text-xs">
              No hay vehículos registrados en la flota de Good Trip.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
