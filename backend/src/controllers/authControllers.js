const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { safeLog } = require('../utils/logger');
require('dotenv').config();

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Correo electrónico y contraseña son obligatorios' });
        }

    const emailToSearch = email.toLowerCase().trim();
    
    // Solo log de desarrollo
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Intento de login para:', emailToSearch);
    }
    
    const user = await User.findOne({ email: emailToSearch });

    if (!user) {
      console.warn(`⚠️ Intento de login fallido: usuario no encontrado - ${emailToSearch}`);
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Comparar la contraseña recibida con la almacenada en la base de datos
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.warn(`⚠️ Intento de login fallido: credenciales inválidas - ${emailToSearch}`);
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }    // Crear el token JWT para la sesión
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    console.log(`✅ Login exitoso: ${user.email} (${user.role})`);
    
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      redirect: user.role === 'admin' ? '/admin-home' : '/validate-cedula',
    });
  } catch (error) {
    console.error('❌ Error en el servidor (login):', error.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Correo electrónico inválido' });
    }    const user = await User.findOne({ email });
    
    if (!user) {
      console.warn(`⚠️ Intento de recuperación: usuario no encontrado - ${email}`);
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Generar token y hash para almacenar en DB
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperación de contraseña',
            html: `
                <p>Hola,</p>
                <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>Si no solicitaste este correo, puedes ignorarlo.</p>
            `,
        };

    if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Enviando correo de recuperación a:', email);
    }

    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Correo de recuperación enviado a: ${email}`);

        res.status(200).json({
            message: 'Correo de recuperación de contraseña enviado.',
        });
    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validar que el token y la nueva contraseña existan
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Hashear el token recibido para buscarlo en la base de datos
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Verificar si el token no ha expirado
    });

    if (!user) {
      console.warn('⚠️ Intento de reset con token inválido o expirado');
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Solo asignar la nueva contraseña, el middleware pre('save') se encarga del hash
    user.password = newPassword;

    // Limpiar los campos de token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });
    
    console.log(`✅ Contraseña restablecida exitosamente para: ${user.email}`);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('❌ Error en resetPassword:', error.message);
    res.status(500).json({ message: 'Error del servidor al restablecer la contraseña' });
  }
};
// No es necesario un module.exports al final si usas "exports.nombreFuncion"
// para cada función individualmente. Esto evita el ReferenceError.