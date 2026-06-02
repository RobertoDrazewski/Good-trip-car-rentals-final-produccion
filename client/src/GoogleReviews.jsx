// client/src/GoogleReviews.jsx
import React from 'react';
import { Star, Quote, ExternalLink } from 'lucide-react';
import logoBlanco from './assets/logo.png';

export default function GoogleReviews() {
  const reviews = [
    {
      id: 1,
      author: "Carlos Pereyra",
      date: "Hace 2 semanas",
      rating: 5,
      text: "Excelente servicio en Mendoza. El auto estaba impecable y la atención de los chicos fue súper rápida. Volvería a alquilar con ellos sin dudarlo."
    },
    {
      id: 2,
      author: "Anahí Silva",
      date: "Hace 1 mes",
      rating: 5,
      text: "Muy buena experiencia. Nos entregaron el auto en el aeropuerto a horario. Ideal para recorrer los caminos del vino con total tranquilidad."
    },
    {
      id: 3,
      author: "Mateo Gallagher",
      date: "Hace 3 semanas",
      rating: 5,
      text: "Great experience renting with Good Trip. Smooth communication via WhatsApp, fair prices, and the car performed perfectly in the mountains."
    }
  ];

  return (
    // Clonado exacto del contenedor raíz de BookingForm para simetría total
    <div className="w-full bg-[#1E222F] border border-slate-800 rounded-[2rem] p-8 shadow-2xl font-sans text-white">
      
      {/* Cabecera de Reseñas */}
      <div className="flex flex-col items-center gap-5 mb-8 border-b border-slate-800/60 pb-6">

        {/* Badge de Google Rating (5 estrellas) */}
        <div className="flex items-center justify-center gap-3.5 bg-[#121319] border border-slate-800 p-3.5 rounded-2xl w-full sm:w-auto">
          <img src={logoBlanco} alt="Good Trip" className="h-24 w-auto object-contain shrink-0" />
          <div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="text-white font-black text-base font-mono">5.0</span>
              <div className="flex items-center gap-0.5 shrink-0">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
            </div>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
              Calificación en Google Reviews
            </p>
          </div>
        </div>

        {/* Título debajo del bloque de estrellas */}
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tight">
            Opiniones de <span className="text-[#88BDF2]">Clientes</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 tracking-wide font-medium">
            La confianza de quienes ya recorrieron Mendoza.
          </p>
        </div>
      </div>

      {/* Grid de Tarjetas de Reseñas (Cambiadas a columna única para respetar el espacio del Home) */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div 
            key={review.id} 
            className="bg-[#121319] p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between relative group hover:border-[#88BDF2]/40 transition-all duration-300 shadow-md"
          >
            <Quote className="absolute top-4 right-4 text-slate-800/40 group-hover:text-[#88BDF2]/10 transition-colors" size={28} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-0.5 text-amber-400 mb-2.5">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed italic pr-6">
                "{review.text}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
              <span className="text-white">{review.author}</span>
              <span className="text-[#666D7E] font-mono">{review.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Botones CTA */}
      <div className="flex flex-col sm:flex-row justify-center items-stretch gap-3.5 mt-8">
        <a
          href="https://maps.app.goo.gl/dNpeKgDpRNvJ1QLp6"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto sm:flex-1 flex items-center justify-center gap-2.5 px-5 py-4 bg-white text-[#121319] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#88BDF2] transition-colors duration-300 shadow-lg active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Ver en Google
          <ExternalLink size={11} />
        </a>

        <a
          href="https://www.instagram.com/good.triprentals"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto sm:flex-1 flex items-center justify-center gap-2.5 px-5 py-4 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity duration-300 shadow-lg active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
          Instagram
          <ExternalLink size={11} />
        </a>
      </div>

    </div>
  );
}
