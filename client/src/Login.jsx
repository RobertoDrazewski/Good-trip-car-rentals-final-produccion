// client/src/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    try {
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });
      if (res.data.token) {
        localStorage.setItem('token',     res.data.token);
        localStorage.setItem('adminUser', res.data.username || form.username);
        if (onLoginSuccess) onLoginSuccess();
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121319] flex items-center justify-center p-4 relative overflow-hidden text-white font-sans">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#88BDF2]/10 blur-[150px] rounded-full -z-0"/>

      <div className="bg-[#1E222F] w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 sm:p-12 relative z-10 border border-slate-800/40">
        <div className="text-center mb-8">
          <div className="bg-[#121319] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-slate-800/60 rotate-3">
            <Lock className="text-[#88BDF2] w-6 h-6" strokeWidth={2.5}/>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            Good Trip <br/><span className="text-[#88BDF2] not-italic">Admin Panel</span>
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={16}/>
            <p className="text-xs text-red-300 font-semibold text-left">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#666D7E] uppercase tracking-[0.2em] ml-2">
              Usuario
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666D7E] group-focus-within:text-[#88BDF2] w-4 h-4 transition-colors"/>
              <input
                type="text"
                placeholder="robertodrazewski"
                required
                autoComplete="username"
                className="w-full bg-[#121319] border-2 border-transparent p-4 pl-12 rounded-2xl outline-none focus:border-[#88BDF2] text-white text-sm font-bold shadow-inner transition-all placeholder-[#4e5361]"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#666D7E] uppercase tracking-[0.2em] ml-2">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666D7E] group-focus-within:text-[#88BDF2] w-4 h-4 transition-colors"/>
              <input
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-[#121319] border-2 border-transparent p-4 pl-12 rounded-2xl outline-none focus:border-[#88BDF2] text-white text-sm font-bold shadow-inner transition-all placeholder-[#4e5361]"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          <button disabled={loading} type="submit"
            className="w-full bg-[#88BDF2] text-[#121319] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-white transition-all disabled:bg-slate-800/80 disabled:text-[#666D7E] flex items-center justify-center gap-2 cursor-pointer mt-2">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <><Sparkles size={14}/> Ingresar al Panel</>}
          </button>
        </form>
      </div>
    </div>
  );
}
