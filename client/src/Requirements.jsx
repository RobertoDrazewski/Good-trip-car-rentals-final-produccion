// client/src/Requirements.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ClipboardList, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Requirements() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados y Ref para el control del carrusel móvil
  const scrollRef = useRef(null);
  const [mostrarIzq, setMostrarIzq] = useState(false);
  const [mostrarDer, setMostrarDer] = useState(true);

  useEffect(() => {
    const fetchRequisitos = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/admin/requisitos`);
        setReqs(res.data);
      } catch (error) {
        console.error("❌ Error al cargar requisitos en la vista pública:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequisitos();
  }, []);

  // Chequea la posición del scroll para ocultar o mostrar las flechas
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setMostrarIzq(scrollLeft > 0);
    setMostrarDer(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
  };

  // Actualiza las flechas cuando cambian los requisitos
  useEffect(() => {
    checkScroll();
    setTimeout(checkScroll, 100);
  }, [reqs]);

  const moverCarrusel = (direccion) => {
    if (scrollRef.current) {
      const salto = window.innerWidth * 0.85; 
      scrollRef.current.scrollBy({
        left: direccion === 'izq' ? -salto : salto,
        behavior: 'smooth'
      });
    }
  };

  // Estado de carga elegante adaptado a la estética del ecosistema
  if (loading) {
    return (
      <div className="w-full bg-[#1E222F] border border-slate-800 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xl">
        <Loader2 className="animate-spin text-[#88BDF2]" size={32} />
        <p className="text-sm font-bold uppercase tracking-wider">Sincronizando políticas de alquiler...</p>
      </div>
    );
  }

  if (reqs.length === 0) {
    return (
      <div className="w-full bg-[#1E222F] border border-slate-800 rounded-[2rem] p-12 text-center text-slate-500 shadow-2xl italic text-sm">
        No se encontraron requisitos cargados en este momento.
      </div>
    );
  }

  return (
    // Contenedor idéntico en estilo, bordes y sombras al BookingForm
    <div className="w-full bg-[#1E222F] border border-slate-800 rounded-[2rem] p-6 md:p-8 lg:p-10 shadow-2xl font-sans text-white animate-in fade-in duration-500 overflow-hidden">
      
      {/* Cabecera unificada - CORREGIDA PARA MÓVILES */}
      <div className="border-b border-slate-800/60 pb-6 mb-6 md:mb-8 w-full">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-start sm:items-center gap-3 w-full">
          <ClipboardList className="text-[#88BDF2] flex-shrink-0 mt-0.5 sm:mt-0" size={28} /> 
          {/* El contenedor flex-1 asegura que el texto se adapte y baje de línea si es necesario */}
          <span className="flex-1 break-words leading-tight">
            Requisitos <span className="text-[#88BDF2]">Contractuales</span>
          </span>
        </h2>
        <p className="text-slate-400 text-xs md:text-sm mt-2 font-medium tracking-wide">
          Todo lo que necesitás saber antes de retirar tu unidad en Mendoza.
        </p>
      </div>

      {/* Contenedor relativo para posicionar las flechas correctamente */}
      <div className="relative w-full">
        
        {/* 🚀 CONTROLES FLOTANTES MÓVILES (Posicionados abajo) */}
        {mostrarIzq && (
          <button 
            onClick={() => moverCarrusel('izq')}
            className="lg:hidden absolute -left-2 bottom-6 z-20 bg-[#121319]/90 border border-slate-700/80 text-[#88BDF2] w-10 h-10 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {mostrarDer && reqs.length > 1 && (
          <button 
            onClick={() => moverCarrusel('der')}
            className="lg:hidden absolute -right-2 bottom-6 z-20 bg-[#121319]/90 border border-slate-700/80 text-[#88BDF2] w-10 h-10 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md active:scale-95 transition-transform animate-pulse"
          >
            <ChevronRight size={24} />
          </button>
        )}
        {/* 🚀 FIN CONTROLES */}

        {/* Contenedor Principal: 
          - En móvil: flex horizontal (carrusel deslizable)
          - En PC (lg): grid de 2 columnas estáticas
        */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex lg:grid lg:grid-cols-2 gap-4 md:gap-5 w-full overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none scroll-smooth pb-4 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          
          {reqs.map((item) => (
            <div 
              key={item.id} 
              // La tarjeta tiene un ancho fijo en móvil para obligar al scroll, y retoma el 100% en PC
              className="w-[85vw] max-w-[320px] lg:w-full lg:max-w-none shrink-0 snap-center p-5 rounded-2xl bg-[#121319] border border-slate-800/80 shadow-md flex items-start gap-4 hover:border-[#88BDF2]/40 transition-all duration-300 min-w-0"
            >
              {/* Contenedor del ícono robusto y alineado arriba */}
              <div className="p-3 bg-[#1E222F] rounded-xl text-[#88BDF2] border border-slate-800 flex-shrink-0 text-xl w-12 h-12 flex items-center justify-center shadow-inner">
                {item.icono || '📌'}
              </div>
              
              {/* Bloque de textos con fuentes al doble de tamaño y adaptabilidad total */}
              <div className="min-w-0 flex-1 space-y-1.5 pb-2"> {/* Agregado pb-2 para dar margen interno si se necesita */}
                <h3 className="text-sm md:text-base font-black uppercase tracking-wide text-white break-words whitespace-normal">
                  {item.titulo}
                </h3>
                <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed break-words whitespace-normal">
                  {item.descripcion}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}