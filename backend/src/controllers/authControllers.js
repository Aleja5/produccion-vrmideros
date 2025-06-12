const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Asegúrate de que tu modelo de usuario esté definido aquí
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
        console.log('Email recibido:', email);
        console.log('Email procesado:', emailToSearch);

        // AHORA buscamos el usuario en la base de datos
        const user = await User.findOne({ email: emailToSearch });
        console.log('Usuario encontrado:', user);

        // Si el usuario no existe, devolvemos un error
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        // --- Inicio de la depuración de bcrypt.compare ---
        console.log('Depurando strings para bcrypt.compare:');
        console.log(`Password ingresado (longitud ${password.length}): "${password}"`);
        console.log(`Password almacenado (hash, longitud ${user.password.length}): "${user.password}"`);

        const isMatch = await user.comparePassword(password);
        // --- Fin de la depuración de bcrypt.compare ---

        // Si las contraseñas no coinciden, devolvemos un error
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Si llega aquí, es que isMatch es true
        // Crear el token JWT para la sesión
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Token generado:', token);

        // Envía la respuesta JSON con el token y los datos del usuario
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
        // En caso de cualquier otro error en el proceso de login
        console.error('Error en el servidor (login):', error);
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
        }

        const user = await User.findOne({ email });
        console.log('Usuario encontrado para recuperación:', user);
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        // Generar token y hash para almacenar en DB
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log('Token de recuperación generado:', resetToken);
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await user.save();

        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        console.log('Enlace de recuperación:', resetLink);

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

        console.log('Intentando enviar correo con:');
        console.log('FROM:', process.env.EMAIL_USER);
        console.log('TO:', email);
        console.log('Subject:', mailOptions.subject);
        console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'undefined');

        await transporter.sendMail(mailOptions);

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

        console.log('Token recibido:', token);
        console.log('Nueva contraseña recibida:', newPassword);

        // Validar que el token y la nueva contraseña existan
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token y nueva contraseña son obligatorios' });
        }

        // Hashear el token recibido para buscarlo en la base de datos
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        console.log('Token hasheado:', hashedToken);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }, // Verificar si el token no ha expirado
        });
        console.log('Usuario encontrado para restablecer contraseña:', user);

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }        // Actualizar la contraseña y dejar que el middleware pre('save') la hashee
        user.password = newPassword; // El middleware pre('save') se encargará del hasheo
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Guardar los cambios y permitir que el middleware pre('save') hashee la contraseña
        await user.save();

        // Verificar que la contraseña se pueda comparar correctamente
        const isMatch = await bcrypt.compare(newPassword, user.password);
        console.log('Verificación post-reseteo:', {
            contraseñaIngresada: newPassword,
            contraseñaHasheada: user.password,
            coinciden: isMatch
        });

        res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ message: 'Error del servidor al restablecer la contraseña' });
    }
};
// No es necesario un module.exports al final si usas "exports.nombreFuncion"
// para cada función individualmente. Esto evita el ReferenceError.