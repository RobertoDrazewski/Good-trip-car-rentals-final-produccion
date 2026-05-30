// server/controllers/bannerController.js
const { OpenAI } = require('openai');
const cloudinary = require('cloudinary').v2;
const db = require('../config/db.config');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 1. GENERAR PROPUESTA CON IA (Copy + Director Creativo + Modelo gpt-image-2)
 */
const generarPropuesta = async (req, res) => {
  try {
    const { evento, descuento } = req.body;
    if (!evento || !descuento) return res.status(400).json({ error: "Datos incompletos." });

    let descripcionFinal = "";
    let imageUrl = "";

    // 1A. GENERACIÓN DEL COPY COMERCIAL
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ 
          role: "user", 
          content: `Crea un copy muy corto (máximo 15 palabras) para un banner de alquiler de autos en Mendoza. Evento o temporada: ${evento}, Descuento: ${descuento}%.` 
        }]
      });
      descripcionFinal = completion.choices[0].message.content.replace(/"/g, '');
    } catch (textError) {
      descripcionFinal = `¡Aprovechá un ${descuento}% de descuento en Mendoza para este ${evento}! Reserva hoy tu vehículo.`;
    }

    // 1B. LÓGICA DINÁMICA DE PROMPT (DIRECTOR CREATIVO MENDOCINO - SE MANTIENE INTACTO)
    let promptImagenOptimizado = "";
    try {
      const promptBuilder = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{
          role: "system",
          content: `Eres un Director de Arte experto en publicidad para turismo en Mendoza, Argentina. 
          
          *REGLA CRÍTICA DE GEOGRAFÍA Y CLIMA:* Mendoza está en el HEMISFERIO SUR. 
          - Diciembre (Navidad) es VERANO INTENSO (calor, 40°C, sol radiante).
          - Enero/Febrero es Verano.
          - Julio es Invierno (frío, nieve en cordillera).
          *PROHIBIDO TOTALMENTE USAR NIEVE EN CONTEXTOS DE NAVIDAD.*

          TU OBJETIVO: Crear prompts fotorrealistas de alta calidad (8k, cinematográfico) para fondos publicitarios.
          
          REGLAS DE ESCENOGRAFÍA ESPECÍFICAS (Aplica la que corresponda al evento):
          - Navidad en Mendoza (VERANO): Muestra un ambiente de verano soleado y caluroso en Mendoza (sol fuerte, cielo azul intenso). Incluye adornos navideños tradicionales (luces, árboles) pero adaptados al calor. *PRIORIDAD ABSOLUTA:* Mostrar a Santa Claus recognoscible por su barba y colores, pero vestido con ropa de verano, como un traje de baño rojo o una camisa de manga corta roja, quizás sentado en una reposera junto a una piscina o comiendo un helado, en un entorno de verano mendocino.
          - Fiesta del Melón: Muestra un festival local rural incorporando melones frescos en un campo soleado.
          - Vendimia / Caminos del Vino (Marzo/Otoño): Viñedos extensos, arquitectura de bodega mendocina, uvas maduras, y un auto paseando por el camino, Andes de fondo.
          - Fiestas Patrias o Nacionales: Integra sutilmente banderas argentinas y escarapelas en un ambiente de celebración.
          - Invierno (Julio): Paisajes nevados en la alta montaña (Andes) con personas haciendo deportes de nieve.
          - Verano (Enero/Dique): El dique Potrerillos u otro lago mendocino soleado con personas haciendo deportes acuáticos.
          - Otoño / Primavera: Resalta los colores de la estación (hojas doradas en otoño, flores vibrantes en primavera).
          
          REGLAS DE FORMATO:
          - NO agregues textos, letras, palabras ni logos en la imagen.
          - Devuelve SOLO el texto del prompt in inglés, sin introducciones ni comillas.`
        }, {
          role: "user",
          content: `Analiza este evento publicitario: "${evento}". Devuelve el prompt visual en inglés respetando estrictamente el clima del hemisferio sur, nuestra geografía mendocina y el formato.`
        }]
      });
      promptImagenOptimizado = promptBuilder.choices[0].message.content.trim();
    } catch (promptError) {
      promptImagenOptimizado = "Cinematic professional background photography of a scenic mountain road trip in Mendoza Argentina, majestic Andes mountains, beautiful landscape, high detailed, 4k, no text.";
    }

    console.log(`[IA Prompt Generado]: "${promptImagenOptimizado}"`);

    // 1C. GENERACIÓN DE LA IMAGEN REAL (USANDO TU MODELO PERMITIDO: gpt-image-2)
    try {
      const image = await openai.images.generate({
        model: "gpt-image-2", // 👈 Cambiado al modelo compatible de tu lista
        prompt: promptImagenOptimizado,
        n: 1,
        size: "1024x1024"
      });

      if (image && image.data && image.data[0]) {
        imageUrl = image.data[0].url || image.data[0].b64_json;
      }
    } catch (imageError) {
      console.error("❌ Error en generación de imagen con gpt-image-2:", imageError.message);
      imageUrl = "https://images.unsplash.com/photo-1589182373814-4d6d02a0fb20?q=80&w=1024&auto=format&fit=crop"; 
    }

    // Preparar Base64 para el frontend en caso de ser necesario
    if (imageUrl && (imageUrl.startsWith("iVBORw0Gg") || (!imageUrl.startsWith("http") && imageUrl.length > 1000))) {
      imageUrl = `data:image/png;base64,${imageUrl.replace(/^data:image\/\w+;base64,/, "")}`;
    }

    res.json({
      titulo: `PROMO ${evento.toUpperCase()}`,
      descripcion: descripcionFinal,
      imagen_url: imageUrl,
      descuento: parseInt(descuento)
    });
  } catch (error) {
    console.error("Error general en el controlador de IA:", error);
    res.status(500).json({ error: "Error interno en el servidor de IA." }); 
  }
};

