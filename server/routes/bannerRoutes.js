// server/routes/bannerRoutes.js
const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const verifyToken = require('../middlewares/authMiddleware');

// Rutas Públicas (Para el carrusel del Home de Clientes)
router.get('/all-active', bannerController.getAllActivePromos);
router.get('/active', bannerController.getActiveBannerLegacy);

// Rutas Privadas / Protegidas (Para tu panel de control de Admin con IA)
router.post('/generar-propuesta', verifyToken, bannerController.generarPropuesta);
router.post('/save-promo', verifyToken, bannerController.savePromo);
router.get('/all', verifyToken, bannerController.getAllBanners);
router.delete('/:id', verifyToken, bannerController.deleteBanner);

module.exports = router;