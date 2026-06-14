// server/controllers/authController.js
const db = require('../config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { sendMail } = require('../utils/mailer');
const JWT_SECRET = process.env.JWT_SECRET || 'good_trip_secret_key_ultra_secure_2026';

const extraerFilas = (r) => {
  if (!r) return [];
  if (r.rows) return Array.isArray(r.rows) ? r.rows : [];
  if (Array.isArray(r) && Array.isArray(r[0])) return r[0];
  if (Array.isArray(r)) return r;
  return [];
};

/**
 * 1. LOGIN — acepta username O email + password
 */
const loginAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = (username || email || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  try {
    // Buscar por username o email en tabla admins
    const rows = extraerFilas(await db.query(
      'SELECT * FROM admins WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1',
      [identifier, identifier]
    ));

    // Fallback: credenciales de .env para el admin raíz
    if (rows.length === 0) {
      const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL    || 'admin@goodtrip.com').toLowerCase();
      const ADMIN_PASSWORD =  process.env.ADMIN_PASSWORD || 'GoodTrip2026!';
      const ADMIN_USER     = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();

      if (identifier !== ADMIN_EMAIL && identifier !== ADMIN_USER) {
        return res.status(401).json({ error: 'Usuario no encontrado.' });
      }
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Contraseña incorrecta.' });
      }

      const token = jwt.sign({ role:'admin', email:ADMIN_EMAIL, username:ADMIN_USER }, JWT_SECRET, { expiresIn:'24h' });
      console.log(`🔐 Admin raíz autenticado: ${identifier}`);
      return res.json({ success:true, token, username: ADMIN_USER });
    }

    const admin = rows[0];

    // Verificar contraseña con bcrypt
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    const token = jwt.sign(
      { id:admin.id, role:'admin', email:admin.email, username:admin.username },
      JWT_SECRET, { expiresIn:'24h' }
    );

    console.log(`🔐 Admin autenticado: ${admin.username}`);
    return res.json({ success:true, token, username:admin.username });

  } catch (err) {
    console.error('❌ loginAdmin:', err.message);
    return res.status(500).json({ error: 'Error interno al autenticar.' });
  }
};

/**
 * 2. INVITAR NUEVO ADMIN — crea en BD y envía email con credenciales
 */
const inviteAdmin = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Nombre y email son requeridos.' });

  const emailLower = email.trim().toLowerCase();

  try {
    // Verificar que no exista
    const existe = extraerFilas(await db.query(
      'SELECT id FROM admins WHERE LOWER(email) = ?', [emailLower]
    ));
    if (existe.length > 0) return res.status(400).json({ error: 'Ya existe un admin con ese email.' });

    // Generar username desde el nombre (ej: "Carlos Mendoza" → "carlos.mendoza")
    const username = name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');

    // Generar contraseña temporal segura
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!';
    const hash = await bcrypt.hash(tempPassword, 10);

    // Insertar en BD
    await db.query(
      `INSERT INTO admins (nombre, username, email, password_hash, rol)
       VALUES (?, ?, ?, ?, 'admin')`,
      [name.trim(), username, emailLower, hash]
    );

    // Enviar email con credenciales
    try {
      await sendMail({
        to: 'Goodtripmendoza@gmail.com',
        subject: `👤 NUEVO ADMIN CREADO: ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
            <h2 style="color:#0ea5e9">Nuevo Administrador Creado 🎉</h2>
            <p>Se creó una nueva cuenta de acceso al panel de Good Trip:</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
            <p><strong>👤 Nombre:</strong> ${name}</p>
            <p><strong>📧 Email:</strong> ${emailLower}</p>
            <p><strong>🔑 Usuario:</strong> ${username}</p>
            <p><strong>🔐 Contraseña temporal:</strong> <code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:16px;font-weight:bold">${tempPassword}</code></p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
            <p style="color:#64748b;font-size:12px">Compartí estas credenciales con el nuevo operador. Se recomienda cambiar la contraseña después del primer ingreso.</p>
            <p style="color:#64748b;font-size:12px">Panel: <a href="https://goodtripmendoza.com/login">goodtripmendoza.com/login</a></p>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn('⚠️ Email no enviado (admin igual creado):', mailErr.message);
    }

    console.log(`✅ Admin creado: ${username} (${emailLower})`);
    return res.json({ success:true, username, message:'Admin creado y credenciales enviadas.' });

  } catch (err) {
    console.error('❌ inviteAdmin:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 3. LISTAR ADMINS
 */
const listAdmins = async (req, res) => {
  try {
    const rows = extraerFilas(await db.query(
      'SELECT id, nombre, username, email, rol, created_at FROM admins ORDER BY id DESC'
    ));
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 4. ELIMINAR ADMIN
 */
const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM admins WHERE id = ?', [id]);
    console.log(`🗑️ Admin #${id} eliminado`);
    return res.json({ success:true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * 5. PERFIL
 */
const getAdminProfile = async (req, res) => {
  return res.json({ success:true, admin: { email: req.user.email, username: req.user.username, role: req.user.role } });
};

module.exports = { loginAdmin, inviteAdmin, listAdmins, deleteAdmin, getAdminProfile };