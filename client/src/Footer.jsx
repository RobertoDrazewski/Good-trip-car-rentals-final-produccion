// client/src/Footer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';

// Mismo logo blanco que usamos en la aplicación
import logoBlanco from './assets/logo.webp';

export default function Footer() {
  const navigate = useNavigate();

  const INSTAGRAM_URL = "https://www.instagram.com/goodtripcarrentals/";
  const WHATSAPP_NUMBER = "5492612764618";
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola, Good Trip Mendoza.`;

  return (
    // Reducido el padding vertical (pt-6 pb-6) para achicar el footer a la mitad
    <footer className="relative bg-[#121319]/90 backdrop-blur-md border-t border-slate-800/60 pt-6 pb-6 w-full text-white z-50">
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-[11px] font-bold">

        {/* IZQUIERDA: Copyright, Teléfono e Instagram */}
        <div className="flex flex-col items-center md:items-start gap-2 text-slate-300 uppercase tracking-wider text-center md:text-left">
          <p className="text-white">© Good Trip Car Rentals Mendoza</p>
          <div className="flex items-center gap-5">
            <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={13} className="text-[#88BDF2]" /> +54 9 261 276-4618
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        {/* CENTRO: Logo reducido a la mitad y bordes redondeados suaves */}
        <div className="flex flex-col items-center gap-2">
          <img 
            src={logoBlanco} 
            alt="Good Trip Logo" 
            className="h-24 w-auto object-contain opacity-95 rounded-2xl shadow-md border border-white/5" 
          />
          <p className="text-[9px] uppercase tracking-widest text-[#666D7E] text-center">
            Powered by <a href="https://puma-code.com" className="text-[#88BDF2] hover:text-white transition-colors">Puma-Code.com</a><br/>
            Est. Mendoza 2026 • Copyright Puma Code
          </p>
        </div>

        {/* DERECHA: Acceso Staff (minimalista) */}
        <div className="flex justify-center md:justify-end w-full">
          <button 
            onClick={() => navigate('/login')} 
            className="text-slate-500 hover:text-[#88BDF2] transition-colors border border-slate-800/80 hover:border-[#88BDF2]/30 px-3 py-1.5 rounded-xl uppercase tracking-widest text-[9px] bg-[#121319]/40"
          >
            Acceso Staff
          </button>
        </div>

      </div>
    </footer>
  );
}