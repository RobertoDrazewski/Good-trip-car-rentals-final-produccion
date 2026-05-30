const express = require('express');
const router = express.Router();
const multer = require('multer');
const carController = require('../controllers/carController');
const verifyToken = require('../middlewares/authMiddleware');

// Configuración de Multer para recibir binarios en la memoria RAM
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rutas Públicas (Catálogo del Front)
router.get('/', carController.getAllCars);
router.get('/:id', carController.getCarById);

// Rutas Privadas (Panel de Administración con subida de imágenes)
router.post('/', verifyToken, upload.single('imagen'), carController.createCar); // Intercepta el campo 'imagen'
router.put('/:id', verifyToken, upload.single('imagen'), carController.updateCar); // Soporta actualizar foto
router.delete('/:id', verifyToken, carController.deleteCar);

module.exports = router;