// client/src/Home.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from './NavBar';
import Hero from './Hero';
import BookingForm from './BookingForm';
import QuoteResult from './QuoteResult';
import CarGrid from './CarGrid';
import RoutesSection from './RoutesSection';
import Requirements from './Requirements';
import GoogleReviews from './GoogleReviews';
import WeatherWidget from './WeatherWidget';
import ChatIA from './ChatIA';
import Footer from './Footer';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [autos,    setAutos]    = useState([]);
  const [tarifas,  setTarifas]  = useState([]);   // ← precios_mensuales completo
  const [reservas, setReservas] = useState([]);   // ← para verificar disponibilidad
  const [rutas,    setRutas]    = useState([]);
  const [promos,   setPromos]   = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [cotizacionActiva, setCotizacionActiva] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [carsRes, tarifasRes, rutasRes, bannersRes, reservasRes] = await Promise.allSettled([
          axios.get(`${apiUrl}/api/cars`),
          axios.get(`${apiUrl}/api/precios-mensuales`),   // ← CORRECTO: tarifas reales
          axios.get(`${apiUrl}/api/routes/all`),
          axios.get(`${apiUrl}/api/banners/all-active`),
          axios.get(`${apiUrl}/api/reservas/publicas`),   // endpoint público solo con fechas/auto_id/estado
        ]);

        const norm = (res, key) => {
          if (res.status !== 'fulfilled') return [];
          const d = res.value.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d?.[0])) return d[0];
          return d?.[key] || [];
        };

        setAutos(norm(carsRes,    'cars'));
        setTarifas(norm(tarifasRes, 'tarifas'));
        setRutas(norm(rutasRes,   'rutas'));
        setPromos(norm(bannersRes, 'banners'));
        setReservas(norm(reservasRes, 'reservas'));
      } catch (err) {
        console.error('❌ Error de carga Home:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [apiUrl]);

  useEffect(() => {
    if (promos.length <= 1) return;
    const iv = setInterval(() => setCurrentIndex(p => (p + 1) % promos.length), 5000);
    return () => clearInterval(iv);
  }, [promos]);

  const handleCalcularCotizacion = (quote) => {
    setCotizacionActiva(quote);
    setTimeout(() => {
      document.getElementById('resultado-cotizacion')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121319] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#88BDF2]" size={48}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121319] text-white font-sans overflow-x-hidden selection:bg-[#88BDF2] selection:text-[#121319]">
      <NavBar/>
      <Hero/>

      {/* CARRUSEL DE PROMOS */}
      {promos.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 pt-4 pb-8">
          <div className="relative w-full overflow-hidden rounded-3xl h-64 md:h-96 border border-white/10 shadow-2xl">
            <div className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {promos.map(promo => (
                <div key={promo.id} className="min-w-full h-full relative">
                  <img src={promo.imagen_url} alt={promo.titulo} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col justify-end">
                    <span className="text-[#88BDF2] font-black uppercase text-xs tracking-widest">{promo.descuento}% OFF</span>
                    <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic">{promo.titulo}</h3>
                    <p className="text-slate-300 text-xs md:text-sm max-w-xl mt-1.5 line-clamp-2">{promo.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {promos.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${currentIndex === idx ? 'bg-[#88BDF2] w-6' : 'bg-white/50 w-2'}`}/>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FLOTA */}
      <section id="flota" className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tight italic">
            Selecciona tu <span className="text-[#88BDF2]">Vehículo</span>
          </h2>
        </div>
        <CarGrid autos={autos} tarifasGlobales={tarifas}/>
      </section>

      {/* BOOKING + REVIEWS */}
      <section id="reserva-y-opiniones"
        className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-20">
        <div className="w-full">
          {/* ✅ Pasamos tarifas reales de precios_mensuales y reservas para validar disponibilidad */}
          <BookingForm
            autos={autos}
            tarifas={tarifas}
            reservas={reservas}
            onQuoteGenerated={handleCalcularCotizacion}
          />
        </div>
        <div className="w-full lg:sticky lg:top-24">
          <GoogleReviews/>
        </div>
      </section>

      {cotizacionActiva && (
        <section id="resultado-cotizacion" className="max-w-4xl mx-auto px-4 pb-16">
          <QuoteResult quote={cotizacionActiva} onClose={() => setCotizacionActiva(null)}/>
        </section>
      )}

      <section id="requisitos" className="max-w-5xl mx-auto px-4 py-8"><Requirements/></section>
      <section id="clima"     className="max-w-5xl mx-auto px-4 py-4"><WeatherWidget/></section>
      <section id="guias-rutas" className="max-w-7xl mx-auto px-4 py-12"><RoutesSection rutas={rutas}/></section>

      <ChatIA/>
      <Footer/>
    </div>
  );
}
