// server/controllers/bannerController.js
const { OpenAI } = require('openai');
const cloudinary = require('cloudinary').v2;
const db = require('../config/db.config');
const path = require('path');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const MACRO_LOGO_PUBLIC_ID = 'good_trip/macro_logo';
let _macroLogoListo = false;

const prepararLogoMacro = async () => {
  if (_macroLogoListo) return true;

  const candidatos = [
    process.env.MACRO_LOGO_PATH,                                                       
    path.join(__dirname, '..', 'assets', 'macro-logo.png'),                            
    path.join(__dirname, '..', '..', 'client', 'src', 'assets', 'macro-logo.png'),     
    path.join(__dirname, '..', '..', 'client', 'public', 'macro-logo.png'),            
  ].filter(Boolean);

  const archivo = candidatos.find(p => { try { return fs.existsSync(p); } catch { return false; } });
  if (!archivo) {
    console.warn('⚠️ No encontré macro-logo.png. Busqué en:\n   ' + candidatos.join('\n   '));
    return false;
  }

  try {
    await cloudinary.uploader.upload(archivo, {
      public_id: MACRO_LOGO_PUBLIC_ID, overwrite: false, resource_type: 'image'
    });
    _macroLogoListo = true;
    return true;
  } catch (e) {
    return false;
  }
};

const esPromoMacro = (titulo, descripcion) =>
  /macro/i.test(`${titulo || ''} ${descripcion || ''}`);

