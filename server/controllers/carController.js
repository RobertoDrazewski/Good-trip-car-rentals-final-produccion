const cloudinary = require('cloudinary').v2;
const db = require('../config/db.config');

// ☁️ Configuración del SDK de Cloudinary para almacenamiento multimedia
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 🕵️‍♂️ FUNCIÓN AUXILIAR DE EXTRACCIÓN SEGURA
 * Evita el crasheo destructivo al desempaquetar la respuesta del pool de base de datos,
 * adaptándose dinámicamente a controladores de PostgreSQL, MySQL o MariaDB.
 */
const extraerFilas = (resultado) => {
  if (!resultado) return [];
  if (Array.isArray(resultado)) {
    return Array.isArray(resultado[0]) ? resultado[0] : resultado;
  }
  if (resultado.rows) return resultado.rows;
  if (resultado.results) return resultado.results;
  return [];
};

/**
 * 🛠️ FUNCIÓN AUXILIAR DE NORMALIZACIÓN (REPARADA)
 * Convierte el campo 'features' de formato String/JSON a su estructura original de JavaScript.
 * Si es el objeto maestro de métricas e íconos, lo preserva intacto para el frontend.
 */
const normalizarFeaturesSalida = (carFeatures) => {
  if (!carFeatures) return { puntaje_confort: 5, puntaje_seguridad: 5, puntaje_ficha: 5, iconos: {} };
  
  // Si ya es un objeto o array mapeado por el pool, lo retornamos directo
  if (typeof carFeatures === 'object') return carFeatures;
  
  try {
    const parsed = JSON.parse(carFeatures);
    // 👈 REPARADO: Si es un objeto de configuración directo, no lo envolvemos en un Array
    return parsed;
  } catch (e) {
    // Caso de respaldo por si existen registros viejos guardados como strings separados por comas
    if (typeof carFeatures === 'string') {
      const listaPlana = carFeatures.split(',').map(f => f.trim());
      const iconosSimulados = {};
      listaPlana.forEach(f => { if(f) iconosSimulados[f] = true; });
      return {
        puntaje_confort: 5,
        puntaje_seguridad: 5,
        puntaje_ficha: 5,
        iconos: iconosSimulados
      };
    }
    return { puntaje_confort: 5, puntaje_seguridad: 5, puntaje_ficha: 5, iconos: {} };
  }
};

/**
 * 1. OBTENER TODOS LOS AUTOS (Consumido por router.get('/'))
 */
const getAllCars = async (req, res) => {
  try {
    const rawResult = await db.query("SELECT * FROM cars ORDER BY id DESC");
    const rows = extraerFilas(rawResult);
    
    // Mapeamos los autos inyectando las características parseadas correctamente como objetos puros
    const formattedCars = rows.map(car => ({
      ...car,
      features: normalizarFeaturesSalida(car.features)
    }));
    
    return res.json(formattedCars);
  } catch (error) {
    console.error("❌ Error al listar autos:", error.message);
    return res.status(500).json({ error: "No se pudieron leer los vehículos del sistema." });
  }
};

/**
 * 2. OBTENER AUTO POR ID (Consumido por router.get('/:id'))
 */
const getCarById = async (req, res) => {
  const { id } = req.params;
  try {
    const rawResult = await db.query("SELECT * FROM cars WHERE id = ?", [id]);
    const rows = extraerFilas(rawResult);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }
    
    const car = rows[0];
    car.features = normalizarFeaturesSalida(car.features);
    
    return res.json(car);
  } catch (error) {
    console.error("❌ Error al buscar el auto por ID:", error.message);
    return res.status(500).json({ error: "Error interno en el servidor logístico." });
  }
};

/**
 * 3. CREAR AUTO (Consumido por router.post('/'))
 * Soporta la carga binaria de imagen a través del buffer en memoria RAM de Multer.
 */
const createCar = async (req, res) => {
  const { 
    modelo, descripcion_larga, patente, color, transmision, 
    prices_ars, estado, latitud, longitud, odometro, features 
  } = req.body;

  if (!modelo || !patente) {
    return res.status(400).json({ error: "El modelo y la patente son requisitos obligatorios." });
  }

  try {
    let imagenUrlFinal = null;

    // Si viene un archivo binario desde la petición HTTP (Multer)
    if (req.file) {
      const uploadResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "good_trip/cars" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imagenUrlFinal = uploadResponse.secure_url;
    }

    // Serialización del equipamiento a cadena stringificable JSON
    let featuresJSON = "{}";
    if (features) {
      featuresJSON = typeof features === 'string' ? features : JSON.stringify(features);
    }

    const queryText = `
      INSERT INTO cars 
        (modelo, descripcion_larga, patente, color, transmision, prices_ars, imagen_url, estado, latitud, longitud, odometro, features) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(queryText, [
      modelo, descripcion_larga || '', patente, color || '#121319', transmision || 'Manual',
      prices_ars || 0, imagenUrlFinal, estado || 'Disponible',
      latitud || null, longitud || null, odometro || 0, featuresJSON
    ]);

    return res.json({ success: true, message: "Vehículo dado de alta en la flota corporativa con éxito." });
  } catch (error) {
    console.error("❌ Error al crear auto en base de datos:", error.message);
    return res.status(500).json({ error: "No se pudo guardar el registro del vehículo: " + error.message });
  }
};

/**
 * 4. ACTUALIZAR AUTO (Consumido por router.put('/:id'))
 * Modifica todos los parámetros funcionales y soporta la preservación u optimización de imagen vieja.
 */
const updateCar = async (req, res) => {
  const { id } = req.params;
  const { 
    modelo, descripcion_larga, patente, color, transmision, 
    prices_ars, imagen_url, estado, latitud, longitud, odometro, features 
  } = req.body;
  
  try {
    let imagenUrlFinal = imagen_url; // Por defecto mantiene la URL de imagen actual si no se sube una nueva

    // Si se subió un nuevo archivo binario desde el panel administrador
    if (req.file) {
      const uploadResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "good_trip/cars" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imagenUrlFinal = uploadResponse.secure_url;
    }
    
    let featuresJSON = "{}";
    if (features) {
      featuresJSON = typeof features === 'string' ? features : JSON.stringify(features);
    }

    const queryText = `
      UPDATE cars SET 
        modelo=?, descripcion_larga=?, patente=?, color=?, transmision=?, 
        prices_ars=?, imagen_url=?, estado=?, latitud=?, longitud=?, 
        odometro=?, features=? 
      WHERE id=?
    `;

    await db.query(queryText, [
      modelo, descripcion_larga, patente, color, transmision, 
      prices_ars || 0, imagenUrlFinal, estado, latitud || null, longitud || null, 
      odometro || 0, featuresJSON, id
    ]);

    return res.json({ success: true, message: "Parámetros del vehículo actualizados correctamente." });
  } catch (error) {
    console.error("❌ Error al actualizar el auto:", error.message);
    return res.status(500).json({ error: "Error crítico: No se pudieron guardar los cambios en el servidor." });
  }
};

/**
 * 5. ELIMINAR AUTO (Consumido por router.delete('/:id'))
 */
const deleteCar = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM cars WHERE id = ?", [id]);
    return res.json({ success: true, message: "Vehículo removido del sistema operativo." });
  } catch (error) {
    console.error("❌ Error al eliminar el auto:", error.message);
    return res.status(500).json({ error: "No se pudo remover el vehículo debido a restricciones de integridad." });
  }
};

module.exports = {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar
};