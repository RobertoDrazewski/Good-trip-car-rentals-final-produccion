const jwt = require('jsonwebtoken');

// 💡 Sincronizamos la clave secreta exacta que usa tu authController
const JWT_SECRET = process.env.JWT_SECRET || 'good_trip_secret_key_ultra_secure_2026';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Espera formato "Bearer TOKEN"

  if (!token) {
    return res.status(403).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Guardamos los datos del token en el objeto request
    next(); // Habilitamos el paso al controlador
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = verifyToken;