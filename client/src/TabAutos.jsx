import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Car, Trash2, Loader2, Plus, X, AlertCircle, Pencil, Check, // 👈 Se agregó Pencil y Check
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
  const [editingId, setEditingId] = useState(null); // 👈 Nuevo estado para controlar la edición
  
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

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
    prices_ars: '',
    estado: 'Disponible',
    odometro: '',
    puntaje_confort: 5,
    puntaje_seguridad: 5,
    puntaje_ficha: 5,
    iconos_seleccionados: {},
    imagen_url: '' // 👈 Necesario para preservar la imagen en la edición
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

  // 👈 NUEVA FUNCIÓN: Carga los datos del auto en el formulario para editarlos
  const handleEdit = (auto) => {
    const features = auto.features || {};
    setNewAuto({
      modelo: auto.modelo || '',
      patente: auto.patente || '',
      transmision: auto.transmision || 'Manual',
      color: auto.color || '#121319',
      descripcion_larga: auto.descripcion_larga || '',
      prices_ars: auto.prices_ars || '',
      estado: auto.estado || 'Disponible',
      odometro: auto.odometro || '',
      puntaje_confort: features.puntaje_confort || 5,
      puntaje_seguridad: features.puntaje_seguridad || 5,
      puntaje_ficha: features.puntaje_ficha || 5,
      iconos_seleccionados: features.iconos || {},
      imagen_url: auto.imagen_url || ''
    });
    setImagePreview(auto.imagen_url || null);
    setEditingId(auto.id);
    setShowAddAuto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Lleva la vista hacia el formulario
  };

  // 👈 FUNCIÓN MODIFICADA: Ahora maneja tanto la creación como la actualización
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
      formData.append('prices_ars', newAuto.prices_ars || 0);
      formData.append('estado', newAuto.estado);
      formData.append('odometro', newAuto.odometro || 0);
      
      if (editingId && newAuto.imagen_url) {
        formData.append('imagen_url', newAuto.imagen_url); // Envía la URL actual para no perder la foto si no se sube una nueva
      }

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

      if (editingId) {
        // Petición PUT para actualizar
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/cars/${editingId}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert("🚗 ¡Vehículo actualizado con éxito!");
      } else {
        // Petición POST para crear
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/cars`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert("🚗 ¡Vehículo creado y publicado con éxito!");
      }

      // Reinicio del formulario
      setNewAuto(estadoInicialAuto);
      setImagePreview(null);
      setEditingId(null);
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

  const handleCancelForm = () => {
    setShowAddAuto(false);
    setNewAuto(estadoInicialAuto);
    setImagePreview(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full text-slate-100 p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Car className="text-[#88BDF2]" size={22} /> Gestión Avanzada de Flota
          </h2>
          <p className="text-xs text-[#6F7D93] uppercase font-bold tracking-wider mt-0.5">Asignación de equipamiento e íconos del vehículo</p>
        </div>
        <button
          onClick={showAddAuto ? handleCancelForm : () => setShowAddAuto(true)}
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
          
          {/* Título dinámico para el formulario */}
          <h3 className="text-sm font-black uppercase text-[#88BDF2] tracking-widest mb-6 pb-2 border-b border-slate-800">
            {editingId ? 'Editar Vehículo Existente' : 'Nuevo Vehículo'}
          </h3>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#121319]/50 p-4 rounded-2xl border border-slate-800/40">
              <h5 className="text-[10px] uppercase font-black text-[#88BDF2] tracking-wider mb-3 border-b border-slate-800 pb-1.5">Equipamiento de Confort</h5>
              <div className="space-y-2">
                {CONFIG_CATEGORIAS.confort.map(item => {
                  const ItemIcon = item.Icon;
                  const activo = !!newAuto.iconos_seleccionados[item.id];
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleToggleIcono(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${activo ? 'bg-[#88BDF2]/10 border-[#88BDF2]/40 text-white' : 'bg-[#1E222F] border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <span className={`rounded-lg p-2 flex items-center justify-center shrink-0 ${activo ? 'bg-[#88BDF2]/20' : 'bg-[#121319]'}`}>
                        <ItemIcon size={16} className={activo ? 'text-[#88BDF2]' : 'text-slate-500'} />
                      </span>
                      <span className="flex-1 text-left leading-tight">{item.label}</span>
                      {activo && <Check size={15} className="text-[#88BDF2] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121319]/50 p-4 rounded-2xl border border-slate-800/40">
              <h5 className="text-[10px] uppercase font-black text-emerald-400 tracking-wider mb-3 border-b border-slate-800 pb-1.5">Equipamiento de Seguridad</h5>
              <div className="space-y-2">
                {CONFIG_CATEGORIAS.seguridad.map(item => {
                  const ItemIcon = item.Icon;
                  const activo = !!newAuto.iconos_seleccionados[item.id];
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleToggleIcono(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${activo ? 'bg-emerald-400/10 border-emerald-400/40 text-white' : 'bg-[#1E222F] border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <span className={`rounded-lg p-2 flex items-center justify-center shrink-0 ${activo ? 'bg-emerald-400/20' : 'bg-[#121319]'}`}>
                        <ItemIcon size={16} className={activo ? 'text-emerald-400' : 'text-slate-500'} />
                      </span>
                      <span className="flex-1 text-left leading-tight">{item.label}</span>
                      {activo && <Check size={15} className="text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121319]/50 p-4 rounded-2xl border border-slate-800/40">
              <h5 className="text-[10px] uppercase font-black text-amber-400 tracking-wider mb-3 border-b border-slate-800 pb-1.5">Equipamiento Ficha Técnica</h5>
              <div className="space-y-2">
                {CONFIG_CATEGORIAS.ficha.map(item => {
                  const ItemIcon = item.Icon;
                  const activo = !!newAuto.iconos_seleccionados[item.id];
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleToggleIcono(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${activo ? 'bg-amber-400/10 border-amber-400/40 text-white' : 'bg-[#1E222F] border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <span className={`rounded-lg p-2 flex items-center justify-center shrink-0 ${activo ? 'bg-amber-400/20' : 'bg-[#121319]'}`}>
                        <ItemIcon size={16} className={activo ? 'text-amber-400' : 'text-slate-500'} />
                      </span>
                      <span className="flex-1 text-left leading-tight">{item.label}</span>
                      {activo && <Check size={15} className="text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-[#121319]/40 rounded-2xl border border-slate-800/60">
            <div className="flex-1 w-full">
              <label className="text-[10px] uppercase font-black text-[#6F7D93] tracking-wider block mb-2">Fotografía del Vehículo (Opcional si es edición)</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer" />
            </div>
            {imagePreview && (
              <div className="w-32 h-20 bg-[#121319] rounded-xl border border-slate-800 overflow-hidden p-1 flex items-center justify-center">
                <img src={imagePreview} className="object-contain h-full w-full" alt="Vista previa" />
              </div>
            )}
          </div>

          <button type="submit" disabled={isSaving} className="w-full mt-6 bg-[#88BDF2] text-[#121319] font-black uppercase text-xs tracking-widest py-3.5 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : (editingId ? 'Guardar Cambios' : 'Guardar y Publicar Automóvil')}
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
              
              {/* 👈 AQUÍ SE MODIFICARON LOS BOTONES: Añadí el de Editar (Pencil) */}
              <div className="flex justify-between items-center bg-[#121319] p-2 rounded-xl border border-slate-800/40">
                <span className="text-[9px] font-mono font-bold px-2 text-slate-400">{a.patente || 'SIN PATENTE'}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEdit(a)} 
                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors cursor-pointer"
                    title="Editar Vehículo"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(a.id)} 
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar Vehículo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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