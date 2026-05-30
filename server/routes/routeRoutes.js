// server/routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const routeController = require('../controllers/routeController');
const verifyToken = require('../middlewares/authMiddleware');

// Configuración de almacenamiento volátil (RAM transitoria para Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de seguridad: 10MB por imagen
});

// =================================================================
// 🧭 RUTAS PÚBLICAS (Sincronizadas con el Home y Mapa de Clientes)
// =================================================================

// ✨ COMPATIBILIDAD DOBLE: Responde con éxito tanto en /api/routes como en /api/routes/all
router.get('/', routeController.getAllRoutes);
router.get('/all', routeController.getAllRoutes);

// =================================================================
// 🔐 RUTAS PRIVADAS / PROTEGIDAS (Panel de Control de la Guía Turística)
// =================================================================

// Asistente de IA para optimizar descripciones de Mendoza
router.post('/ai-desc', verifyToken, routeController.mejorarDescripcionAI);

// Guardar/Crear nueva ruta subiendo archivo a Cloudinary
router.post('/save', verifyToken, upload.single('imagen'), routeController.saveRoute); 

// Dar de baja/Eliminar un circuito turístico
router.delete('/:id', verifyToken, routeController.deleteRoute);

module.exports = router;