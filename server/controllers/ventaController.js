// server/controllers/ventaController.js
const db = require('../config/db.config');

const extraerFilas = (r) => {
  if (!r) return [];
  if (r.rows) return Array.isArray(r.rows) ? r.rows : [];
  if (Array.isArray(r) && Array.isArray(r[0])) return r[0];
  if (Array.isArray(r)) return r;
  return [];
};

// GET /api/ventas — LEFT JOIN con cars para modelo, patente, imagen
const getAllVentas = async (req, res) => {
  try {
    const raw = await db.query(`
      SELECT
        r.id, r.auto_id, r.cliente_nombre, r.cliente_whatsapp,
        r.fecha_inicio, r.hora_inicio, r.fecha_fin, r.hora_fin,
        r.lugar_retiro, r.lugar_devolucion,
        r.monto_total_ars, r.tasa_dolar_usada, r.garantia_usd,
        r.sillita, r.metodo_pago, r.origen, r.estado,
        LOWER(COALESCE(r.estado_reserva, 'pendiente')) AS estado_reserva,
        c.modelo, c.patente, c.imagen_url
      FROM reservas r
      LEFT JOIN cars c ON r.auto_id = c.id
      ORDER BY r.id DESC
    `);
    const rows = extraerFilas(raw);
    console.log(`[ventas] GET → ${rows.length} reservas`);
    res.set('Cache-Control', 'no-store');
    return res.json(rows);
  } catch (err) {
    console.error('❌ getAllVentas:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// PATCH|PUT /api/ventas/:id/estado
const updateVentaEstado = async (req, res) => {
  const { id } = req.params;
  const { estado_reserva } = req.body;
  const norm = String(estado_reserva || 'pendiente').toLowerCase();
  // estado=1 → confirmado → aparece en calendario
  const bit = ['confirmada','confirmado','contratado'].includes(norm) ? 1 : 0;
  try {
    await db.query(
      'UPDATE reservas SET estado_reserva = ?, estado = ? WHERE id = ?',
      [norm, bit, id]
    );
    console.log(`[ventas] #${id} → ${norm} (estado=${bit})`);
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ updateVentaEstado:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/ventas/:id
const deleteVenta = async (req, res) => {
  try {
    await db.query('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    console.log(`[ventas] #${req.params.id} eliminada`);
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteVenta:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllVentas, updateVentaEstado, deleteVenta };