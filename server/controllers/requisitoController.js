// server/controllers/requisitoController.js
const db = require('../config/db.config');

/**
 * 1. OBTENER TODOS LOS REQUISITOS (Público / Admin)
 * Extracción inteligente para evitar errores "is not iterable"
 */
const getAllRequisitos = async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM requisitos ORDER BY id ASC");
    
    let filas = [];

    // Extracción tolerante según el driver (mysql2, pg, o pool directo)
    if (Array.isArray(resultado)) {
      filas = Array.isArray(resultado[0]) ? resultado[0] : resultado;
    } else if (resultado && resultado.rows) {
      filas = resultado.rows;
    } else if (resultado && resultado.results) {
      filas = resultado.results;
    } else {
      filas = resultado;
    }

    const respuestaFinal = Array.isArray(filas) ? filas : [];
    return res.json(respuestaFinal);

  } catch (error) {
    console.error("❌ Error real al listar requisitos:", error.message);
    return res.status(500).json({ error: "Error al leer las políticas de la base de datos." });
  }
};

/**
 * 2. CREAR UN REQUISITO (Admin)
 */
const createRequisito = async (req, res) => {
  const { titulo, descripcion, icono } = req.body;
  if (!titulo || !descripcion) {
    return res.status(400).json({ error: "El título y la descripción son obligatorios." });
  }
  try {
    await db.query(
      "INSERT INTO requisitos (titulo, descripcion, icono) VALUES (?, ?, ?)",
      [titulo, descripcion, icono || '📌']
    );
    return res.status(201).json({ success: true, message: "Política/Requisito comercial registrado." });
  } catch (error) {
    console.error("❌ Error al crear requisito:", error.message);
    return res.status(500).json({ error: "Error interno al guardar el requisito." });
  }
};

/**
 * 3. ACTUALIZAR UN REQUISITO (Admin)
 */
const updateRequisito = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, icono } = req.body;
  try {
    await db.query(
      "UPDATE requisitos SET titulo = ?, descripcion = ?, icono = ? WHERE id = ?",
      [titulo, descripcion, icono, id]
    );
    return res.json({ success: true, message: "Requisito comercial actualizado con éxito." });
  } catch (error) {
    console.error("❌ Error al actualizar requisito:", error.message);
    return res.status(500).json({ error: "No se pudo actualizar el requisito." });
  }
};

/**
 * 4. ELIMINAR UN REQUISITO (Admin)
 */
const deleteRequisito = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM requisitos WHERE id = ?", [id]);
    return res.json({ success: true, message: "Requisito eliminado del sistema." });
  } catch (error) {
    console.error("❌ Error al eliminar requisito:", error.message);
    return res.status(500).json({ error: "No se pudo eliminar el requisito." });
  }
};

// 📦 EXPORTACIÓN UNIFICADA SIN ERRORES DE SINTAXIS
module.exports = {
  getAllRequisitos,
  createRequisito,
  updateRequisito,
  deleteRequisito
};