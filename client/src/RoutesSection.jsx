// client/src/RoutesSection.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigation, Loader2, MapPin } from 'lucide-react';

// Unificamos al puerto 3000 que es donde corre tu backend real
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RoutesSection() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/routes/all`);
        setRutas(res.data);
      } catch (err) { 
        console.error("❌ Error al cargar rutas en el Home público:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchRutas();
  }, []);

  const handleNavigation = (url) => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('El GPS o mapa interactivo no se encuentra disponible para esta ruta en este momento.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#88BDF2]" size={32} />
      </div>
    );
  }
  
  if (rutas.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-10">
      
      {/* SECCIÓN DE TÍTULO */}
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
          Guía Turística <span className="text-[#88BDF2]">Interactiva</span>
        </h2>
        <p className="text-white/60 font-medium italic">
          Explora nuestras rutas recomendadas y comienza tu viaje con un solo clic.
        </p>
      </div>

      {/* Carrusel horizontal (1 tarjeta por pantalla) en TODO lo menor a lg (1024px).
          En lg+ vuelve a la grilla de 3 columnas. */}
      <div className="flex lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rutas.map((r) => (
          <div 
            key={r.id}
            onClick={() => handleNavigation(r.maps_url)}
            className="min-w-full lg:min-w-0 lg:w-full shrink-0 snap-center h-[400px] rounded-[2rem] overflow-hidden shadow-2xl relative cursor-pointer group border border-white/10 hover:border-[#88BDF2]/40 transition-all duration-300"
          >
            {/* IMAGEN DE FONDO */}
            <img 
              src={r.imagen_url && r.imagen_url.startsWith('http') 
                ? r.imagen_url 
                : `${API_BASE_URL}${r.imagen_url}`} 
              alt={r.titulo}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              onError={(e) => {
                // Imagen de respaldo estética si falla Cloudinary o la URL local
                e.target.src = 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80';
              }}
            />

            {/* DEGRADADO PARA LEGIBILIDAD */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121319]/95 via-[#121319]/30 to-transparent" />
            
            {/* CONTENIDO FLOTANTE */}
            <div className="absolute bottom-0 left-0 w-full p-6">
              <div className="flex items-center gap-2 text-[#88BDF2] mb-2">
                <MapPin size={14} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Destino Mendoza</span>
              </div>
              
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
                {r.titulo}
              </h4>

              <p className="text-white/70 text-xs leading-relaxed font-medium italic border-l-2 border-[#88BDF2] pl-4 mb-4 line-clamp-2">
                {r.descripcion}
              </p>

              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                   <Navigation size={12} className="text-[#88BDF2]" /> Iniciar Navegación
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}