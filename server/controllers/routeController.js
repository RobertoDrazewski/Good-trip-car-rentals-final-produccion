// server/controllers/routeController.js
const { OpenAI } = require('openai');
const cloudinary = require('cloudinary').v2;
const db = require('../config/db.config'); // Conector unificado del proyecto

// Instancia de OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 1. MEJORAR DESCRIPCIÓN TURÍSTICA CON IA
 */
const mejorarDescripcionAI = async (req, res) => {
  try {
    const { titulo, descripcion_base } = req.body;
    
    if (!titulo || !descripcion_base) {
      return res.status(400).json({ error: "Faltan datos para procesar la sugerencia." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "Eres un guía expert de Mendoza, Argentina. Tu objetivo es redactar reseñas breves, poéticas y atrapantes orientadas al turismo en auto. Máximo 200 caracteres." },
        { role: "user", content: `Mejora este texto para la locación o ruta '${titulo}': ${descripcion_base}` }
      ],
      temperature: 0.7
    });

    return res.json({ suggestion: completion.choices[0].message.content });
  } catch (error) {
    console.error("❌ Error OpenAI en rutas:", error.message);
    return res.status(500).json({ error: "La IA no se encuentra disponible en este momento." });
  }
};

/**
 * 2. GUARDAR NUEVA RUTA TURÍSTICA EN LA NUBE Y BASE DE DATOS
 */
const saveRoute = async (req, res) => {
  try {
    console.log("📥 Datos del itinerario recibidos:", req.body);
    
    const { titulo, descripcion, orden, maps_url } = req.body;
    let imagenUrlFinal = null;

    // Si viene una imagen adjunta por Multer (Buffer en memoria RAM)
    if (req.file) {
      console.log(`📤 Subiendo imagen de ruta '${req.file.originalname}' a Cloudinary...`);
      
      const uploadResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "good_trip/rutas" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      imagenUrlFinal = uploadResponse.secure_url;
      console.log("✅ Imagen subida con éxito:", imagenUrlFinal);
    } else {
      console.log("⚠️ No se recibió archivo de imagen (usará valor nulo o fallback)");
    }

    const queryText = `
      INSERT INTO routes (titulo, descripcion, imagen_url, orden, maps_url) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.query(queryText, [titulo, descripcion, imagenUrlFinal, orden || 0, maps_url || null]);

    return res.json({ status: 'success', message: "Ruta e itinerario turístico guardado correctamente." });
  } catch (error) {
    console.error("❌ Error fatal al guardar ruta:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 3. OBTENER TODAS LAS RUTAS (Para el Home del Cliente / Guía Interactiva)
 * ✨ CORRECCIÓN INTEGRAL CONTRA ERRORES DE ITERACIÓN DE PROMESAS
 */
const getAllRoutes = async (req, res) => {
  try {
    // Solicitamos la consulta de forma cruda al driver configurado
    const queryResult = await db.query('SELECT * FROM routes ORDER BY orden ASC, id DESC');
    
    // 🛡️ CONTROL DE COMPATIBILIDAD DE DRIVER:
    // Captura variaciones de librerías (mysql2 clásica, mysql2/promise o knex/pooling)
    let rows = [];
    if (Array.isArray(queryResult)) {
      rows = Array.isArray(queryResult[0]) ? queryResult[0] : queryResult;
    } else if (queryResult && queryResult.rows) {
      rows = queryResult.rows;
    }

    console.log(`🗺️ Catálogo de rutas recuperado con éxito. Cantidad: ${rows.length}`);

    // Mapeo seguro de compatibilidad para evitar que el front se quede sin imágenes
    const rutasFormateadas = rows.map(ruta => ({
      ...ruta,
      imagen: ruta.imagen_url || ruta.imagen || null
    }));

    return res.json(rutasFormateadas);

  } catch (error) {
    console.error("❌ Error real al obtener rutas de la base de datos:", error.message);
    return res.status(500).json({ 
      error: "Error al cargar los caminos de la base de datos.",
      details: error.message 
    });
  }
};

/**
 * 4. ELIMINAR RUTA TURÍSTICA
 */
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    
    const queryResult = await db.query('SELECT id FROM routes WHERE id = ?', [id]);
    
    let rows = [];
    if (Array.isArray(queryResult)) {
      rows = Array.isArray(queryResult[0]) ? queryResult[0] : queryResult;
    } else if (queryResult && queryResult.rows) {
      rows = queryResult.rows;
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "La ruta seleccionada no existe en el catálogo." });
    }

    await db.query('DELETE FROM routes WHERE id = ?', [id]);
    console.log(`🗑️ Ruta con ID ${id} borrada del sistema de forma permanente`);
    
    return res.json({ status: 'success', message: "Ruta eliminada correctamente." });
  } catch (error) {
    console.error("❌ Error fatal al eliminar ruta:", error.message);
    return res.status(500).json({ error: "Error interno del servidor al procesar la baja." });
  }
};

module.exports = {
  mejorarDescripcionAI,
  saveRoute,
  getAllRoutes,
  deleteRoute
};