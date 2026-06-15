// client/src/RoutesSection.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Navigation, Loader2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

// Unificamos al puerto 3000 que es donde corre tu backend real
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RoutesSection() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados y Ref para el control del carrusel móvil
  const scrollRef = useRef(null);
  const [mostrarIzq, setMostrarIzq] = useState(false);
  const [mostrarDer, setMostrarDer] = useState(true);

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

  // Chequea la posición del scroll para deshabilitar las flechas en los topes
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setMostrarIzq(scrollLeft > 0);
    setMostrarDer(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    setTimeout(checkScroll, 100);
  }, [rutas]);

  const moverCarrusel = (direccion) => {
    if (scrollRef.current) {
      const salto = window.innerWidth * 0.85; 
      scrollRef.current.scrollBy({
        left: direccion === 'izq' ? -salto : salto,
        behavior: 'smooth'
      });
    }
  };

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

      {/* Carrusel horizontal */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {rutas.map((r) => (
          <div 
            key={r.id}
            onClick={() => handleNavigation(r.maps_url)}
            // ✅ CAMBIO: Tarjetas más grandes h-[500px] y w-[85vw] para que asome la siguiente
            className="w-[85vw] max-w-[400px] lg:max-w-none lg:min-w-0 lg:w-full shrink-0 snap-center h-[500px] md:h-[550px] rounded-[2rem] overflow-hidden shadow-2xl relative cursor-pointer group border border-white/10 hover:border-[#88BDF2]/40 transition-all duration-300"
          >
            {/* IMAGEN DE FONDO */}
            <img 
              src={r.imagen_url && r.imagen_url.startsWith('http') 
                ? r.imagen_url 
                : `${API_BASE_URL}${r.imagen_url}`} 
              alt={r.titulo}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80';
              }}
            />

            {/* DEGRADADO PARA LEGIBILIDAD */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121319]/95 via-[#121319]/30 to-transparent" />
            
            {/* CONTENIDO FLOTANTE */}
            <div className="absolute bottom-0 left-0 w-full p-6 lg:p-8">
              <div className="flex items-center gap-2 text-[#88BDF2] mb-3">
                <MapPin size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Destino Mendoza</span>
              </div>
              
              <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-3">
                {r.titulo}
              </h4>

              <p className="text-white/80 text-sm leading-relaxed font-medium italic border-l-2 border-[#88BDF2] pl-4 mb-5 line-clamp-3">
                {r.descripcion}
              </p>

              <div className="flex items-center gap-4">
                <div className="px-5 py-3 bg-white/10 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 hover:bg-[#88BDF2] hover:text-[#121319] hover:border-[#88BDF2] transition-colors">
                   <Navigation size={14} className="text-current" /> Iniciar Navegación
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 CONTROLES MÓVILES (Ubicados justo debajo de las rutas) */}
      {rutas.length > 1 && (
        <div className="flex lg:hidden justify-center items-center gap-6 mt-8">
          <button 
            onClick={() => moverCarrusel('izq')}
            disabled={!mostrarIzq}
            className={`bg-[#121319]/90 border border-slate-700/80 text-[#88BDF2] w-12 h-12 flex items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all ${mostrarIzq ? 'active:scale-95 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
          >
            <ChevronLeft size={28} />
          </button>

          <button 
            onClick={() => moverCarrusel('der')}
            disabled={!mostrarDer}
            className={`bg-[#121319]/90 border border-slate-700/80 text-[#88BDF2] w-12 h-12 flex items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all ${mostrarDer ? 'active:scale-95 animate-pulse cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
      {/* 🚀 FIN CONTROLES */}

    </div>
  );
}