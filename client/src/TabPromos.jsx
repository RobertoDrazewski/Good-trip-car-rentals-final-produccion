// client/src/TabPromos.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Loader2, Trash2, Calendar, Percent, Plus } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TabPromos() {
  const [banners, setBanners] = useState([]);
  const [promoData, setPromoData] = useState({ evento: '', descuento: '10', inicio: '', fin: '' });
  const [propuestaIA, setPropuestaIA] = useState(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/banners/all`, getAuthConfig());
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar banners:", err);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const generarPropuestaIA = async (e) => {
    e.preventDefault();
    if (!promoData.evento) return alert("Escribe un evento (ej: Invierno, Fiesta de la Vendimia)");
    setIaLoading(true);
    setPropuestaIA(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/banners/generar-propuesta`, promoData, getAuthConfig());
      setPropuestaIA(res.data);
    } catch (err) {
      alert("Error al conectar con la IA.");
    } finally {
      setIaLoading(false);
    }
  };

  const guardarBannerBD = async () => {
    if (!propuestaIA) return;
    setSaveLoading(true);
    try {
      const payload = {
        titulo: propuestaIA.titulo,
        descripcion: propuestaIA.descripcion,
        imagen_url: propuestaIA.imagen_url,
        descuento: propuestaIA.descuento,
        fecha_inicio: promoData.inicio || null,
        fecha_fin: promoData.fin || null
      };

      await axios.post(`${API_BASE_URL}/api/banners/save-promo`, payload, getAuthConfig());
      alert("¡Banner guardado y publicado en la Base de Datos!");
      setPropuestaIA(null);
      setPromoData({ evento: '', descuento: '10', inicio: '', fin: '' });
      fetchBanners();
    } catch (err) {
      alert("Error al intentar guardar el banner.");
    } finally {
      setSaveLoading(false);
    }
  };

  const eliminarBanner = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este banner de la base de datos?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/banners/${id}`, getAuthConfig());
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider">Estudio de Cupones & Renders IA</h1>
        <p className="text-xs text-slate-500 uppercase font-bold mt-1">Crea banners dinámicos vinculados directamente con tu base de datos MySQL.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULARIO DE CREACIÓN */}
        <div className="bg-[#1E222F] border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={14} className="text-[#88BDF2]" /> Configurar Campaña Creativa
          </h3>
          
          <form onSubmit={generarPropuestaIA} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Nombre de la Temporada / Evento</label>
              <input 
                type="text" 
                placeholder="Ej: Vendimia, Alta Montaña, Find de Semana Largo"
                value={promoData.evento}
                onChange={e => setPromoData({...promoData, evento: e.target.value})}
                className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#88BDF2]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">% Descuento</label>
                <input 
                  type="number" 
                  min="5" max="90"
                  value={promoData.descuento}
                  onChange={e => setPromoData({...promoData, descuento: e.target.value})}
                  className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#88BDF2] font-mono text-center"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Vigencia Desde</label>
                <input 
                  type="date" 
                  value={promoData.inicio}
                  onChange={e => setPromoData({...promoData, inicio: e.target.value})}
                  className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#88BDF2]"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Vigencia Hasta</label>
                <input 
                  type="date" 
                  value={promoData.fin}
                  onChange={e => setPromoData({...promoData, fin: e.target.value})}
                  className="w-full bg-[#121319] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#88BDF2]"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={iaLoading}
              className="w-full bg-[#88BDF2] text-[#121319] font-black text-xs uppercase tracking-widest p-3 rounded-xl hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              {iaLoading ? <Loader2 className="animate-spin" size={14} /> : '⚡ Redactar Banner con IA'}
            </button>
          </form>
        </div>

        {/* PREVISUALIZACIÓN DE PROPUESTA IA */}
        <div className="bg-[#1E222F] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[250px]">
          {propuestaIA ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[9px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Propuesta Creativa Activa</span>
                <img src={propuestaIA.imagen_url} className="w-full h-32 object-cover rounded-xl border border-slate-800 shadow-md" alt="Render" />
                <h4 className="font-black text-sm text-white">{propuestaIA.titulo} — <span className="text-emerald-400">{propuestaIA.descuento}% OFF</span></h4>
                <p className="text-xs text-slate-300 leading-relaxed italic">"{propuestaIA.descripcion}"</p>
              </div>
              <button 
                onClick={guardarBannerBD}
                disabled={saveLoading}
                className="w-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest p-3 rounded-xl hover:bg-emerald-400 transition-all cursor-pointer flex items-center justify-center gap-1 mt-4"
              >
                {saveLoading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Guardar y Activar en Web
              </button>
            </div>
          ) : (
            <div className="m-auto text-center space-y-2 text-slate-600">
              <Sparkles size={28} className="mx-auto text-slate-700 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-wider">Completa los parámetros para generar el render promocional</p>
            </div>
          )}
        </div>
      </div>

      {/* REJILLA DE BANNERS HISTÓRICOS DESDE LA BD */}
      <div className="bg-[#1E222F] border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800/50">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Banners Registrados en MySQL</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#121319]/50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Imagen</th>
                <th className="px-6 py-4">Campaña / Título</th>
                <th className="px-6 py-4">Descuento</th>
                <th className="px-6 py-4">Vigencia</th>
                <th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {banners.length > 0 ? banners.map((b) => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <img src={b.imagen_url} className="w-20 h-11 object-cover rounded-lg border border-white/10" alt="Banner" />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-white uppercase block">{b.titulo}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block max-w-xs truncate">{b.descripcion}</span>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-black font-mono">{b.descuento}% OFF</td>
                  <td className="px-6 py-4 text-[10px] font-mono text-slate-400">
                    <div>INICIO: {b.fecha_inicio ? b.fecha_inicio.substring(0, 10) : 'S/D'}</div>
                    <div className="mt-0.5">FINAL: {b.fecha_fin ? b.fecha_fin.substring(0, 10) : 'S/D'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => eliminarBanner(b.id)} 
                      className="text-rose-500 hover:text-white p-2.5 bg-rose-500/5 rounded-xl border border-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic uppercase text-[10px] tracking-widest font-black">
                    No hay registros de cupones ni banners activos en la tabla de MySQL.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}