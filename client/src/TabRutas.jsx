import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigation, Sparkles, Loader2, Trash2, AlertCircle } from 'lucide-react';

export default function TabRutas() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 📊 Estados de datos principales
  const [rutas, setRutas] = useState([]);
  const [newRuta, setNewRuta] = useState({ nombre: '', descripcion: '', imagen: null, maps_url: '' });
  
  // ⚙️ Estados de UI, Carga y Errores
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [error, setError] = useState(null);

  // 🔒 Configuración de cabeceras seguras (JWT Bearer Token)
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // 🔄 Cargar Rutas Turísticas desde el Servidor
  const fetchRutas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiUrl}/api/routes`, getAuthConfig());
      // Lee directo el array formateado que le manda el controlador unificado
      setRutas(Array.isArray(res.data) ? res.data : res.data.routes || res.data.rutas || []);
    } catch (err) {
      console.error("❌ Error al traer rutas turísticas:", err);
      setError("No se pudo sincronizar el listado de itinerarios turísticos.");
    } finally {
      // ✨ REPARADO: Quitamos el 'verifyToken' fantasma que rompía la compilación de Vite
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutas();
  }, []);

  // 🪄 Generador de Copys Emocionales con OpenAI (Backend Proxy)
  const handleGenerateAIDesc = async () => {
    if (!newRuta.nombre.trim()) {
      alert("¡Ingresa el nombre de la ruta primero para guiar a la IA!");
      return;
    }
    
    setIsGeneratingDesc(true);
    try {
      const res = await axios.post(`${apiUrl}/api/routes/ai-desc`, { 
        titulo: newRuta.nombre.trim(),
        descripcion_base: newRuta.descripcion.trim() || "Un lugar increíble para visitar en Mendoza sobre nuestras unidades."
      }, getAuthConfig());
      
      if (res?.data?.suggestion) {
        setNewRuta(prev => ({ ...prev, descripcion: res.data.suggestion }));
      } else {
        alert("El backend no devolvió ninguna sugerencia estructurada.");
      }
    } catch (err) {
      console.error("❌ Error con el servicio OpenAI:", err);
      alert("Error al conectar con la IA de OpenAI. Verifica los logs del servidor de desarrollo.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // ➕ Publicar Nueva Ruta (Multipart Form Data para subida de imágenes)
  const handlePublishRuta = async () => {
    if (!newRuta.nombre.trim() || !newRuta.descripcion.trim()) {
      alert("Por favor, completa el título y la descripción base antes de publicar.");
      return;
    }

    setIsSaving(true);
    const fd = new FormData();
    fd.append('titulo', newRuta.nombre.trim());
    fd.append('descripcion', newRuta.descripcion.trim());
    fd.append('maps_url', newRuta.maps_url.trim() || '');
    
    if (newRuta.imagen instanceof File) {
      fd.append('imagen', newRuta.imagen);
    }

    try {
      await axios.post(`${apiUrl}/api/routes/save`, fd, {
        headers: { 
          ...getAuthConfig().headers,
          'Content-Type': 'multipart/form-data' 
        }
      });

      setNewRuta({ nombre: '', descripcion: '', imagen: null, maps_url: '' });
      alert("¡Ruta publicada con éxito en la plataforma web! 🚀");
      fetchRutas(); // Refrescar catálogo
    } catch (err) {
      console.error("❌ Error al persistir itinerario:", err);
      alert(`Error al guardar: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 🗑️ Eliminar Destino por ID
  const handleDeleteRuta = async (id, titulo) => {
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente la ruta "${titulo}" del catálogo público?`)) return;

    try {
      await axios.delete(`${apiUrl}/api/routes/${id}`, getAuthConfig());
      alert("Ruta purgada de la base operativa.");
      fetchRutas();
    } catch (err) {
      console.error("❌ Error al eliminar ruta:", err);
      alert("No se pudo remover el destino. Verifica permisos con el administrador del sistema.");
    }
  };

  const inputStyle = "w-full bg-[#121319] border-2 border-transparent p-4 pl-5 rounded-xl outline-none focus:border-[#88BDF2] text-white placeholder-[#666D7E] transition-all font-bold text-sm shadow-inner";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={16} />
          <p className="text-xs text-red-300 font-semibold">{error}</p>
        </div>
      )}

      {/* FORMULARIO DE ALTA */}
      <div className="bg-[#1E222F] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-slate-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Navigation size={120} />
        </div>
        
        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
          <Navigation size={24} className="text-[#88BDF2]"/> 
          Agregar Nueva Ruta Turística
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-[#6F7D93] uppercase tracking-widest ml-2 mb-1 block">Nombre del Destino</label>
              <input 
                placeholder="Ej: Ruta del Vino, Alta Montaña..." 
                className={inputStyle} 
                value={newRuta.nombre} 
                onChange={e => setNewRuta({...newRuta, nombre: e.target.value})} 
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between ml-2">
                <label className="text-[10px] font-black text-[#6F7D93] uppercase tracking-widest block">Descripción Atractiva</label>
                <button 
                  type="button"
                  onClick={handleGenerateAIDesc}
                  disabled={isGeneratingDesc}
                  className="text-[9px] font-black uppercase tracking-widest bg-[#88BDF2]/10 text-[#88BDF2] hover:bg-[#88BDF2]/20 py-1 px-2.5 rounded-md flex items-center gap-1.5 transition-colors border border-[#88BDF2]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingDesc ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {isGeneratingDesc ? 'Pensando...' : 'Generar con IA'}
                </button>
              </div>
              <textarea 
                placeholder="Describe la experiencia de viaje, paradas sugeridas y atractivos..." 
                className="w-full bg-[#121319] text-white p-3.5 rounded-xl border border-slate-800 focus:border-[#88BDF2] outline-none text-sm font-medium placeholder-slate-600 transition-colors h-28 resize-none italic" 
                value={newRuta.descripcion} 
                onChange={e => setNewRuta({...newRuta, descripcion: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-[#6F7D93] uppercase tracking-widest ml-2 mb-1 block">Link de Google Maps</label>
              <input 
                placeholder="http://maps.google.com/..." 
                className="w-full bg-[#121319] text-[#88BDF2] p-3.5 rounded-xl border border-slate-800 focus:border-[#88BDF2] outline-none text-xs font-medium placeholder-slate-600 transition-colors font-mono" 
                value={newRuta.maps_url} 
                onChange={e => setNewRuta({...newRuta, maps_url: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-[#6F7D93] uppercase tracking-widest ml-2 mb-1 block">Foto del Paisaje</label>
              <input 
                type="file" 
                accept="image/*" 
                className="w-full bg-[#121319] text-slate-400 p-2 rounded-xl border border-slate-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#88BDF2] file:text-[#121319] hover:file:bg-[#5383B3] transition-all cursor-pointer" 
                onChange={e => setNewRuta({...newRuta, imagen: e.target.files[0]})} 
              />
            </div>

            <button 
              onClick={handlePublishRuta}
              disabled={isSaving}
              className="w-full bg-[#88BDF2] text-[#121319] p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg cursor-pointer mt-2 flex justify-center items-center gap-2 disabled:bg-slate-800 disabled:text-[#666D7E]"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isSaving ? "Publicando Itinerario..." : "Publicar Ruta en la Web"}
            </button>
          </div>
        </div>
      </div>

      {/* REJILLA DE RUTAS EXPUESTAS */}
      <div className="bg-[#121319] p-6 rounded-[2rem] border border-slate-800 shadow-inner">
         <h3 className="text-sm font-black text-[#6F7D93] uppercase tracking-widest mb-4 ml-2">Destinos Publicados</h3>
         
         {loading ? (
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#6F7D93] tracking-widest justify-center py-10">
              <Loader2 className="animate-spin text-[#88BDF2]" size={16} /> Sincronizando Geolocalizaciones...
            </div>
         ) : rutas.length === 0 ? (
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic py-8 text-center">No hay rutas publicadas aún.</p>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rutas.map(r => (
              <div key={r.id} className="bg-[#1E222F] p-4 rounded-2xl flex justify-between items-center shadow-lg border border-slate-800 hover:border-slate-700 transition-colors group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img 
                      src={r.imagen_url ? (r.imagen_url.startsWith('http') ? r.imagen_url : `${apiUrl}${r.imagen_url}`) : 'https://images.unsplash.com/photo-1596436889106-be35e843f974'} 
                      alt={r.titulo} 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700/60 shrink-0"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1596436889106-be35e843f974'; }}
                  />
                  <div className="min-w-0">
                    <p className="font-black text-xs uppercase italic text-white truncate pr-2">{r.titulo}</p>
                    <p className={`text-[9px] font-black uppercase tracking-tight mt-0.5 ${r.maps_url ? 'text-[#88BDF2]' : 'text-slate-600'}`}>
                      {r.maps_url ? '🗺️ GPS Vinculado' : '🚫 Sin coordenadas'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeleteRuta(r.id, r.titulo)} 
                  className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer flex-shrink-0 border border-transparent hover:border-rose-500/10"
                  title="Dar de baja destino"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
         )}
      </div>
    </div>
  );
}