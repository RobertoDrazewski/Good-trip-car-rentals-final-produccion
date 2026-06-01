// client/src/Footer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';

// Mismo logo blanco que usamos en GoogleReviews
import logoBlanco from './assets/logo.png';

export default function Footer() {
  const navigate = useNavigate();

  const INSTAGRAM_URL = "https://www.instagram.com/goodtripcarrentals/";
  const WHATSAPP_NUMBER = "5492612764618";
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola, Good Trip Mendoza.`;

  return (
    <footer className="relative bg-[#121319]/90 backdrop-blur-md border-t border-slate-800/60 pt-12 pb-8 w-full text-white z-50">
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-center text-[11px] font-bold">

        {/* IZQUIERDA: Copyright, Teléfono e Instagram */}
        <div className="flex flex-col items-center md:items-start gap-3 text-slate-300 uppercase tracking-wider text-center md:text-left">
          <p className="text-white">© Good Trip Car Rentals Mendoza</p>
          <div className="flex items-center gap-5">
            <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#25D366] transition-colors">
              <Phone size={14} /> +54 9 261 276-4618
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex items-center hover:text-[#E1306C] transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        {/* CENTRO: Logo blanco + créditos Puma Code */}
        <div className="flex flex-col items-center gap-3">
          <img src={logoBlanco} alt="Good Trip Logo" className="h-48 w-auto object-contain opacity-95" />
          <p className="text-[9px] uppercase tracking-widest text-[#666D7E] text-center">
            Powered by <a href="https://puma-code.com" className="text-[#88BDF2] hover:text-white transition-colors">Puma-Code.com</a><br/>
            Est. Mendoza 2026 • Copyright Puma Code
          </p>
        </div>

        {/* DERECHA: Acceso Staff (minimalista) */}
        <div className="flex justify-center md:justify-end">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-[#1E222F] hover:bg-[#88BDF2] text-[#88BDF2] hover:text-[#121319] transition-all rounded-lg uppercase tracking-wider font-bold border border-slate-800"
          >
            Acceso Staff
          </button>
        </div>
      </div>
    </footer>
  );
}
