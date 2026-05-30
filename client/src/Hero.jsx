import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

// 🔌 Corregido: Ahora busca la carpeta assets en el mismo nivel raíz (./)
import logoCuadrado from './assets/logocuadrado.png'; 

export default function Hero() {
  const { t } = useTranslation();

  return (
    <div className="relative w-full h-auto py-6 md:py-10 text-white px-4 sm:px-8 md:px-16 flex flex-col justify-center items-center overflow-hidden bg-transparent flex-shrink-0">
      
      {/* Brillo radial de acento de servicios centrado sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#88BDF2]/10 via-transparent to-transparent opacity-60 pointer-events-none z-1" />

      {/* CONTENEDOR DE TEXTO INTEGRADO */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-6 max-w-7xl">
        
        {/* Título principal, subtítulo y logo en horizontal */}
        <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
          
          <img 
            src={logoCuadrado} 
            alt="Good Trip Car Rentals Logo" 
            className="w-36 h-36 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-contain flex-shrink-0 order-first lg:order-last lg:ml-4 filter drop-shadow-[0_10px_30px_rgba(136,189,242,0.25)]"
          />

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white drop-shadow-[0_4px_12px_rgba(18,19,25,0.6)]">
              Good Trip <br className="max-lg:hidden"/>
              <span className="text-[#88BDF2] not-italic">Car Rentals</span>
            </h2>
            {/* Texto actualizado a blanco con mejor legibilidad */}
            <p className="text-xs md:text-sm opacity-90 text-white font-bold hidden md:block max-w-xl leading-relaxed">
              {t('hero_subtitle', 'Recorré Mendoza de acuerdo a tus tiempos!. Alquilá tu auto y accedé a nuestras guías interactivas en Google Maps con un solo clic. Servicio premium 5 estrellas')}
            </p>
          </div>
        </div>

        {/* Prueba social optimizada centrada */}
        <div className="flex items-center gap-2 bg-[#1E222F]/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/60 shadow-2xl flex-shrink-0 max-lg:mt-4">
          <div className="flex text-[#88BDF2] gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill="currentColor" stroke="none" className="text-[#88BDF2]" />
            ))}
          </div>
          <div className="w-[1px] h-3 bg-slate-800" />
          <p className="text-[10px] uppercase tracking-widest font-black text-white/90">
            {t('hero_badge', '5 Estrellas en Google')}
          </p>
        </div>

      </div>
    </div>
  );
}