const axios = require('axios');

/**
 * OBTENER PRONÓSTICO METEOROLÓGICO DE MENDOZA (Adaptado a WeatherAPI)
 */
const getMendozaWeather = async (req, res) => {
  try {
    console.log("🌦️ Solicitando datos meteorológicos en tiempo real a Open-Meteo...");
    
    // Coordenadas exactas para Mendoza (-32.8908, -68.8272) con pronóstico de 7 días y zona horaria local
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=-32.8908&longitude=-68.8272&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=America%2FArgentina%2FMendoza&forecast_days=7`
    );

    const { current, daily } = response.data;

    // Helper interno para mapear los códigos WMO a textos genéricos y rutas de iconos estables
    const mapWmoToCondition = (code, isDay = 1) => {
      const dayStr = isDay ? 'day' : 'night';
      const wmoMap = {
        0: { code: 1000, text: 'Despejado', iconId: '113' },
        1: { code: 1003, text: 'Mayormente despejado', iconId: '116' },
        2: { code: 1006, text: 'Parcialmente nublado', iconId: '119' },
        3: { code: 1009, text: 'Nublado', iconId: '122' },
        45: { code: 1030, text: 'Niebla', iconId: '143' },
        48: { code: 1135, text: 'Niebla escarcha', iconId: '248' },
        51: { code: 1150, text: 'Llovizna', iconId: '266' },
        53: { code: 1153, text: 'Llovizna', iconId: '266' },
        55: { code: 1153, text: 'Llovizna densa', iconId: '266' },
        61: { code: 1183, text: 'Lluvia ligera', iconId: '296' },
        63: { code: 1189, text: 'Lluvia', iconId: '302' },
        65: { code: 1195, text: 'Lluvia fuerte', iconId: '308' },
        71: { code: 1213, text: 'Nieve ligera', iconId: '326' },
        73: { code: 1219, text: 'Nieve', iconId: '332' },
        75: { code: 1225, text: 'Nieve fuerte', iconId: '338' },
        80: { code: 1240, text: 'Chubascos', iconId: '353' },
        81: { code: 1243, text: 'Chubascos', iconId: '356' },
        82: { code: 1246, text: 'Chubascos fuertes', iconId: '359' },
        95: { code: 1273, text: 'Tormenta eléctrica', iconId: '386' },
        96: { code: 1276, text: 'Tormenta eléctrica', iconId: '389' },
        99: { code: 1276, text: 'Tormenta eléctrica', iconId: '389' }
      };

      const match = wmoMap[code] || wmoMap[0];
      return {
        code: match.code,
        text: match.text,
        icon: `https://cdn.weatherapi.com/weather/64x64/${dayStr}/${match.iconId}.png`
      };
    };

    // Helper interno para formatear las marcas de tiempo ISO a formato AM/PM
    const formatTimeTo12H = (isoString) => {
      return new Date(isoString).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    };

    // 3. CONSTRUCCIÓN DE LA RESPUESTA ADAPTADA (Simula la estructura que ya lee tu Front)
    const adaptedData = {
      current: {
        temp_c: current.temperature_2m,
        is_day: current.is_day,
        condition: mapWmoToCondition(current.weather_code, current.is_day),
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
            condition: mapWmoToCondition(daily.weather_code[index], 1)
          },
          astro: {
            sunrise: formatTimeTo12H(daily.sunrise[index]),
            sunset: formatTimeTo12H(daily.sunset[index])
          }
        }))
      }
    };

    // Respondemos con el objeto idéntico al que procesaba tu Widget original
    res.json(adaptedData);

  } catch (error) {
    console.error("❌ Error en el controlador de clima:", error.message);
    res.status(500).json({ 
      error: "No se pudieron recuperar los datos meteorológicos en tiempo real." 
    });
  }
};

module.exports = {
  getMendozaWeather
};