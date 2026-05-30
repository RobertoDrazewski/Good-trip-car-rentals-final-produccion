// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');

// Públicas
router.post('/login', ctrl.loginAdmin);

// Privadas
router.get('/profile',        verifyToken, ctrl.getAdminProfile);
router.post('/invite-admin',  verifyToken, ctrl.inviteAdmin);
router.get('/users',          verifyToken, ctrl.listAdmins);
router.delete('/users/:id',   verifyToken, ctrl.deleteAdmin);

module.exports = router;