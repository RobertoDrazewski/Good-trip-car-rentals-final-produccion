// server/routes/reservaRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservaController');
const verifyToken = require('../middlewares/authMiddleware');

// ── PÚBLICAS ─────────────────────────────────────────────────────────
router.post('/',         ctrl.createReserva);
router.post('/checkout', ctrl.createReserva);
// Solo fechas+estado para verificar disponibilidad en el formulario web
router.get('/publicas',  ctrl.getReservasPublicas);

// ── PRIVADAS ─────────────────────────────────────────────────────────
router.get('/list',          verifyToken, ctrl.getAllReservas);
router.put('/:id/estado',    verifyToken, ctrl.updateEstadoReserva);
router.patch('/:id/estado',  verifyToken, ctrl.updateEstadoReserva);
router.delete('/:id',        verifyToken, ctrl.deleteReserva);

module.exports = router;