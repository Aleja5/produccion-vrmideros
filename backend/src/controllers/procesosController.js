const Proceso = require('../models/Proceso');

// Obtener todos los procesos
const obtenerProcesos = async (req, res) => {
    const { page = 1, limit = 10, nombre, search, areaId } = req.query; // Added areaId
    const query = {};

    if (nombre && search) {
        query.$or = [
            { nombre: { $regex: nombre, $options: 'i' } },
            { nombre: { $regex: search, $options: 'i' } }
        ];
    } else if (nombre) {
        query.nombre = { $regex: nombre, $options: 'i' };
    } else if (search) {
        query.nombre = { $regex: search, $options: 'i' };
    }

    if (areaId) { // Filter by areaId if provided
        query.areaId = areaId;
    }

    try {
        const totalResults = await Proceso.countDocuments(query);
        const procesos = await Proceso.find(query)
            .populate('areaId') // Optionally populate area details
            .sort({ nombre: 1 }) // Default sort by nombre ascending (A-Z)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            procesos,
            totalPages: Math.ceil(totalResults / limit),
            currentPage: Number(page),
            totalResults: totalResults,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un proceso por ID
const obtenerProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id);
        if (!proceso) {
            return res.status(404).json({ message: 'Proceso no encontrado' });
        }
        res.json(proceso);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear un nuevo proceso
const crearProceso = async (req, res) => {
    const { nombre, areaId } = req.body; // Added areaId
    // Ensure areaId is provided if it's required by your logic/model (currently not strictly required in model)
    if (!areaId) {
        // return res.status(400).json({ message: 'El campo areaId es requerido.' }); // Uncomment if areaId becomes strictly required
    }
    const nuevoProceso = new Proceso({ nombre, areaId }); // Added areaId
    try {
        const procesoGuardado = await nuevoProceso.save();
        console.log('Proceso guardado:', procesoGuardado);
        res.status(201).json(procesoGuardado);
    } catch (error) {
        console.error('Error al guardar proceso:', error);
        res.status(400).json({ message: error.message });
    }
};

// Actualizar un proceso
const actualizarProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!proceso) {
            return res.status(404).json({ message: 'Proceso no encontrado' });
        }
        res.json(proceso); 
        } catch (error) {
        res.status(500).json({ message: error.message });
        }
    };

// Eliminar un proceso
const eliminarProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findByIdAndDelete(req.params.id);
        if (!proceso) {
            return res.status(404).json({ message: 'Proceso no encontrado' });
        }
        res.json({ message: 'Proceso eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Exportar las funciones
module.exports = {
    obtenerProcesos,
    obtenerProceso,
    crearProceso,
    actualizarProceso,
    eliminarProceso,
};

