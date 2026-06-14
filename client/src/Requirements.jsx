// client/src/Requirements.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ClipboardList, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Requirements() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Segmentación del array dinámico proveniente de MySQL
  const mitad = Math.ceil(reqs.length / 2);
  const columnaIzquierda = reqs.slice(0, mitad);
  const columnaDerecha = reqs.slice(mitad);

  return (
    // Contenedor idéntico en estilo, bordes y sombras al BookingForm
    <div className="w-full bg-[#1E222F] border border-slate-800 rounded-[2rem] p-8 md:p-10 shadow-2xl font-sans text-white animate-in fade-in duration-500 overflow-hidden">
      
      {/* Cabecera unificada - CORREGIDA PARA MÓVILES */}
      <div className="border-b border-slate-800/60 pb-6 mb-8 w-full">
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

      {/* Grid de dos columnas para los bloques de requisitos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full">
        
        {/* Columna Izquierda */}
        <div className="flex flex-col gap-4 w-full text-left">
          {columnaIzquierda.map((item) => (
            <div 
              key={item.id} 
              className="p-5 rounded-2xl bg-[#121319] border border-slate-800/80 shadow-md flex items-start gap-4 hover:border-[#88BDF2]/40 transition-all duration-300 min-w-0 w-full"
            >
              {/* Contenedor del ícono robusto y alineado arriba */}
              <div className="p-3 bg-[#1E222F] rounded-xl text-[#88BDF2] border border-slate-800 flex-shrink-0 text-xl w-12 h-12 flex items-center justify-center shadow-inner">
                {item.icono || '📌'}
              </div>
              
              {/* Bloque de textos con fuentes al doble de tamaño y adaptabilidad total */}
              <div className="min-w-0 flex-1 space-y-1.5">
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

        {/* Columna Derecha */}
        <div className="flex flex-col gap-4 w-full text-left">
          {columnaDerecha.map((item) => (
            <div 
              key={item.id} 
              className="p-5 rounded-2xl bg-[#121319] border border-slate-800/80 shadow-md flex items-start gap-4 hover:border-[#88BDF2]/40 transition-all duration-300 min-w-0 w-full"
            >
              {/* Contenedor del ícono */}
              <div className="p-3 bg-[#1E222F] rounded-xl text-[#88BDF2] border border-slate-800 flex-shrink-0 text-xl w-12 h-12 flex items-center justify-center shadow-inner">
                {item.icono || '📌'}
              </div>
              
              {/* Textos legibles */}
              <div className="min-w-0 flex-1 space-y-1.5">
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