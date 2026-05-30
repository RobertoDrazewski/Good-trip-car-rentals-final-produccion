// client/src/Requirements.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Users, Fuel, CreditCard, MapPin, Car, Navigation, ClipboardList } from 'lucide-react';

// 🛠️ CORRECCIÓN CRÍTICA: Cambiado el puerto base por defecto de 3001 a 3000 para sincronizar con el server.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Requirements() {
  const [reqs, setReqs] = useState([]);

  useEffect(() => {
    const fetchRequisitos = async () => {
      try {
        // Conexión directa al endpoint dual de políticas que mapeamos en Express
        const res = await axios.get(`${API_BASE_URL}/api/admin/requisitos`);
        setReqs(res.data);
      } catch (error) {
        console.error("❌ Error al cargar requisitos en la vista pública:", error);
      }
    };
    fetchRequisitos();
  }, []);

  // Estado de carga elegante integrado con el fondo oscuro general
  if (reqs.length === 0) {
    return (
      <div className="text-[10px] text-slate-500 italic p-12 text-center bg-[#121319]">
        Sincronizando políticas de alquiler de Good Trip Cars...
      </div>
    );
  }

  // Segmentación del array dinámico proveniente de MySQL
  const mitad = Math.ceil(reqs.length / 2);
  const columnaIzquierda = reqs.slice(0, mitad);
  const columnaDerecha = reqs.slice(mitad);

  return (
    <div className="w-full h-full animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-16">
      
      {/* SECCIÓN DE TÍTULOS ALINEADA CON EL ESTILO DEL HOME */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black uppercase tracking-tight italic text-white">
          Requisitos <span className="text-[#88BDF2]">Contractuales</span>
        </h2>
        <p className="text-sm text-[#6F7D93] mt-2">
          Todo lo que necesitás saber antes de retirar tu unidad en Mendoza
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start w-full">
        
        {/* Columna Izquierda */}
        <div className="flex flex-col gap-3 w-full text-left">
          {columnaIzquierda.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-[#121319]/60 backdrop-blur-md border border-white/5 shadow-lg flex items-center gap-4 hover:border-[#88BDF2]/30 transition-all duration-300">
              <div className="p-3 bg-[#1E222F] rounded-xl text-[#88BDF2] border border-white/5 flex-shrink-0 text-xl w-12 h-12 flex items-center justify-center">
                {item.icono || '📌'}
              </div>
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white italic">{item.titulo}</h3>
                <p className="text-[10px] text-[#A0AEC0] font-medium leading-relaxed mt-1">{item.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Columna Derecha */}
        <div className="flex flex-col gap-3 w-full text-left">
          {columnaDerecha.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-[#121319]/60 backdrop-blur-md border border-white/5 shadow-lg flex items-center gap-4 hover:border-[#88BDF2]/30 transition-all duration-300">
              <div className="p-3 bg-[#1E222F] rounded-xl text-[#88BDF2] border border-white/5 flex-shrink-0 text-xl w-12 h-12 flex items-center justify-center">
                {item.icono || '📌'}
              </div>
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white italic">{item.titulo}</h3>
                <p className="text-[10px] text-[#A0AEC0] font-medium leading-relaxed mt-1">{item.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}