const generarPropuesta = async (req, res) => {
  try {
    const { evento, descuento } = req.body;
    if (!evento || descuento === undefined || descuento === null || descuento === '') {
      return res.status(400).json({ error: "Datos incompletos." });
    }

    let descripcionFinal = "";
    let imageUrl = "";

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

    // DETECCIÓN INTELIGENTE DE BANCO MACRO PARA EL PROMPT VISUAL
    const esMacro = /macro/i.test(evento);
    let promptImagenOptimizado = "";

    try {
      const promptBuilder = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{
          role: "system",
          content: `You are an expert Digital Marketing Agent and Art Director specializing in premium car rental advertising in Mendoza, Argentina. Your job is to output a stunning, realistic commercial image prompt in English.

          ${esMacro ? `
          *CRITICAL RULES FOR BANCO MACRO PROMOTIONS (STRICT LAYOUT):*
          1. MANDATORY PANORAMIC FRAMING: The car must be placed EXACTLY IN THE HORIZONTAL CENTER of the image (floating in the middle vertical alignment, not at the bottom) because the canvas will be cropped into a wide horizontal banner.
          2. DARK SPACE FOR WHITE LOGO: Directly above the car, design a clean, DARK background area (deep shadows, dark mountain silhouettes, or night sky). Do NOT use bright blue skies or direct bright sun in that top-middle area, as a white logo will be overlaid on top.
          3. FLEET: Feature a modern rental car (Fiat Cronos or Nissan Versa) in black, gray, or white.
          ` : `
          *RULES FOR GENERAL MARKETING PROMOTIONS (MENDOZA RADIANT STYLE):*
          1. WEATHER & LIGHTING: Mendoza is famous for having 300+ sunny days a year. Always feature gorgeous, bright, radiant sunny weather with clear skies. EXCEPTION: Only if the user prompt mentions a dinner or going out at night ("cena", "cenar", "noche"), you must switch to a vibrant, elegant evening/night setting with beautiful ambient lighting.
          2. CAR CATALOG (OUR FLEET): The image must explicitly feature one modern rental car from our precise catalog: either a "Fiat Cronos" or a "Nissan Versa". The car color must be strictly black, gray, or white.
          3. REGIONAL & SEASONAL CONTEXT (Adapt strictly to the user's event):
             - Autumn ("otoño", "bodegas", "vino", "wineries"): The car driving along scenic roads, surrounded by golden, orange, and reddish vineyards under a warm, glowing sun.
             - Summer ("verano"): Feature the Potrerillos dam ("el dique Potrerillos") with clear sparkling turquoise water and people practicing water sports (windsurfing, kayaking) in the background scenery.
             - Winter ("invierno", "nieve"): Show the breathtaking, massive snow-covered Andes mountains with clear skies and people skiing in the background.
             - Christmas / Three Kings Day ("navidad", "reyes magos"): Note that December/January brings 40°C summer heat in Mendoza. Show a joyful Santa Claus wearing a light summer short-sleeved shirt, or elegant summer-themed festive holiday decorations outdoors.
             - Easter & National Holidays ("pascuas", "fiestas patrias", "feriados nacionales", "25 de mayo", "9 de julio"): Elegantly incorporate beautiful Argentine flags waving proudly under a radiant blue sky.
             - Family/Special Days (Mother's Day, Father's Day, Children's Day, Holy Week / Semana Santa): Create a warm, emotional, professional marketing backdrop showing premium family or leisure road trips around Mendoza's iconic landscapes.
          `}

          *STRICT NEGATIVE RULES:*
          - NO text, letters, typography, fake signage, or logos drawn inside the image artwork.
          - Output ONLY the final detailed prompt string in English. Do not add introductions or conversational filler.`
        }, {
          role: "user",
          content: `Create the visual prompt for this promotional banner event: "${evento}".`
        }]
      });
      promptImagenOptimizado = promptBuilder.choices[0].message.content.trim();
    } catch (promptError) {
      // Fallback seguro por si falla la API de texto
      promptImagenOptimizado = esMacro 
        ? "Cinematic advertising photography of a modern rental car situated directly in the horizontal CENTER. Above the car, a completely DARK background for text overlay, Mendoza Argentina, 8k, no text."
        : `Cinematic marketing photography of a white Fiat Cronos driving through Mendoza, beautiful sunny day, professional composition, 8k, ultra-detailed, no text. Event context: ${evento}`;
    }

    console.log(`[IA Prompt Generado]: "${promptImagenOptimizado}"`);

    try {
      const image = await openai.images.generate({
        model: "gpt-image-2",
        prompt: promptImagenOptimizado,
        n: 1,
        size: "1024x1024"
      });

      if (image && image.data && image.data[0]) {
        imageUrl = image.data[0].url || image.data[0].b64_json;
      }
    } catch (imageError) {
      imageUrl = "https://images.unsplash.com/photo-1589182373814-4d6d02a0fb20?q=80&w=1024&auto=format&fit=crop"; 
    }

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
    res.status(500).json({ error: "Error interno en el servidor de IA." }); 
  }
};

const savePromo = async (req, res) => {
  try {
    let { titulo, descripcion, imagen_url, descuento, fecha_inicio, fecha_fin } = req.body;

    const uploadOpts = { folder: "good_trip/banners" };
    
    if (esPromoMacro(titulo, descripcion) && await prepararLogoMacro()) {
      uploadOpts.transformation = [
        { overlay: MACRO_LOGO_PUBLIC_ID.replace(/\//g, ':') },
        { width: 500, crop: "scale" },
        { flags: "layer_apply", gravity: "center", y: -40 } 
      ];
    }

    const uploadResponse = await cloudinary.uploader.upload(imagen_url, uploadOpts);
    const dbPath = uploadResponse.secure_url; 
    
    await db.query(
      `INSERT INTO banners_promo (titulo, descripcion, imagen_url, descuento, fecha_inicio, fecha_fin) 
       VALUES (?, ?, ?, ?, ?, ?)`, 
      [titulo, descripcion || '', dbPath, descuento, fecha_inicio || null, fecha_fin || null]
    );
    
    res.json({ success: true, dbPath });
  } catch (error) {
    res.status(500).json({ error: "No se pudo almacenar la promoción." });
  }
};

const getAllBanners = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM banners_promo ORDER BY id DESC`);
    const rows = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : (result.rows || []);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error de lectura DB." });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM banners_promo WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el banner." });
  }
};

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