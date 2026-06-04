// server/controllers/reservaController.js
const db = require('../config/db.config');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const extraerFilas = (r) => {
  if (!r) return [];
  if (r.rows) return Array.isArray(r.rows) ? r.rows : [];
  if (Array.isArray(r) && Array.isArray(r[0])) return r[0];
  if (Array.isArray(r)) return r;
  return [];
};

// ── Calcula días (regla del cliente con medios días) ───────────────────────
//   24h = 1 día · resto ≤3:30 → +0 · resto 4:00–7:30 → +0,5 · resto ≥8:00 → +1
const calcularDias = (fIni, hIni, fFin, hFin) => {
  const ini = new Date(`${String(fIni).split('T')[0]}T${hIni||'10:00'}:00`);
  const fin = new Date(`${String(fFin).split('T')[0]}T${hFin||'10:00'}:00`);
  const diffH = Math.max(0, Math.round((fin - ini) / 3_600_000 * 2) / 2);
  const full  = Math.floor(diffH / 24);
  const resto = diffH - full * 24;
  let extra = 0;
  if (resto >= 8)       extra = 1;
  else if (resto > 3.5) extra = 0.5;
  return Math.max(1, full + extra);
};

/**
 * 1. CREAR RESERVA — guarda en BD y envía email
 */
