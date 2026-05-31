// server.js
// =================================================================
// 1. CARGA DE VARIABLES DE ENTORNO (Al inicio de todo)
// =================================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path'); 
const fs = require('fs'); 

// =================================================================
// 2. IMPORTACIÓN DE LAS RUTAS DEL PROYECTO
// =================================================================
const authRoutes = require('./routes/authRoutes'); 
const carRoutes = require('./routes/carRoutes'); 
const precioMensualRoutes = require('./routes/precioMensualRoutes'); 
const requisitoRoutes = require('./routes/requisitoRoutes'); 
const routeRoutes = require('./routes/routeRoutes'); 
const reservaRoutes = require('./routes/reservaRoutes'); 
const chatRoutes = require('./routes/chatRoutes'); 
const bannerRoutes = require('./routes/bannerRoutes'); 
const weatherRoutes = require('./routes/weatherRoutes'); 
const ventaRoutes = require('./routes/ventaRoutes');

// =================================================================
// 3. INICIALIZACIÓN DE LA APLICACIÓN
// =================================================================
const app = express();
const PORT = process.env.PORT || 3000;

// =================================================================
// 4. MIDDLEWARES GLOBALES
// =================================================================
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// 📁 Localizador inteligente de la carpeta 'uploads'
let pathUploads = path.join(__dirname, 'uploads');
if (!fs.existsSync(pathUploads)) {
  pathUploads = path.resolve(__dirname, '..', 'uploads');
}
app.use('/uploads', express.static(pathUploads));

// =================================================================
// 5. PARCHE DE AUDITORÍA
// =================================================================
const checkRoute = (name, obj) => {
  if (!obj || Object.keys(obj).length === 0) {
    console.error(`🚨 ERROR CRÍTICO: El archivo de rutas '${name}' no está exportando un router válido.`);
  }
};

checkRoute('authRoutes', authRoutes);
checkRoute('carRoutes', carRoutes);
checkRoute('precioMensualRoutes', precioMensualRoutes);
checkRoute('requisitoRoutes', requisitoRoutes);
checkRoute('routeRoutes', routeRoutes);
checkRoute('reservaRoutes', reservaRoutes);
checkRoute('chatRoutes', chatRoutes);
checkRoute('bannerRoutes', bannerRoutes);
checkRoute('weatherRoutes', weatherRoutes);
checkRoute('ventaRoutes', ventaRoutes); 

// =================================================================
// 6. VINCULACIÓN DE LOS ENDPOINTS
// =================================================================

app.use('/api/auth', authRoutes);

app.use('/api/cars', carRoutes);
app.use('/api/admin/autos', carRoutes); 

app.use('/api/precios-mensuales', precioMensualRoutes);
app.use('/api/admin/precios-mensuales', precioMensualRoutes); 

app.use('/api/requisitos', requisitoRoutes);
app.use('/api/admin/requisitos', requisitoRoutes); 

// --- RUTAS DE VENTAS Y RESERVAS ---
app.use('/api/ventas', ventaRoutes); 
app.use('/api/admin/ventas', ventaRoutes); 

app.use('/api/routes', routeRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/clima', weatherRoutes); 

// 🧠 ASISTENTE DE MARKETING IA (CORRECCIÓN 404 frontend)
app.post('/api/ai-marketing-suggestion', (req, res) => {
  try {
    const { resumen } = req.body; // Aquí llega la string armada por el front con las métricas del período[cite: 4]
    
    // NOTA: Cuando desees conectar con la API real de OpenAI o Gemini, 
    // usarás aquí las variables de entorno de tu archivo .env.
    
    const respuestaSugerencia = `📊 **Análisis Estratégico Good Trip**
    
    • **Optimización de Flota:** El modelo más solicitado está concentrando la mayor parte de tu demanda. Asegura inspecciones preventivas rigurosas en taller para evitar lucros cesantes.
    • **Estrategia Comercial:** Si detectas un crecimiento negativo respecto al mes previo, implementa campañas de retargeting enfocadas en el turismo receptivo de aeropuertos.
    • **Recomendación de Tarifas:** Durante los meses pico detectados, evalúa incrementar la tarifa diaria en un 5% de manera escalonada en el segmento de cajas automáticas.`;

    return res.json({ suggestion: respuestaSugerencia });
  } catch (error) {
    console.error("❌ Error en asistente de marketing:", error.message);
    return res.status(500).json({ error: "No se pudo procesar el análisis de marketing en este momento." });
  }
});

// =================================================================
// 7. RUTA DE CONTROL DE SALUD (Health Check)
// =================================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =================================================================
// 8. MANEJO GLOBAL DE ERRORES
// =================================================================
app.use((err, req, res, next) => {
  console.error("❌ Error no controlado en el Servidor:", err.stack);
  res.status(500).json({
    error: "Ocurrió un error interno en el servidor de Good Trip.",
    details: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// =================================================================
// 9. ENCENDIDO DEL SERVIDOR
// =================================================================
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVIDOR DE GOOD TRIP INICIADO CON ÉXITO`);
  console.log(`📡 Escuchando peticiones en el puerto: ${PORT}`);
  console.log(`====================================================`);
});