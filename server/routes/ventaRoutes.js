// server/routes/ventaRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ventaController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/',              verifyToken, ctrl.getAllVentas);
router.patch('/:id/estado',  verifyToken, ctrl.updateVentaEstado);
router.put('/:id/estado',    verifyToken, ctrl.updateVentaEstado);
router.delete('/:id',        verifyToken, ctrl.deleteVenta);

module.exports = router;