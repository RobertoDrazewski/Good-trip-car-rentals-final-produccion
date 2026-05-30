// client/src/ChatIA.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; // 👈 Corregido el import erróneo para que Vite resuelva con éxito
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';

export default function ChatIA() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const NUMERO_ATENCION = "5492612764618";

  const [isOpen, setIsOpen] = useState(false); 
  const [messages, setMessages] = useState([
    { role: 'system_initial', content: '¡Hola! Bienvenido a Good Trip Car Rentals. ¿En qué puedo ayudarle hoy con su alquiler en Mendoza?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/chat/mensaje`, {
        message: userMessage,
        lang: 'es',
        userData: { plataforma: "Web Oficial", origen: "Widget Flotante" }
      });

      if (res.data && res.data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Disculpe las molestias, no he podido procesar la respuesta.' }]);
      }
    } catch (error) {
      console.error("❌ Error en comunicación con el asesor IA:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Nuestros canales están saturados. Por favor, intente de nuevo en unos instantes.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-3 selection:bg-[#88BDF2] selection:text-[#121319]">
      
      {/* 🟢 BOTÓN FLOTANTE DE WHATSAPP */}
      {!isOpen && (
        <a
          href={`https://wa.me/${NUMERO_ATENCION}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-emerald-500/20 group relative"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.4.011 11.948.011c3.176.001 6.165 1.236 8.413 3.484 2.248 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.894-11.893 11.894-2.007-.001-3.98-.51-5.734-1.478L0 24zm6.59-4.846c1.657.982 3.511 1.5 5.405 1.501 5.346 0 9.7-4.351 9.702-9.702 0-2.593-1.01-5.032-2.846-6.868-1.837-1.837-4.275-2.846-6.87-2.847-5.345 0-9.697 4.351-9.699 9.701-.001 1.944.505 3.843 1.468 5.516l-.979 3.575 3.664-.961zm11.23-5.35c-.321-.16-1.896-.938-2.187-1.042-.295-.105-.509-.16-.723.16-.214.32-.83.1.042-1.016.23-.105.46-.225.723-.16.267.064.534.16.748.48.214.321.214 1.18-.107 1.5-.321.322-.534.428-.748.642-.214.214-.483.447-.214.855.267.427 1.18 1.933 2.532 3.132 1.733 1.54 3.195 2.015 3.649 2.228.455.214.91.16 1.248-.16.338-.321 1.474-1.712 1.865-2.247.391-.535.783-.445 1.21-.286.427.16 2.716 1.28 3.186 1.515.47.235.783.347.89.535.107.187.107 1.07-.214 1.39z"/>
          </svg>
          <span className="absolute right-14 bg-[#1E222F] text-white border border-slate-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
            Soporte por WhatsApp
          </span>
        </a>
      )}

      {/* 🤖 BOTÓN FLOTANTE PRINCIPAL DE LA IA */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#88BDF2] text-[#121319] p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-[#88BDF2]/20 group relative"
        >
          <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute right-14 bg-[#1E222F] text-white border border-slate-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
            ¿Consultas? Habla con la IA
          </span>
        </button>
      )}

      {/* VENTANA INTERACTIVA DEL ASESOR COMERCIAL */}
      {isOpen && (
        <div className="bg-[#1E222F] w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[80vh] rounded-3xl border border-slate-800/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-[#121319] p-4 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#88BDF2]/10 rounded-xl text-[#88BDF2] border border-[#88BDF2]/20">
                <Bot size={18} />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-white leading-none">Asesor Virtual</h3>
                <span className="text-[9px] text-[#6F7D93] font-mono uppercase tracking-widest block mt-1">Good Trip IA Active</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Caja de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-left scrollbar-none bg-[#161924]">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#88BDF2] text-[#121319] font-bold rounded-tr-none' 
                    : 'bg-[#1E222F] text-slate-200 border border-slate-800/60 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-[#1E222F]/40 px-3 py-2 rounded-xl border border-slate-800/40 w-fit animate-pulse">
                <Loader2 size={12} className="animate-spin text-[#88BDF2]" />
                Procesando cotización...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Caja de Entrada de Texto */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#121319] border-t border-slate-800/60 flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunte por autos, tarifas o requisitos..."
              className="flex-1 bg-[#1E222F] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#88BDF2] transition-colors placeholder:text-slate-500 font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#88BDF2] text-[#121319] px-3.5 rounded-xl hover:bg-[#88BDF2]/90 disabled:opacity-40 disabled:hover:bg-[#88BDF2] transition-colors flex items-center justify-center cursor-pointer shadow-md active:scale-95"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}