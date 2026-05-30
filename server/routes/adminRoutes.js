// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// ✨ CORRECCIÓN: Apuntamos al controlador unificado real de tu proyecto
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');

// =================================================================
// 🔓 RUTAS PÚBLICAS (Accesibles desde el formulario de Login)
// =================================================================

// Endpoint: POST /api/auth/login -> Conectado nativamente con Login.jsx
router.post('/login', authController.loginAdmin);


// =================================================================
// 🔐 RUTAS PRIVADAS / PROTEGIDAS (Requieren Token JWT válido)
// =================================================================

// Endpoint: GET /api/auth/profile -> Para validar la sesión del administrador
// ✨ CORRECCIÓN: Usamos 'authController' en lugar del inexistente 'adminController'
router.get('/profile', verifyToken, authController.getAdminProfile);

module.exports = router;