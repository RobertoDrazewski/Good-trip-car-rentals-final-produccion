import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, CheckCircle, Loader2, Sparkles, Key, ShieldCheck, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Componente SetupPassword
 * Permite a los nuevos administradores configurar su contraseña inicial de forma segura.
 */
const SetupPassword = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    
    // Captura el email de la URL y le limpia espacios ocultos o mayúsculas molestas
    const emailRaw = searchParams.get('email') || '';
    const email = emailRaw.trim().toLowerCase();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [generatedUsername, setGeneratedUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (password !== confirmPassword) {
            setError(t('error_passwords_match', 'Las contraseñas ingresadas no coinciden.'));
            return;
        }

        if (password.length < 6) {
            setError(t('error_password_short', 'La contraseña de seguridad debe tener al menos 6 caracteres.'));
            return;
        }

        setLoading(true);
        try {
            // Conectamos nativamente al puerto 3000 de nuestro entorno centralizado
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            // Despachamos la petición al endpoint unificado del Backend
            const response = await axios.post(`${apiUrl}/api/auth/complete-setup`, {
                email: email,
                password: password
            });

            // Sincronizamos con las respuestas comunes de estados de éxito (data.status o data.success)
            if (response.data && (response.data.status === 'success' || response.data.success)) {
                const usernameAsignado = response.data.username || email.split('@')[0];
                setGeneratedUsername(usernameAsignado);
                setStatus('success');
                
                // Redirección física automatizada tras 6 segundos
                setTimeout(() => {
                    navigate('/login');
                }, 6000);
            } else {
                setError("El servidor unificado no devolvió una confirmación de éxito explícita.");
            }
        } catch (error) {
            console.error("❌ Error detectado en el submit de SetupPassword:", error);
            const errorServer = error.response?.data?.message || error.response?.data?.error || 'No se pudo establecer conexión con el backend central.';
            setError(`${t('chat_error', 'Fallo al activar credenciales:')} ${errorServer}`);
        } finally {
            setLoading(false);
        }
    };

    // 🏆 PANTALLA DE ÉXITO PREMIUM (Sincronizada con la paleta oscura de Balanz)
    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#121319] flex items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-[#1E222F] p-10 sm:p-16 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-800/40 animate-in zoom-in-95 duration-500 w-full max-w-xl">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-inner">
                        <CheckCircle size={40} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black italic text-white mb-2 uppercase tracking-tighter">
                        ¡Cuenta Activada!
                    </h1>
                    <p className="text-[#6F7D93] font-bold uppercase text-[10px] tracking-[0.2em] mb-6">
                        Tu credencial operativa quedó registrada con éxito en el sistema
                    </p>

                    {/* RECUADRO DE USUARIO OPERATIVO ASIGNADO */}
                    <div className="bg-[#121319] border border-slate-800/60 p-5 rounded-2xl max-w-sm mx-auto mb-6 text-left flex items-center gap-4 shadow-inner">
                        <div className="bg-[#1E222F] p-2.5 rounded-xl text-[#88BDF2] flex-shrink-0 border border-slate-800/30">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-[#666D7E] tracking-wider">Tu Usuario oficial para ingresar:</p>
                            <p className="text-base font-mono font-black text-white mt-0.5 tracking-tight selection:bg-[#5383B3]">{generatedUsername}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[#6F7D93]">
                        <Loader2 className="animate-spin text-[#88BDF2]" size={14} />
                        <p className="font-bold uppercase text-[9px] tracking-[0.3em]">
                            Redirigiendo al panel de inicio de sesión...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121319] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambientación radial Balanz */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#88BDF2]/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#5383B3]/10 blur-[150px] rounded-full pointer-events-none" />

            {/* TARJETA CONTENEDORA FORMULARIO */}
            <div className="bg-[#1E222F] w-full max-w-md rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-10 md:p-14 relative z-10 border border-slate-800/40">
                
                <div className="text-center mb-10">
                    <div className="bg-[#121319] w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-800/60 -rotate-3">
                        <Key className="text-[#88BDF2]" size={36} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                        {t('setup_title', 'Configurar')} <br/>
                        <span className="text-[#88BDF2] not-italic">{t('setup_subtitle', 'Contraseña')}</span>
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
                         <ShieldCheck size={12} className="text-[#6F7D93]" />
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6F7D93] truncate max-w-[250px]">
                            {email || "Módulo de Seguridad"}
                         </p>
                    </div>
                </div>

                {/* ALERTA DE ERROR VISUAL INCORPORADA */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in shake duration-300">
                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-red-300 font-semibold leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#666D7E] uppercase tracking-[0.2em] ml-4 italic">
                            {t('label_new_password', 'Nueva Contraseña')}
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#666D7E] group-focus-within:text-[#88BDF2] transition-colors" size={20} />
                            <input 
                                type="password" 
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#121319] border-2 border-transparent p-5 pl-14 rounded-[1.8rem] outline-none focus:border-[#88BDF2] text-white placeholder-[#666D7E] transition-all font-black shadow-inner"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#666D7E] uppercase tracking-[0.2em] ml-4 italic">
                            {t('label_confirm_password', 'Confirmar Contraseña')}
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#666D7E] group-focus-within:text-[#88BDF2] transition-colors" size={20} />
                            <input 
                                type="password" 
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#121319] border-2 border-transparent p-5 pl-14 rounded-[1.8rem] outline-none focus:border-[#88BDF2] text-white placeholder-[#666D7E] transition-all font-black shadow-inner"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* BOTÓN PRINCIPAL ACCIÓN */}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#88BDF2] text-[#121319] py-5 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-[#5383B3] hover:text-white transition-all active:scale-95 disabled:bg-slate-800 disabled:text-[#666D7E] flex items-center justify-center gap-2 group cursor-pointer touch-manipulation"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin text-[#121319]" size={20} />
                        ) : (
                            <>
                                <Sparkles size={16} /> {t('btn_activate', 'ACTIVAR MI CUENTA')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupPassword;