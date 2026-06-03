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
    // Permitimos descuento = 0 ("precio de lista"); solo exigimos que vengan presentes
    if (!evento || descuento === undefined || descuento === null || descuento === '') {
      return res.status(400).json({ error: "Datos incompletos." });
    }

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
          content: `Eres un Director de Arte experto en publicidad para alquiler de autos en Mendoza, Argentina. 

          *REGLA #1 — EL AUTO ES EL PROTAGONISTA ABSOLUTO:*
          - La imagen SIEMPRE debe tener un automóvil de alquiler moderno y limpio como sujeto principal, grande, nítido y en primer plano (hero shot).
          - El auto ocupa el centro de atención. El paisaje, la temporada y el evento son SOLO el fondo/contexto, nunca el tema principal.
          - PROHIBIDO generar escenas sin un auto claramente visible. PROHIBIDO mercados, ferias, personas comprando, retratos de personas como tema central, o cualquier escena que no sea claramente sobre alquiler de autos.

          *REGLA #2 — GEOGRAFÍA Y CLIMA (HEMISFERIO SUR):* 
          - Diciembre (Navidad) es VERANO INTENSO (calor, 40°C, sol radiante). PROHIBIDO USAR NIEVE EN NAVIDAD.
          - Enero/Febrero: Verano. Julio: Invierno (frío, nieve en cordillera).

          *REGLA #3 — PROMOCIONES BANCARIAS / FINANCIACIÓN / CUOTAS (ej: "Banco Macro", "cuotas sin interés", "3 y 6 cuotas"):*
          - NO intentes dibujar logos, tarjetas, texto ni el isotipo del banco: los modelos de imagen los renderizan mal y quedan ilegibles.
          - En su lugar, generá una escena premium y aspiracional de alquiler de autos (el auto hero sobre paisaje mendocino soleado), estética comercial limpia y moderna, con una ZONA LIBRE / espacio negativo limpio en una esquina (cielo o pared lisa) donde luego se superpondrá el logo real del banco por encima.

          TU OBJETIVO: prompts fotorrealistas de alta calidad (8k, cinematográfico) con el AUTO como héroe.

          ESCENOGRAFÍA SEGÚN EVENTO (siempre con el auto en primer plano):
          - Navidad (VERANO): auto moderno bajo sol fuerte y cielo azul, adornos navideños veraniegos sutiles de fondo.
          - Vendimia / Caminos del Vino (Marzo/Otoño): el auto en un camino entre viñedos, bodega mendocina y Andes de fondo.
          - Fiestas Patrias: el auto con banderas argentinas y escarapelas integradas sutilmente al ambiente.
          - Invierno (Julio): el auto en ruta de alta montaña con los Andes nevados de fondo.
          - Verano (Dique Potrerillos): el auto junto a un lago mendocino soleado.
          - Otoño/Primavera: el auto resaltado con los colores de la estación.

          FORMATO:
          - NO agregues textos, letras, palabras ni logos en la imagen.
          - Devuelve SOLO el texto del prompt en inglés, sin introducciones ni comillas.`
        }, {
          role: "user",
          content: `Evento publicitario: "${evento}". Generá el prompt visual en inglés. Recordá: un AUTO DE ALQUILER moderno como sujeto principal en primer plano (hero shot), respetando el clima del hemisferio sur y la geografía mendocina. Si el evento menciona un banco, tarjetas o cuotas, NO dibujes logos ni texto: dejá una esquina limpia para superponer el logo real después.`
        }]
      });
      promptImagenOptimizado = promptBuilder.choices[0].message.content.trim();
    } catch (promptError) {
      promptImagenOptimizado = "Cinematic professional advertising photography of a modern clean rental car as the main subject in the foreground (hero shot), on a scenic mountain road in Mendoza Argentina, majestic Andes mountains in the background, warm sunny light, highly detailed, 8k, no text, no logos.";
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