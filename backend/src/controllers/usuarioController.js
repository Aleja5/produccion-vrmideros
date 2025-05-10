const User = require('../models/User');

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




//Actualizar un usuario
const actualizarUsuario = async (req, res) => {
    try {
        const usuario = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuario);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

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
    actualizarUsuario,
    eliminarUsuario
};


