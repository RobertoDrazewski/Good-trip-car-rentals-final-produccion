import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

// 🔌 Conexión con la carpeta de assets
import logoCuadrado from './assets/logocuadrado.png'; 

export default function Hero() {
  const { t } = useTranslation();

  return (
    <div className="relative w-full h-auto py-6 md:py-10 text-white px-4 sm:px-8 md:px-16 flex flex-col justify-center items-center overflow-hidden bg-transparent flex-shrink-0">
      
      {/* Brillo radial de acento de servicios centrado sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#88BDF2]/10 via-transparent to-transparent opacity-60 pointer-events-none z-1" />

      {/* CONTENEDOR CENTRAL: gap-2 para mantenerlo compacto pero natural */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center text-center gap-2 max-w-4xl mx-auto">
        
        {/* 1. LOGO (Con el aumento del 30% mantenido) */}
        <img 
          src={logoCuadrado} 
          alt="Good Trip Car Rentals Logo" 
          className="w-72 h-72 sm:w-80 sm:h-80 lg:w-[400px] lg:h-[400px] object-contain flex-shrink-0 filter drop-shadow-[0_10px_30px_rgba(136,189,242,0.05)] animate-in fade-in zoom-in-95 duration-700"
        />

        {/* 2. BLOQUE DE TEXTO (Sin márgenes negativos, flujo natural) */}
        <div className="flex flex-col items-center w-full px-2 z-20">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic text-white drop-shadow-[0_4px_12px_rgba(18,19,25,0.8)] leading-none mb-2">
            Good Trip <br className="sm:hidden" />
            <span className="text-[#88BDF2] not-italic">Car Rentals</span>
          </h2>
          
          <p className="text-xs sm:text-sm md:text-base opacity-90 text-white font-bold max-w-xl leading-snug text-center balance">
            {t('hero_subtitle', 'Recorré Mendoza de acuerdo a tus tiempos!. Alquilá tu auto y accedé a nuestras guías interactivas en Google Maps con un solo clic. Servicio premium 5 estrellas')}
          </p>
        </div>

        {/* 3. PRUEBA SOCIAL / ESTRELLAS */}
        <div className="flex items-center gap-2 bg-[#1E222F]/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/60 shadow-2xl flex-shrink-0 mt-4">
          <div className="flex text-[#88BDF2] gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} fill="currentColor" stroke="none" className="text-[#88BDF2]" />
            ))}
          </div>
          <div className="w-[1px] h-3 bg-slate-800 mx-1" />
          <p className="text-[10px] md:text-xs uppercase tracking-widest font-black text-white/90">
            {t('hero_badge', '5 Estrellas en Google')}
          </p>
        </div>

      </div>
    </div>
  );
}