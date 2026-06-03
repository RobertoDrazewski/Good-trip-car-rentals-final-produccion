// client/src/CarGrid.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Loader2, Star, Car, Check,
  Snowflake, Bluetooth, Navigation, Armchair, Sun, ShieldCheck,
  Disc, Baby, Camera, Gauge, Settings2, Cog, Fuel, Droplet,
  Leaf, Mountain, SlidersHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Mes/año actuales — se recalculan en vivo, nunca quedan viejos
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const _ahora = new Date();
const MES_ACTUAL  = _ahora.getMonth() + 1;
const ANIO_ACTUAL = _ahora.getFullYear();
const NOMBRE_MES_ACTUAL = MESES[MES_ACTUAL - 1];

export default function CarGrid() {
  const { t } = useTranslation();
  const [autos, setAutos] = useState([]);
  const [precios, setPrecios] = useState([]); // tarifas mensuales para tomar el precio del mes en curso
  const [loading, setLoading] = useState(true);

  // Diccionario para traducir IDs de íconos a textos estéticos legibles
  const MAPA_ICONOS = {
    aire: 'Aire Acond.', bluetooth: 'Bluetooth', pantalla: 'GPS / Pantalla', asientos_cuero: 'Cuero', techo: 'Techo Corredizo',
    airbag: 'Airbags', abs: 'Frenos ABS', isofix: 'ISOFIX', camara: 'Cámara Trasera', control_traccion: 'ESP / Estabilidad',
    caja_manual: 'Manual', caja_auto: 'Automático', motor_nafta: 'Nafta', motor_diesel: 'Diesel', motor_hibrido: 'Híbrido/Elec',
    traccion_4x4: '4x4 / 4WD', tipo_sedan: 'Sedán', perfil_manejo: 'Modos Manejo'
  };

  // Cada clave de equipamiento apunta a su ícono de lucide-react.
  // Si una clave no está acá, se usa <Check> como respaldo.
  const MAPA_ICONOS_LUCIDE = {
    aire: Snowflake, bluetooth: Bluetooth, pantalla: Navigation, asientos_cuero: Armchair, techo: Sun,
    airbag: ShieldCheck, abs: Disc, isofix: Baby, camara: Camera, control_traccion: Gauge,
    caja_manual: Settings2, caja_auto: Cog, motor_nafta: Fuel, motor_diesel: Droplet, motor_hibrido: Leaf,
    traccion_4x4: Mountain, tipo_sedan: Car, perfil_manejo: SlidersHorizontal
  };

  useEffect(() => {
    const fetchAutosPublicos = async () => {
      try {
        const [resAutos, resPrecios] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/cars`),
          axios.get(`${API_BASE_URL}/api/precios-mensuales`).catch(() => ({ data: [] })),
        ]);
        const disponibles = (resAutos.data || []).filter(
          a => a.estado?.toLowerCase() === 'disponible' || a.estado === 'Disponible'
        );
        setAutos(disponibles);
        setPrecios(Array.isArray(resPrecios.data) ? resPrecios.data : []);
      } catch (err) { 
        console.error("❌ Error cargando el catálogo:", err.message); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchAutosPublicos();
  }, []);

  const handleReservarAuto = (modeloId) => {
    const bookingSection = document.getElementById('booking-section') || document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
    const eventoSeleccion = new CustomEvent('autoSeleccionarVehiculo', { detail: { autoId: modeloId } });
    window.dispatchEvent(eventoSeleccion);
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4 bg-[#121319]">
        <Loader2 className="animate-spin text-[#88BDF2]" size={36} />
        <p className="text-xs uppercase font-black tracking-widest text-[#6F7D93]">Sincronizando grilla de flota activa...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {autos.map((a) => {
          // 📅 Precio del MES EN CURSO: buscamos la tarifa de este auto para el mes/año actual.
          // Si no hay tarifa cargada para el mes, caemos al precio base del auto.
          const tarifaMes = precios.find(
            p => Number(p.auto_id) === Number(a.id)
              && Number(p.mes)  === MES_ACTUAL
              && Number(p.anio) === ANIO_ACTUAL
          );
          const precioFinal = parseFloat(
            tarifaMes?.precio_auto_mensual_ars ?? a.precio_final_mes ?? a.prices_ars ?? 0
          );

          // 🛡️ Extracción blindada ante la normalización destructiva del backend
          let caracteristicas = { puntaje_confort: 5, puntaje_seguridad: 5, puntaje_ficha: 5, iconos: {} };
          
          if (a.features) {
            try {
              // Si el backend lo transformó en String JSON
              const datosParseados = typeof a.features === 'string' ? JSON.parse(a.features) : a.features;
              
              // Si vino envuelto en un Array debido a 'normalizarFeaturesSalida' del backend, extraemos el primer índice
              if (Array.isArray(datosParseados)) {
                caracteristicas = datosParseados[0] || caracteristicas;
              } else {
                caracteristicas = datosParseados;
              }
            } catch (e) {
              console.error("Error parseando features del auto", a.id);
            }
          }

          // Filtramos de forma segura asegurando que el objeto iconos exista
          const objetoIconos = caracteristicas.iconos || {};
          const listaIconosClasificados = Object.keys(objetoIconos).filter(
            key => objetoIconos[key] === true || objetoIconos[key] === 'true'
          );

          return (
            <div 
              key={a.id} 
              className="bg-[#1E222F] border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl hover:border-[#88BDF2]/40 transition-all group flex flex-col justify-between"
            >
              {/* Encabezado Visual e Imagen */}
              <div className="w-full aspect-[4/3] bg-[#121319]/80 relative overflow-hidden flex items-center justify-center border-b border-slate-800/40">
                {a.imagen_url ? (
                  <img src={a.imagen_url} alt={a.modelo} className="object-contain w-full h-full p-2 transform group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Car className="text-[#6F7D93] opacity-20" size={96} />
                )}
                
                <div className="absolute top-4 left-4 bg-[#121319]/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-black text-white">5.0</span>
                  <span className="text-[9px] text-[#6F7D93] font-bold uppercase">Mendoza</span>
                </div>
              </div>

              {/* Contenido Ficha Informativa */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="text-left">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-[#88BDF2] transition-colors">
                    {a.modelo}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 font-medium leading-relaxed">
                    {a.descripcion_larga || 'Vehículo equipado con altos estándares operacionales y de seguridad.'}
                  </p>

                  {/* 🏷️ DESPLIEGUE DE LOS ÍCONOS DE EQUIPAMIENTO ACTIVO (PROTAGONISTAS) */}
                  {listaIconosClasificados.length > 0 ? (
                    <div className="mt-2">
                      <span className="text-[9px] uppercase font-black text-[#6F7D93] tracking-widest block mb-2.5">Equipamiento Destacado</span>
                      <div className="grid grid-cols-4 gap-2">
                        {listaIconosClasificados.map((key) => {
                          const IconoEquip = MAPA_ICONOS_LUCIDE[key] || Check;
                          return (
                            <div
                              key={key}
                              className="bg-[#121319]/60 border border-slate-800/60 rounded-xl py-2.5 px-1 flex flex-col items-center justify-start gap-1.5 hover:border-[#88BDF2]/40 hover:bg-[#88BDF2]/5 transition-colors"
                            >
                              <IconoEquip size={24} className="text-[#88BDF2] shrink-0" />
                              <span className="text-[8px] font-bold uppercase text-slate-400 text-center leading-tight tracking-tight">
                                {MAPA_ICONOS[key] || key}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] text-[#6F7D93] uppercase font-bold tracking-wider">
                      Equipamiento estándar
                    </div>
                  )}
                </div>

                {/* Footer: Precio del Mes Directo */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
                   <div className="text-left">
                     <p className="text-2xl font-black text-white italic font-mono">
                       ${precioFinal.toLocaleString('es-AR')}
                     </p>
                     <span className="text-[9px] text-[#6F7D93] uppercase font-black block tracking-wider mt-0.5">
                       Tarifa de {NOMBRE_MES_ACTUAL}
                     </span>
                   </div>
                   <button 
                      onClick={() => handleReservarAuto(a.id)}
                      className="px-5 py-3 bg-[#88BDF2] text-[#121319] font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white transition-all transform active:scale-95 cursor-pointer shadow-lg"
                   >
                      Solicitá Presupuesto
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}