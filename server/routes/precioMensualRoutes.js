
const express = require('express');
const router = express.Router();
const precioMensualController = require('../controllers/precioMensualController');
const verifyToken = require('../middlewares/authMiddleware');
 
// Ruta pública
router.get('/', precioMensualController.getAllPreciosMensuales);
 
// Rutas protegidas — IMPORTANTE: la ruta específica '/global' debe ir ANTES que '/'
router.patch('/global', verifyToken, precioMensualController.updateGlobalTarifas);
router.post('/', verifyToken, precioMensualController.saveOrUpdatePreciosMensuales);
 
module.exports = router;
 