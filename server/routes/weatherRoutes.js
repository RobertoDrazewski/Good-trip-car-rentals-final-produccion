const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Ruta Pública: Obtener el clima adaptado de Mendoza
router.get('/mendoza', weatherController.getMendozaWeather);

module.exports = router;