const createReserva = async (req, res) => {
  const {
    auto_id, cliente_nombre, cliente_whatsapp,
    fecha_inicio, hora_inicio, fecha_fin, hora_fin,
    lugar_retiro, lugar_devolucion, sillita,
    metodo_pago, origen, provincia,
    monto_total_ars, tasa_dolar_usada, garantia_usd
  } = req.body;

  try {
    // Buscar tarifa real en precios_mensuales
    const fIni = new Date(`${String(fecha_inicio).split('T')[0]}T${hora_inicio||'10:00'}:00`);
    const mes  = fIni.getMonth() + 1;
    const anio = fIni.getFullYear();
    const dias = calcularDias(fecha_inicio, hora_inicio, fecha_fin, hora_fin);

    // Mínimo de alquiler: 3 días
    if (dias < 3) {
      return res.status(400).json({ error: 'El alquiler mínimo es de 3 días.' });
    }

    const rawT = await db.query(
      'SELECT * FROM precios_mensuales WHERE auto_id = ? AND mes = ? AND anio = ?',
      [parseInt(auto_id,10)||0, mes, anio]
    );
    const t = extraerFilas(rawT)[0] || {};

    // Valores reales desde BD, con fallback
    const precioDia   = parseFloat(t.precio_auto_mensual_ars || 45000);
    const precSillita = parseFloat(t.precio_sillita          || 5000);
    const precLavado  = parseFloat(t.precio_lavado           || 18000);
    const cRetiro     = parseFloat(t.cargo_retiro_aeropuerto || 16000);
    const cDevol      = parseFloat(t.cargo_devolucion_aeropuerto || 16000);
    const sqlTasa     = parseFloat(tasa_dolar_usada || t.cotizacion_dolar || 1450);
    const sqlGarantia = parseFloat(garantia_usd     || t.garantia_usd    || 400);

    // Recalcular monto si el front lo mandó mal / NaN
    let sqlMonto = parseFloat(monto_total_ars);
    if (!sqlMonto || isNaN(sqlMonto) || sqlMonto <= 0) {
      const rentaBase = precioDia * dias;
      const costoSil  = (sillita ? 1 : 0) * precSillita;
      const costoRet  = String(lugar_retiro||'').toLowerCase().includes('aeropuerto')    ? cRetiro : 0;
      const costoDevl = String(lugar_devolucion||'').toLowerCase().includes('aeropuerto') ? cDevol  : 0;
      const subtotal  = rentaBase + costoSil + costoRet + costoDevl + precLavado;
      // Descuento por promoción (si el front lo informó)
      const descPromo = parseFloat(req.body.descuento_promo || 0);
      const subtotalNeto = subtotal * (1 - descPromo/100);
      // Recargos por cuotas desde el panel (tarifa del mes); fallback 8/16/32
      const recT1     = parseFloat(t.recargo_tarjeta_1 ?? 8);
      const recT3     = parseFloat(t.recargo_tarjeta_3 ?? 16);
      const recT6     = parseFloat(t.recargo_tarjeta_6 ?? 32);
      const factor    = metodo_pago === 'tarjeta_1' ? 1 + recT1/100
                      : metodo_pago === 'tarjeta_3' ? 1 + recT3/100
                      : metodo_pago === 'tarjeta_6' ? 1 + recT6/100 : 1;
      sqlMonto = subtotalNeto * factor;
    }
    sqlMonto = Math.round(sqlMonto);

    // Obtener modelo y patente para el email
    const carRows = extraerFilas(await db.query('SELECT modelo, patente FROM cars WHERE id = ?', [parseInt(auto_id,10)||0]));
    const car = carRows[0] || {};

    // Guardar en BD
    await db.query(`
      INSERT INTO reservas
        (auto_id, cliente_nombre, cliente_whatsapp, fecha_inicio, hora_inicio,
         fecha_fin, hora_fin, lugar_retiro, lugar_devolucion, monto_total_ars,
         tasa_dolar_usada, garantia_usd, sillita, estado_reserva, metodo_pago, origen, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, 0)
    `, [
      parseInt(auto_id,10)||null, cliente_nombre||'Anónimo', cliente_whatsapp||'',
      fecha_inicio, hora_inicio||'10:00:00',
      fecha_fin,   hora_fin||'10:00:00',
      lugar_retiro||'Mendoza (Microcentro)', lugar_devolucion||'Mendoza (Microcentro)',
      sqlMonto, sqlTasa, sqlGarantia,
      sillita ? 1 : 0,
      metodo_pago||'efectivo', origen||'Argentina'
    ]);

    // Email a goodtripmendoza@gmail.com
    try {
      await resend.emails.send({
        from: 'Good Trip <onboarding@resend.dev>',
        to:   'goodtripmendoza@gmail.com',
        subject: `🚀 NUEVA RESERVA: ${cliente_nombre} — ${String(fecha_inicio).substring(0,10)}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
            <h2 style="color:#0ea5e9;margin-bottom:4px">¡Nueva Reserva Web! 🚗</h2>
            <p style="color:#64748b;font-size:13px;margin-top:0">Ingresada desde el cotizador de Good Trip.</p>
            <hr style="border:none;border-top:1px solid #cbd5e1;margin:16px 0"/>
            <p><strong>👤 Cliente:</strong> ${cliente_nombre}</p>
            <p><strong>📱 WhatsApp:</strong> ${cliente_whatsapp}${String(cliente_whatsapp||'').replace(/\D/g,'').startsWith('261') ? ' 🔴 <strong>MENDOZA LOCAL</strong>' : ''}</p>
            <p><strong>🌍 Origen:</strong> ${origen||'Argentina'}${provincia ? ` · ${provincia}` : ''}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
            <p><strong>🚗 Vehículo:</strong> ${car.modelo||'Auto'} | Patente: ${car.patente||'S/D'}</p>
            <p><strong>📅 Retiro:</strong> ${String(fecha_inicio).substring(0,10)} a las ${hora_inicio||'10:00'} hs — ${lugar_retiro}</p>
            <p><strong>📅 Devolución:</strong> ${String(fecha_fin).substring(0,10)} a las ${hora_fin||'10:00'} hs — ${lugar_devolucion}</p>
            <p><strong>📆 Días:</strong> ${dias}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
            <p><strong>👶 Sillita:</strong> ${sillita ? 'Sí' : 'No'}</p>
            <p><strong>💳 Pago:</strong> ${String(metodo_pago||'efectivo').replace(/_/g,' ').toUpperCase()}</p>
            <p><strong>💰 Monto Total:</strong> <span style="font-size:18px;font-weight:bold;color:#0ea5e9">$${sqlMonto.toLocaleString('es-AR')} ARS</span></p>
            <p><strong>🛡️ Garantía:</strong> USD ${sqlGarantia} (a $${sqlTasa} ARS/USD)</p>
            <p style="margin-top:24px;font-size:11px;color:#94a3b8">Accedé al Dashboard para confirmar o gestionar esta reserva.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn('⚠️ Email no enviado (la reserva igual se guardó):', mailErr.message);
    }

    return res.json({ success: true, monto_final: sqlMonto });
  } catch (err) {
    console.error('❌ ERROR createReserva:', err);
    return res.status(500).json({ error: 'Error interno al guardar la reserva.' });
  }
};

/**
 * 2. LISTAR TODAS LAS RESERVAS (Dashboard — con JOIN a cars)
 */
const getAllReservas = async (req, res) => {
  try {
    const raw = await db.query(`
      SELECT r.*, c.modelo, c.patente, c.imagen_url
      FROM reservas r
      LEFT JOIN cars c ON r.auto_id = c.id
      ORDER BY r.id DESC
    `);
    return res.json(extraerFilas(raw));
  } catch (err) {
    console.error('❌ getAllReservas:', err.message);
    return res.status(500).json({ error: 'Error al leer reservas.' });
  }
};

/**
 * 3. LISTAR RESERVAS PÚBLICAS (solo fechas + estado para verificar disponibilidad en Home)
 */
const getReservasPublicas = async (req, res) => {
  try {
    const raw = await db.query(`
      SELECT id, auto_id, fecha_inicio, fecha_fin, estado_reserva
      FROM reservas
      WHERE estado_reserva IN ('confirmada','confirmado','contratado')
      ORDER BY fecha_inicio DESC
    `);
    return res.json(extraerFilas(raw));
  } catch (err) {
    return res.status(500).json({ error: 'Error.' });
  }
};

/**
 * 4. CAMBIAR ESTADO
 */
const updateEstadoReserva = async (req, res) => {
  const { id } = req.params;
  const { estado_reserva } = req.body;
  try {
    // Al confirmar también marcamos estado=1 para el calendario
    const estado = ['confirmada','confirmado','contratado'].includes(String(estado_reserva||'').toLowerCase()) ? 1 : 0;
    await db.query(
      'UPDATE reservas SET estado_reserva = ?, estado = ? WHERE id = ?',
      [estado_reserva, estado, id]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar estado.' });
  }
};

/**
 * 5. ELIMINAR RESERVA
 */
const deleteReserva = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM reservas WHERE id = ?', [id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar.' });
  }
};

module.exports = { createReserva, getAllReservas, getReservasPublicas, updateEstadoReserva, deleteReserva };