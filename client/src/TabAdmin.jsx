// client/src/TabAdmin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Users, Trash2, Loader2, Sparkles, AlertCircle, User, Mail, Shield } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TabAdmin() {
  const [admins,     setAdmins]     = useState([]);
  const [newAdmin,   setNewAdmin]   = useState({ nombre: '', email: '' });
  const [loading,    setLoading]    = useState(false);
  const [inviting,   setInviting]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchAdmins = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${API}/api/auth/users`, auth());
      setAdmins(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError('No se pudo cargar el directorio de administradores.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async () => {
    if (!newAdmin.nombre.trim() || !newAdmin.email.trim()) {
      setError('Completá nombre y email.'); return;
    }
    setInviting(true); setError(null); setSuccess(null);
    try {
      const { data } = await axios.post(`${API}/api/auth/invite-admin`, {
        name:  newAdmin.nombre.trim(),
        email: newAdmin.email.trim().toLowerCase(),
      }, auth());
      setSuccess(`✅ Admin creado. Usuario: ${data.username} — Las credenciales fueron enviadas a goodtripmendoza@gmail.com`);
      setNewAdmin({ nombre: '', email: '' });
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el administrador.');
    } finally { setInviting(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el acceso de ${nombre}? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/api/auth/users/${id}`, auth());
      setAdmins(p => p.filter(a => a.id !== id));
    } catch (err) {
      setError('Error al eliminar el administrador.');
    } finally { setDeletingId(null); }
  };

  const inp = "w-full bg-[#121319] border-2 border-transparent p-4 pl-5 rounded-xl outline-none focus:border-[#88BDF2] text-white placeholder-[#666D7E] transition-all font-bold text-sm shadow-inner";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={16}/>
          <p className="text-xs text-red-300 font-semibold">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
          <Shield className="text-emerald-400 shrink-0" size={16}/>
          <p className="text-xs text-emerald-300 font-semibold">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORMULARIO ALTA */}
        <div className="lg:col-span-1 bg-[#1E222F] p-6 md:p-8 rounded-[1.5rem] shadow-xl border border-slate-800/40 h-fit space-y-5">
          <h2 className="text-lg font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
            <UserPlus size={20} className="text-[#88BDF2]"/> Nuevo Admin
          </h2>

          <div>
            <label className="text-[9px] font-black text-[#666D7E] uppercase tracking-wider block mb-1.5 ml-1">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7D93]" size={14}/>
              <input placeholder="Carlos Mendoza" className={inp + " pl-9"}
                value={newAdmin.nombre} onChange={e => setNewAdmin({...newAdmin, nombre: e.target.value})}/>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-[#666D7E] uppercase tracking-wider block mb-1.5 ml-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7D93]" size={14}/>
              <input type="email" placeholder="carlos@goodtrip.com" className={inp + " pl-9"}
                value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}/>
            </div>
          </div>

          <div className="bg-[#121319] p-3 rounded-xl border border-slate-800/40 text-[10px] text-slate-400 leading-relaxed">
            Se generará un <strong className="text-white">usuario</strong> y <strong className="text-white">contraseña temporal</strong> automáticamente.
            Las credenciales se enviarán a <span className="text-[#88BDF2]">goodtripmendoza@gmail.com</span>.
          </div>

          <button disabled={inviting} onClick={handleCreate}
            className="w-full bg-[#88BDF2] text-[#121319] p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 uppercase tracking-wider hover:bg-white transition-all cursor-pointer disabled:bg-slate-800/60 disabled:text-[#666D7E] shadow-lg">
            {inviting ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
            {inviting ? 'Creando...' : 'Crear y Enviar Credenciales'}
          </button>
        </div>

        {/* DIRECTORIO */}
        <div className="lg:col-span-2 bg-[#1E222F] p-6 md:p-8 rounded-[1.5rem] shadow-xl border border-slate-800/40">
          <h2 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
            <Users size={20} className="text-[#88BDF2]"/> Directorio Activo
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#6F7D93] tracking-widest justify-center py-20">
              <Loader2 className="animate-spin text-[#88BDF2]" size={18}/> Sincronizando...
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center text-xs font-bold text-[#6F7D93] uppercase tracking-wider py-20 italic">
              No hay administradores adicionales registrados.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {admins.map(a => (
                <div key={a.id} className="bg-[#121319] p-4 rounded-2xl flex items-center gap-4 border border-slate-800/60 hover:border-slate-700 transition-colors group relative">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-[#1E222F] rounded-xl flex items-center justify-center text-[#88BDF2] font-black text-lg border border-slate-800 shrink-0">
                    {(a.nombre || a.username || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-10">
                    <p className="font-black text-white text-sm uppercase truncate">{a.nombre}</p>
                    <p className="text-[10px] text-[#88BDF2] font-mono mt-0.5 truncate">@{a.username}</p>
                    <p className="text-[9px] text-slate-500 truncate">{a.email}</p>
                    <span className="inline-block mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {a.rol || 'admin'}
                    </span>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(a.id, a.nombre)}
                    disabled={deletingId === a.id}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Eliminar administrador">
                    {deletingId === a.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
