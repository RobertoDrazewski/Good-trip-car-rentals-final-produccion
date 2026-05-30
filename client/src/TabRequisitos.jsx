import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, CheckCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TabRequisitos() {
  const [requisitos, setRequisitos] = useState([]);
  const [newReq,     setNewReq]     = useState({ icono: '📌', titulo: '', descripcion: '' });
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchRequisitos = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${API}/api/admin/requisitos`, auth());
      setRequisitos(Array.isArray(data) ? data : data.requisitos || []);
    } catch { setError('No se pudo cargar los requisitos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequisitos(); }, []);

  const handleAdd = async () => {
    if (!newReq.titulo.trim() || !newReq.descripcion.trim()) {
      alert('Completá el título y la descripción.'); return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/api/admin/requisitos`, {
        icono: newReq.icono,
        titulo: newReq.titulo.trim(),
        descripcion: newReq.descripcion.trim()
      }, auth());
      setNewReq({ icono: '📌', titulo: '', descripcion: '' });
      fetchRequisitos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este requisito?')) return;
    try {
      await axios.delete(`${API}/api/admin/requisitos/${id}`, auth());
      setRequisitos(p => p.filter(r => r.id !== id));
    } catch { alert('Error al eliminar.'); }
  };

  const inp = "w-full bg-[#121319] border-2 border-transparent p-4 rounded-xl outline-none focus:border-[#88BDF2] text-white placeholder-slate-500 transition-all font-semibold text-base shadow-inner";
  const lbl = "text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={18}/>
          <p className="text-sm text-red-300 font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-[#1E222F] p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-800/40">

        {/* Título */}
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3">
          <ClipboardList size={26} className="text-[#88BDF2]"/>
          Términos y Requisitos
        </h2>

        {/* Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="md:col-span-1">
            <label className={lbl}>Ícono</label>
            <select className={inp + " cursor-pointer"} value={newReq.icono}
              onChange={e => setNewReq({...newReq, icono: e.target.value})}>
              <option value="📌">📌 Pin</option>
              <option value="🛡️">🛡️ Escudo</option>
              <option value="🚗">🚗 Auto</option>
              <option value="💳">💳 Tarjeta</option>
              <option value="🗺️">🗺️ Mapa</option>
              <option value="⛽">⛽ Combustible</option>
              <option value="👥">👥 Usuarios</option>
              <option value="⏱️">⏱️ Tiempo</option>
              <option value="✅">✅ Check</option>
              <option value="📋">📋 Contrato</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={lbl}>Título del Requisito</label>
            <input placeholder="Ej: Edad mínima requerida" className={inp}
              value={newReq.titulo} onChange={e => setNewReq({...newReq, titulo: e.target.value})}/>
          </div>

          <div className="md:col-span-3">
            <label className={lbl}>Descripción</label>
            <textarea placeholder="Ej: El conductor principal debe ser mayor de 21 años y contar con licencia vigente."
              className={inp + " resize-none h-24"} value={newReq.descripcion}
              onChange={e => setNewReq({...newReq, descripcion: e.target.value})}/>
          </div>

          <div className="md:col-span-3">
            <button onClick={handleAdd} disabled={saving}
              className="w-full bg-[#88BDF2] text-[#121319] p-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all shadow-lg flex justify-center items-center gap-2 disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
              {saving ? 'Guardando...' : 'Agregar Requisito'}
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center gap-3 text-sm font-black uppercase text-slate-500 tracking-widest justify-center py-12">
            <Loader2 className="animate-spin text-[#88BDF2]" size={20}/> Cargando...
          </div>
        ) : requisitos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-500 text-sm font-bold italic">No hay requisitos cargados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requisitos.map(req => (
              <div key={req.id}
                className="bg-[#121319] p-5 rounded-2xl flex items-start gap-4 border border-slate-800/60 hover:border-slate-700 transition-colors group relative">

                {/* Ícono */}
                <div className="text-2xl shrink-0 bg-[#1E222F] w-14 h-14 flex items-center justify-center rounded-xl border border-slate-800">
                  {req.icono || '📌'}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0 pr-10">
                  <h4 className="font-black text-white text-sm uppercase tracking-wide leading-tight">
                    {req.titulo}
                  </h4>
                  <p className="text-sm text-slate-300 font-medium mt-1.5 leading-relaxed">
                    {req.descripcion}
                  </p>
                </div>

                {/* Eliminar */}
                <button onClick={() => handleDelete(req.id)}
                  className="absolute right-4 top-4 text-slate-600 hover:text-rose-500 bg-[#1E222F] p-2 rounded-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-all hover:border-rose-500/20 hover:bg-rose-500/5 cursor-pointer"
                  title="Eliminar requisito">
                  <Trash2 size={15}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
