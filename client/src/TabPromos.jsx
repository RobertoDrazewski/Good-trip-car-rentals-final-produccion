// client/src/TabPromos.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Loader2, Trash2, Calendar, Percent, Plus, Eye } from 'lucide-react';

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

  useEffect(() => { 
    fetchBanners(); 
  }, []);

  const generarPropuestaIA = async (e) => {
    e.preventDefault();
    if (!promoData.evento) return alert("Por favor, escribe un evento o temporada.");
    
    setIaLoading(true);
    setPropuestaIA(null);
    
    try {
      const res = await axios.post(`${API_BASE_URL}/api/banners/generar-propuesta`, {
        evento: promoData.evento,
        descuento: promoData.descuento
      }, getAuthConfig());
      
      setPropuestaIA(res.data);
    } catch (err) {
      console.error("Error al generar propuesta con IA:", err);
      alert("No se pudo generar la propuesta. Revisa la consola o los tokens de OpenAI.");
    } finally {
      setIaLoading(false);
    }
  };

  const guardarYActivarPromo = async () => {
    if (!propuestaIA) return;
    setSaveLoading(true);
    
    try {
      await axios.post(`${API_BASE_URL}/api/banners/save-promo`, {
        titulo: propuestaIA.titulo,
        descripcion: propuestaIA.descripcion,
        imagen_url: propuestaIA.imagen_url,
        descuento: propuestaIA.descuento,
        fecha_inicio: promoData.inicio || null,
        fecha_fin: promoData.fin || null
      }, getAuthConfig());
      
      alert("¡Promoción procesada, compuesta con éxito y activada en el Home!");
      setPropuestaIA(null);
      setPromoData({ evento: '', descuento: '10', inicio: '', fin: '' });
      fetchBanners();
    } catch (err) {
      console.error("Error al guardar promoción:", err);
      alert("Error al intentar almacenar y componer el banner en Cloudinary.");
    } finally {
      setSaveLoading(false);
    }
  };

  const eliminarBanner = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta promoción de la base de datos?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/banners/${id}`, getAuthConfig());
      fetchBanners();
    } catch (err) {
      console.error("Error al eliminar banner:", err);
      alert("No se pudo eliminar el elemento.");
    }
  };

  const esPromoMacro = propuestaIA && /macro/i.test(`${propuestaIA.titulo || ''} ${promoData.evento || ''}`);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <form onSubmit={generarPropuestaIA} className="lg:col-span-5 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="text-amber-400" size={18} />
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Director Creativo IA</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider">Motivo / Evento Comercial</label>
            <input 
              type="text"
              placeholder="ej: Invierno Macro, Promo de la Vendimia..."
              value={promoData.evento}
              onChange={(e) => setPromoData({ ...promoData, evento: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 font-medium transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider">Descuento (%)</label>
              <div className="relative">
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={promoData.descuento}
                  onChange={(e) => setPromoData({ ...promoData, descuento: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm text-white font-mono focus:outline-none focus:border-amber-500/50"
                />
                <Percent size={14} className="absolute right-3.5 top-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider">Vigencia Inicio</label>
              <div className="relative">
                <input 
                  type="date"
                  value={promoData.inicio}
                  onChange={(e) => setPromoData({ ...promoData, inicio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider">Vigencia Fin (Opcional)</label>
            <input 
              type="date"
              value={promoData.fin}
              onChange={(e) => setPromoData({ ...promoData, fin: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={iaLoading || saveLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-950/20 cursor-pointer disabled:cursor-not-allowed"
          >
            {iaLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Diseñando Arte en Potrerillos...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generar Propuesta con IA</span>
              </>
            )}
          </button>
        </form>

        <div className="lg:col-span-7 bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
          {iaLoading && (
            <div className="text-center space-y-3 z-10 animate-pulse">
              <div className="p-4 bg-amber-500/10 rounded-full w-14 h-14 flex items-center justify-center border border-amber-500/20 mx-auto">
                <Loader2 className="text-amber-400 animate-spin" size={24} />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Componiendo prompt premium 8k...</p>
            </div>
          )}

          {!iaLoading && !propuestaIA && (
            <div className="text-center p-8 space-y-2 text-slate-600 font-mono text-[10px] uppercase tracking-widest">
              <Eye size={28} className="mx-auto mb-2 text-slate-700 stroke-[1.5]" />
              A la espera de una propuesta comercial
            </div>
          )}

          {!iaLoading && propuestaIA && (
            <div className="w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight">{propuestaIA.titulo}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{propuestaIA.descripcion}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] font-mono text-amber-400 font-bold uppercase">
                  Preview de Ajuste
                </div>
              </div>

              {/* SIMULADOR CORREGIDO: Ahora muestra el recorte panorámico real de la web */}
              <div className="relative w-full mx-auto h-48 md:h-64 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl group">
                <img 
                  src={propuestaIA.imagen_url} 
                  alt="Propuesta IA" 
                  className="w-full h-full object-cover object-[center_60%]"
                />
                
                {esPromoMacro && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 pb-12">
                    <div className="w-[30%] min-w-[120px] flex items-center justify-center animate-scaleIn drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
                      <img 
                        src="/src/assets/macro-logo.png" 
                        alt="Banco Macro"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                        className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      />
                      <span className="hidden text-white font-black text-center tracking-tighter text-xl font-sans uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
                        BANCO MACRO
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {esPromoMacro && (
                <p className="text-[10px] font-mono text-center text-cyan-400 bg-cyan-950/30 border border-cyan-800/30 py-1.5 px-3 rounded-lg max-w-md mx-auto uppercase tracking-wide">
                  ✨ Vista Previa Real: Auto visible y Logo balanceado para el Home.
                </p>
              )}

              <div className="pt-2 flex justify-center">
                <button
                  onClick={guardarYActivarPromo}
                  disabled={saveLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/20 cursor-pointer"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Estampando Logo y Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Guardar y Activar en Web</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
          <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">Campañas y Banners Cargados</h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-mono font-bold">
            {banners.length} TOTAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3.5 font-black">Miniatura</th>
                <th className="px-6 py-3.5 font-black">Campaña / Descripción</th>
                <th className="px-6 py-3.5 font-black">Beneficio</th>
                <th className="px-6 py-3.5 font-black">Vigencia</th>
                <th className="px-6 py-3.5 font-black text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {banners.length > 0 ? banners.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow-inner relative flex items-center justify-center">
                      <img 
                        src={b.imagen_url} 
                        alt="Thumb" 
                        className="w-full h-full object-cover object-[center_60%] group-hover:scale-105 transition-transform duration-300"
                      />
                      {/macro/i.test(`${b.titulo} ${b.descripcion}`) && (
                        <span className="absolute bottom-0 right-0 left-0 bg-blue-600 text-[8px] font-black font-sans text-white text-center py-0.5 uppercase tracking-tighter">
                          MACRO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white block text-xs">{b.titulo}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block max-w-xs truncate">{b.descripcion}</span>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-black font-mono text-xs">
                    {Number(b.descuento) > 0 ? `${b.descuento}% OFF` : 'Precio de lista'}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-600">INICIO:</span> {b.fecha_inicio ? b.fecha_inicio.substring(0, 10) : 'S/D'}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-slate-600">FINAL:</span> {b.fecha_fin ? b.fecha_fin.substring(0, 10) : 'S/D'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => eliminarBanner(b.id)} 
                      className="text-rose-500 hover:text-white p-2.5 bg-rose-500/5 rounded-xl border border-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Eliminar campaña"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic uppercase text-[10px] tracking-widest font-black font-mono">
                    No hay promociones configuradas en la base de datos.
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