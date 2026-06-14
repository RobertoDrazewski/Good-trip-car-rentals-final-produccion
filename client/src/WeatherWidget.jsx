// client/src/WeatherWidget.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapPin, Wind, Loader2, Droplets, Calendar, Sunrise, Sunset, Clock, CloudRain } from 'lucide-react';

export default function WeatherWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localTime, setLocalTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Migración a Open-Meteo: 100% Gratis, 7 días garantizados, sin API Key.
        // Coordenadas configuradas exactamente para Mendoza (-32.8908, -68.8272)
        const res = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=-32.8908&longitude=-68.8272&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=America%2FArgentina%2FMendoza&forecast_days=7`
        );

        const { current, daily } = res.data;

        // Adaptador de Códigos WMO a los Iconos y Códigos originales de WeatherAPI
        const getWeatherDetails = (code, isDay = 1) => {
           const dayStr = isDay ? 'day' : 'night';
           const map = {
             0: { c: 1000, t: 'Despejado', i: '113' },
             1: { c: 1003, t: 'Mayormente despejado', i: '116' },
             2: { c: 1006, t: 'Parcialmente nublado', i: '119' },
             3: { c: 1009, t: 'Nublado', i: '122' },
             45: { c: 1030, t: 'Niebla', i: '143' },
             48: { c: 1135, t: 'Niebla escarcha', i: '248' },
             51: { c: 1150, t: 'Llovizna', i: '266' },
             53: { c: 1153, t: 'Llovizna', i: '266' },
             55: { c: 1153, t: 'Llovizna densa', i: '266' },
             61: { c: 1183, t: 'Lluvia ligera', i: '296' },
             63: { c: 1189, t: 'Lluvia', i: '302' },
             65: { c: 1195, t: 'Lluvia fuerte', i: '308' },
             71: { c: 1213, t: 'Nieve ligera', i: '326' },
             73: { c: 1219, t: 'Nieve', i: '332' },
             75: { c: 1225, t: 'Nieve fuerte', i: '338' },
             80: { c: 1240, t: 'Chubascos', i: '353' },
             81: { c: 1243, t: 'Chubascos', i: '356' },
             82: { c: 1246, t: 'Chubascos fuertes', i: '359' },
             95: { c: 1273, t: 'Tormenta eléctrica', i: '386' },
             96: { c: 1276, t: 'Tormenta eléctrica', i: '389' },
             99: { c: 1276, t: 'Tormenta eléctrica', i: '389' }
           };
           const match = map[code] || map[0];
           return {
             code: match.c,
             text: match.t,
             icon: `//cdn.weatherapi.com/weather/64x64/${dayStr}/${match.i}.png`
           };
        };

        const formatTime = (isoString) => {
          return new Date(isoString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: true });
        };

        // Construimos el objeto simulando exactamente el formato de WeatherAPI
        const adaptedData = {
          current: {
            temp_c: current.temperature_2m,
            is_day: current.is_day,
            condition: getWeatherDetails(current.weather_code, current.is_day),
            wind_kph: current.wind_speed_10m,
            humidity: current.relative_humidity_2m
          },
          forecast: {
            forecastday: daily.time.map((dateStr, index) => ({
              date: dateStr,
              day: {
                maxtemp_c: daily.temperature_2m_max[index],
                mintemp_c: daily.temperature_2m_min[index],
                daily_chance_of_rain: daily.precipitation_probability_max[index],
                condition: getWeatherDetails(daily.weather_code[index], 1)
              },
              astro: {
                sunrise: formatTime(daily.sunrise[index]),
                sunset: formatTime(daily.sunset[index])
              }
            }))
          }
        };

        setData(adaptedData);
      } catch (err) {
        console.warn("API Clima: Error de comunicación.", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
  }, []);

  const getSouthernSeason = () => {
    const now = new Date();
    const month = now.getMonth() + 1; 
    const day = now.getDate();

    if ((month === 12 && day >= 21) || month === 1 || month === 2 || (month === 3 && day < 21)) {
      return 'Verano ☀️';
    } else if ((month === 3 && day >= 21) || month === 4 || month === 5 || (month === 6 && day < 21)) {
      return 'Otoño 🍁';
    } else if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day < 21)) {
      return 'Invierno ❄️';
    } else {
      return 'Primavera 🌸';
    }
  };

  const getWeatherStyle = () => {
    if (!data) return {};
    const code = data.current.condition.code;
    const isDay = data.current.is_day === 1;

    const soleado = [1000];
    const nublado = [1003, 1006, 1009, 1030, 1135, 1147];
    const lluvioso = [1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246, 1087, 1273, 1276];
    const nieve = [1066, 1069, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282];

    if (!isDay) {
      if (lluvioso.includes(code)) {
        return {
          bg: "bg-gradient-to-b from-slate-950 via-neutral-950 to-slate-900",
          text: "text-white", subtitle: "text-white/30",
          badge: "bg-cyan-950/40 text-cyan-400 border-cyan-500/20",
          ambientTop: "bg-blue-900/10", ambientBottom: "bg-slate-900/20",
          textInverted: "text-white", sourceText: "text-slate-500"
        };
      }
      return {
        bg: "bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950",
        text: "text-white", subtitle: "text-white/30",
        badge: "bg-white/5 text-slate-300 border-white/10",
        ambientTop: "bg-indigo-500/5", ambientBottom: "bg-purple-950/10",
        textInverted: "text-white", sourceText: "text-slate-400"
      };
    }

    if (soleado.includes(code)) {
      return {
        bg: "bg-gradient-to-b from-sky-400 via-blue-500 to-blue-600",
        text: "text-white", subtitle: "text-white/40",
        badge: "bg-white/20 text-white border-white/20",
        ambientTop: "bg-yellow-300/30", ambientBottom: "bg-amber-400/20",
        textInverted: "text-white", sourceText: "text-slate-100"
      };
    } else if (nublado.includes(code)) {
      return {
        bg: "bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600",
        text: "text-white", subtitle: "text-white/25",
        badge: "bg-white/10 text-white border-white/10",
        ambientTop: "bg-slate-300/20", ambientBottom: "bg-zinc-400/20",
        textInverted: "text-white", sourceText: "text-slate-200"
      };
    } else if (lluvioso.includes(code)) {
      return {
        bg: "bg-gradient-to-b from-slate-700 via-indigo-900 to-slate-800",
        text: "text-white", subtitle: "text-white/20",
        badge: "bg-white/5 text-white border-white/10",
        ambientTop: "bg-cyan-500/20", ambientBottom: "bg-blue-600/10",
        textInverted: "text-white", sourceText: "text-slate-400"
      };
    } else if (nieve.includes(code)) {
      return {
        bg: "bg-gradient-to-b from-blue-50 via-slate-200 to-blue-100",
        text: "text-slate-900", subtitle: "text-slate-900/30",
        badge: "bg-slate-900/10 text-slate-900 border-slate-900/10",
        ambientTop: "bg-white/60", ambientBottom: "bg-blue-400/20",
        textInverted: "text-slate-800", sourceText: "text-slate-600"
      };
    }

    return {
      bg: "bg-gradient-to-b from-slate-900 via-slate-950 to-black",
      text: "text-white", subtitle: "text-white/20",
      badge: "bg-white/5 text-white border-white/10",
      ambientTop: "bg-blue-500/10", ambientBottom: "bg-yellow-500/5",
      textInverted: "text-white", sourceText: "text-slate-400"
    };
  };

  const sectionHeader = (
    <div className="mb-8 text-center md:text-left">
      <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
        Estado del <span className="text-[#88BDF2]">Clima</span>
      </h2>
      <p className="text-white/60 font-medium italic text-sm md:text-base">
        Revisa el clima antes de emprender cualquiera de tus rutas.
      </p>
    </div>
  );

  if (loading) return (
    <div className="w-full animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-10">
      {sectionHeader}
      <div className="flex justify-center py-12 w-full bg-[#1E222F] border border-slate-800 rounded-[2rem] shadow-2xl">
        <Loader2 className="animate-spin text-[#88BDF2]" size={32} />
      </div>
    </div>
  );

  if (!data) return null;

  const style = getWeatherStyle();
  const hoyForecast = data.forecast.forecastday[0];

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-10">
      
      {sectionHeader}

      <div className={`relative ${style.bg} ${style.text} p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden w-full transition-all duration-1000 font-sans`}>
        
        <div className={`absolute -top-24 -right-24 w-60 h-60 ${style.ambientTop} blur-[80px] rounded-full pointer-events-none transition-all duration-1000`} />
        <div className={`absolute -bottom-24 -left-24 w-60 h-60 ${style.ambientBottom} blur-[80px] rounded-full pointer-events-none transition-all duration-1000`} />

        <div className="relative z-10 w-full flex flex-col gap-5">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full border-b border-white/10 pb-4">
            <div className="space-y-2 text-left w-full sm:w-auto">
              
              <div className="flex flex-wrap gap-2 items-center">
                <div className={`flex items-center gap-1.5 ${style.badge} px-3 py-1.5 rounded-xl border`}>
                  <MapPin size={13} className="text-yellow-500 animate-pulse" />
                  <span className="font-black uppercase text-xs tracking-wider">Mendoza, AR</span>
                </div>
                
                <div className={`flex items-center gap-2 ${style.badge} px-3 py-1.5 rounded-xl border font-mono font-bold text-xs`}>
                  <Clock size={12} className="text-yellow-500" />
                  <span>{localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span className="opacity-40">•</span>
                  <span>{getSouthernSeason()}</span>
                </div>
              </div>
              
              <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-tight italic">
                Pronóstico <span className={style.subtitle}>Semanal</span>
              </h3>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-4 border border-white/20 shadow-sm max-sm:w-full max-sm:justify-between">
              <img src={data.current.condition.icon} alt="icon" className="w-14 h-14 md:w-16 md:h-16 drop-shadow-md flex-shrink-0" />
              <div className="text-left">
                <div className="flex items-start">
                  <p className="text-3xl md:text-4xl font-black tracking-tighter leading-none">{Math.round(data.current.temp_c)}</p>
                  <span className="text-xs font-black text-yellow-500 mt-0.5">°C</span>
                </div>
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mt-1 whitespace-normal">{data.current.condition.text}</p>
              </div>
            </div>
          </div>

          {/* Bloques de Datos Clave */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full text-left">
            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
              <Sunrise className="text-yellow-500 flex-shrink-0" size={20} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-50">Salida</p>
                <p className="text-sm font-black italic truncate">{hoyForecast.astro.sunrise}</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
              <Sunset className="text-orange-500 flex-shrink-0" size={20} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-50">Puesta</p>
                <p className="text-sm font-black italic truncate">{hoyForecast.astro.sunset}</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
              <CloudRain className="text-cyan-400 flex-shrink-0" size={20} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-50">Prob. Lluvia</p>
                <p className="text-sm font-black italic truncate">{hoyForecast.day.daily_chance_of_rain}%</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
              <Wind className="text-teal-400 flex-shrink-0" size={20} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-50">Viento</p>
                <p className="text-sm font-black italic truncate">{data.current.wind_kph} km/h</p>
              </div>
            </div>
          </div>

          {/* PRONÓSTICO 7 DÍAS - CORREGIDO PARA MOSTRARSE SIN SCROLL EN MÓVIL */}
          <div className="grid grid-cols-7 gap-1 md:gap-2.5 w-full">
            {data.forecast.forecastday.map((day, idx) => (
              <div 
                key={idx} 
                className={`p-1.5 md:p-3 rounded-xl md:rounded-2xl text-center border transition-all duration-300 flex flex-col items-center justify-center ${
                  idx === 0 
                  ? 'bg-yellow-500 border-yellow-400 text-slate-950 shadow-sm' 
                  : 'bg-white/5 border-white/5 text-inherit'
                }`}
              >
                <p className={`text-[8px] md:text-[10px] font-black uppercase mb-0.5 md:mb-1 tracking-tighter md:tracking-wider ${idx === 0 ? 'text-slate-900 font-black' : 'opacity-60'}`}>
                  {idx === 0 ? 'Hoy' : new Date(day.date + "T00:00:00").toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}
                </p>
                <img src={day.day.condition.icon} alt="icon" className="w-5 h-5 md:w-8 md:h-8 mx-auto mb-0.5 md:mb-1 drop-shadow" />
                <p className="text-xs md:text-base font-black italic leading-none">{Math.round(day.day.maxtemp_c)}°</p>
                <p className={`text-[7px] md:text-[9px] font-black uppercase mt-1 ${idx === 0 ? 'text-slate-900 opacity-60' : 'text-sky-300'}`}>
                   <span className="hidden md:inline">Min </span>{Math.round(day.day.mintemp_c)}°
                </p>
              </div>
            ))}
          </div>

          {/* Footer del Widget */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 w-full text-xs">
            <div className="flex items-center gap-2 opacity-90 max-sm:w-full max-sm:justify-center">
              <Droplets size={14} className="text-yellow-500" />
              <span className="font-black uppercase tracking-wider">Humedad: {data.current.humidity}%</span>
            </div>
            
            <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2.5 border border-white/5 w-full sm:w-auto justify-center backdrop-blur-sm">
              <Calendar size={13} className="text-yellow-500 flex-shrink-0" />
              <p className={`font-bold italic text-center leading-tight ${style.textInverted} whitespace-normal break-words`}>
                Planificá tus rutas turísticas con datos en tiempo real.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}