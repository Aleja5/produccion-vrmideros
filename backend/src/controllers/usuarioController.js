const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { nombre: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const totalResults = await User.countDocuments(query);
        const usuarios = await User.find(query)
            .sort({ nombre: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            usuarios,
            totalPages: Math.ceil(totalResults / limit),
            currentPage: Number(page),
            totalResults: totalResults,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un usuario por ID
const obtenerUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Registrar un nuevo usuario
const Registrar = async (req, res) => {
    // Desestructura los datos del cuerpo de la solicitud
    const { nombre, email, password, role } = req.body;

    try {
        // --- Validaciones de entrada ---
        if (!nombre || !email || !password || !role) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Formato de correo electrónico inválido.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        // Verificar si el correo electrónico ya está registrado
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }        // Crear nuevo usuario con la contraseña sin hashear
        // El middleware pre('save') en el modelo User se encargará de hashear la contraseña
        user = new User({
            nombre,
            email,
            password, // La contraseña se hasheará automáticamente
            role
        });

        await user.save(); // Guarda el nuevo usuario en la base de datos

        // Envía una respuesta de éxito con los datos del usuario (sin la contraseña)
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente', 
            user: {
                _id: user._id,
                nombre: user.nombre,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
    }
};

// @desc    Actualizar un usuario
// @route   PUT /api/usuarios/:id

//Actualizar un usuario
const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    // Desestructura los campos que podrían ser actualizados
    const { nombre, email, password, role } = req.body; 

    try {
        let user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar campos si se proporcionan en la solicitud
        if (nombre !== undefined) user.nombre = nombre;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;        // Manejar actualización de contraseña solo si se proporciona una nueva contraseña
        if (password) { 
            if (password.length < 6) {
                return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
            }
            // Solo asignamos la contraseña, el middleware pre('save') se encarga del hash
            user.password = password;
        }

        await user.save(); // Guarda los cambios del usuario

        // Envía una respuesta con los datos del usuario actualizado (sin la contraseña)
        res.json({
            message: 'Usuario actualizado exitosamente',
            user: {
                _id: user._id,
                nombre: user.nombre,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/usuarios/:id
// @access  Public (o según tu autenticación)

// Eliminar un usuario
const eliminarUsuario = async (req, res) => {
    try {
        const usuario = await User.findByIdAndDelete(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuario,
    Registrar,
    actualizarUsuario,
    eliminarUsuario
};


