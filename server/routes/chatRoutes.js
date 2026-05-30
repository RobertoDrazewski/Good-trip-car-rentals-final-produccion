// server/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Ruta Pública: Para que los clientes interactúen con el asesor comercial virtual
router.post('/mensaje', chatController.procesarMensajeChat);

module.exports = router;