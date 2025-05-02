const express = require('express');
const { 
    login,
    forgotPassword,
    resetPassword,
} = require('../controllers/authControllers');

const router = express.Router();

// Ruta de login
router.post('/login', login);

// Ruta para enviar el correo de recuperacion
router.post('/forgot-password', forgotPassword);

// Ruta para restablecer la contraseña
router.post('/reset-password', resetPassword);

module.exports = router;