const express = require('express');
const router = express.Router();
const requisitoController = require('../controllers/requisitoController');
const verifyToken = require('../middlewares/authMiddleware');

// Ruta Pública: Para mostrar en el Home o sección informativa del Front de clientes
router.get('/', requisitoController.getAllRequisitos);

// Rutas Privadas: Exclusivas del panel de control del Administrador
router.post('/', verifyToken, requisitoController.createRequisito);
router.put('/:id', verifyToken, requisitoController.updateRequisito);
router.delete('/:id', verifyToken, requisitoController.deleteRequisito);

module.exports = router;