const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validar que los campos requeridos estén presentes
    if (!email || !password) {
      return res.status(400).json({ message: 'Correo electrónico y contraseña son obligatorios' });
    }

    // Normalizar el email (eliminar espacios y convertir a minúsculas)
    const emailToSearch = email.toLowerCase().trim();

    // Buscar al usuario en la base de datos
    const user = await User.findOne({ email: emailToSearch });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Responder según el rol
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      redirect: user.role === 'admin' ? '/admin-dashboard' : '/validate-cedula',
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};