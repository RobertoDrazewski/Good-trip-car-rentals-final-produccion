const db = require('../config/db.config'); // Ajustá la ruta según tu estructura
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Clave secreta para JWT (En producción, llevala a tu archivo .env)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

/**
 * Registro de un nuevo Administrador
 */
const registerAdmin = async (req, res) => {
  const { nombre, username, email, password, rol } = req.body;

  // Validación básica
  if (!nombre || !username || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    // 1. Verificar si el usuario o email ya existen
    const { rows: existingUser } = await db.query(
      'SELECT id FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El username o el email ya están registrados.' });
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insertar en la base de datos de Railway
    await db.query(
      'INSERT INTO admins (nombre, username, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, username, email, passwordHash, rol || 'admin']
    );

    res.status(201).json({ message: 'Administrador registrado con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al registrar admin.', error: error.message });
  }
};

/**
 * Login de Administrador
 */
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username y contraseña son requeridos.' });
  }

  try {
    // 1. Buscar al admin por su username
    const { rows } = await db.query(
      'SELECT * FROM admins WHERE username = ? LIMIT 1',
      [username]
    );
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ message: 'Credenciales inválidas (Usuario no encontrado).' });
    }

    // 2. Comparar la contraseña ingresada con el hash de la BD
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas (Contraseña incorrecta).' });
    }

    // 3. Generar el Token JWT (Vence en 4 horas)
    const token = jwt.sign(
      { id: admin.id, username: admin.username, rol: admin.rol },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    // 4. Responder al cliente con los datos del perfil y su token
    res.json({
      message: 'Login exitoso.',
      token,
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        username: admin.username,
        rol: admin.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión.', error: error.message });
  }
};

/**
 * Obtener el perfil del administrador logueado (Ruta Protegida de prueba)
 */
const getAdminProfile = async (req, res) => {
  try {
    // req.user va a venir cargado desde el middleware de autenticación que hagas después
    const { rows } = await db.query(
      'SELECT id, nombre, username, email, rol, created_at FROM admins WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Administrador no encontrado.' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil.', error: error.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile
};