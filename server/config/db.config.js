// server/config/db.config.js
const mysql = require('mysql2');
require('dotenv').config();

// 🚀 Configuración corregida para leer tu .env actual de forma estricta
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'zephyr.proxy.rlwy.net',
  port: parseInt(process.env.DB_PORT) || 30561,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'HwdLDQUnMdSQCnALpZnhLCiPKSSQYODn',
  database: process.env.DB_NAME || 'railway', // 👈 Cambiado a 'railway' por defecto para evitar el error de base de datos desconocida
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convertimos el pool para que soporte promesas (async / await)
const promisePool = pool.promise();

module.exports = {
  /**
   * Ejecuta una consulta SQL mapeando el resultado al formato estándar { rows }
   * @param {string} text - Consulta SQL con placeholders (?)
   * @param {Array} params - Parámetros para la consulta
   */
  query: async (text, params) => {
    try {
      // MySQL devuelve [rows, fields], solo nos interesan las filas
      const [rows] = await promisePool.query(text, params);
      return { rows };
    } catch (error) {
      console.error('❌ Error en la base de datos MySQL:', error.message);
      throw error;
    }
  }
};