/**
 * 2. GUARDAR BANNER EN BD Y CLOUDINARY
 */
const savePromo = async (req, res) => {
  try {
    let { titulo, descripcion, imagen_url, descuento, fecha_inicio, fecha_fin } = req.body;
    
    console.log("📤 Subiendo imagen de banner a Cloudinary...");
    const uploadResponse = await cloudinary.uploader.upload(imagen_url, {
      folder: "good_trip/banners"
    });

    const dbPath = uploadResponse.secure_url; 
    
    await db.query(
      `INSERT INTO banners_promo (titulo, descripcion, imagen_url, descuento, fecha_inicio, fecha_fin) 
       VALUES (?, ?, ?, ?, ?, ?)`, 
      [titulo, descripcion || '', dbPath, descuento, fecha_inicio || null, fecha_fin || null]
    );
    
    res.json({ success: true, dbPath });
  } catch (error) {
    console.error("❌ Error al guardar la promoción:", error.message);
    res.status(500).json({ error: "No se pudo almacenar la promoción." });
  }
};

/**
 * 3. LISTAR TODOS LOS BANNERS
 */
const getAllBanners = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM banners_promo ORDER BY id DESC`);
    const rows = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : (result.rows || []);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error en getAllBanners:", error.message);
    res.status(500).json({ error: "Error de lectura DB." });
  }
};

/**
 * 4. ELIMINAR BANNER
 */
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM banners_promo WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el banner." });
  }
};

/**
 * 5. CONSULTAR BANNERS ACTIVOS
 */
const getAllActivePromos = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM banners_promo WHERE fecha_fin >= CURDATE() OR fecha_fin IS NULL ORDER BY id DESC`);
    const rows = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : (result.rows || []);
    res.json(rows);
  } catch (error) {
    res.status(500).json([]);
  }
};

const getActiveBannerLegacy = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM banners_promo WHERE fecha_fin >= CURDATE() OR fecha_fin IS NULL ORDER BY id DESC LIMIT 1`);
    const rows = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : (result.rows || []);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ message: "No hay promos." });
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
};

module.exports = {
  generarPropuesta,
  savePromo,
  getAllBanners,
  deleteBanner,
  getAllActivePromos,
  getActiveBannerLegacy
};