const mongoose = require('mongoose');
const Produccion = require('../models/Produccion');
const Jornada = require('../models/Jornada');
const Operario = require('../models/Operario');


exports.crearJornada = async (req, res) => {
    try {
        const { operario, fecha, horaInicio, horaFin, actividades = [], observacionesJornada = "" } = req.body;

        // Validar ObjectId para operario
        if (!mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ error: 'Operario ID is invalid' });
        }

        // Verificar si ya existe una jornada para este operario en esta fecha
        const jornadaExistente = await Jornada.findOne({ operario: operario, fecha: new Date(fecha).toISOString().split('T')[0] });

        if (jornadaExistente) {
            return res.status(400).json({ error: 'Ya existe una jornada para este operario en la fecha actual', jornadaId: jornadaExistente._id });
        }

        // Si no existe, crear una nueva jornada con 'registros' inicializado como array vacío
        const nuevaJornada = new Jornada({ operario, horaInicio, horaFin, fecha, observacionesJornada, registros: [] });
        await nuevaJornada.save();

        res.json({ msg: 'Jornada creada con éxito', jornadaId: nuevaJornada._id });

    } catch (error) {
        console.error(error);
        res.status(500).send('Hubo un error al crear la jornada');
    }
};
// obtener todas las Jornadas
exports.obtenerJornadas = async (req, res) => {
    try {
        const jornadas = await Jornada.find().populate('actividades');
        res.status(200).json(jornadas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching Jornadas' });
    }
};

// ontener una jornada por ID
exports.obtenerJornada = async (req, res) => {
    try {
        const { id } = req.params;
        const jornada = await Jornada.findById(id).populate('actividades');
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }
        res.status(200).json(jornada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching Jornada' });
    }
};

// obtener jornadas por operario
exports.obtenerJornadasPorOperario = async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`🔎 Buscando jornadas para el operario con ID: ${id}`);

        // Verificar si el operario existe
        const operarioExiste = await Operario.findById(id);
        if (!operarioExiste) {
            logger.error(`❌ Operario con ID ${id} no encontrado`);
            return res.status(404).json({ msg: 'Operario no encontrado' });
        }
        console.log(`✅ Operario encontrado:`, operarioExiste);

        // Buscar las jornadas del operario y popular los registros (actividades)
        const jornadas = await Jornada.find({ operario: id }).populate({
            path: 'registros',
            populate: {
                path: 'proceso areaProduccion maquina insumos oti', // Popular los detalles de cada registro
                model: 'Produccion' // Asegúrate de que el modelo sea 'Produccion'
            }
        }).sort({ fecha: -1 }); // Ordenar por fecha descendente (la más reciente primero)

        console.log(`✅ Jornadas encontradas para el operario ${operarioExiste.name}: ${jornadas.length}`);
        res.json(jornadas);

    } catch (error) {
        console.error(`🚨 Error al obtener las jornadas del operario ${id}:`, error);
        res.status(500).json({ msg: 'Error al obtener las jornadas' });
    }
};

// actualizar una jornada
exports.actualizarJornada = async (req, res) => {
    try {
        const { id } = req.params;
        const { horaInicio, horaFin, actividades } = req.body;
        const jornada = await Jornada.findByIdAndUpdate(
            id,
            { horaInicio, horaFin, actividades },
            { new: true }
        );
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }
        res.status(200).json(jornada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating Jornada' });
    }
};

// eliminar una jornada
exports.eliminarJornada = async (req, res) => {
    try {
        const { id } = req.params;
        const jornada = await JornadaProduccion.findByIdAndDelete(id);
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }
        res.status(200).json({ message: 'Jornada deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting Jornada' });
    }
};

exports.registrarJornadaConActividades = async (req, res) => {
    try {
        const { operario, fecha, horaInicio, horaFin, actividades, observacionesJornada } = req.body;

        // Validate and convert ObjectId for operario
        if (!mongoose.Types.ObjectId.isValid(operario)) {
            console.error(`Invalid Operario ID: ${operario}`);
            return res.status(400).json({ error: 'Operario ID is invalid' });
        }
        const operarioId = mongoose.Types.ObjectId(operario);

        // Validate and convert ObjectId for each actividad
        for (const actividad of actividades) {
            console.log('Validating actividad:', actividad); // Log actividad for debugging

            if (actividad.proceso) {
                if (!mongoose.Types.ObjectId.isValid(actividad.proceso)) {
                    console.error(`Invalid Proceso ID for actividad ${actividad.oti}: ${actividad.proceso}`);
                    return res.status(400).json({ error: `Proceso ID is invalid for actividad: ${actividad.oti}` });
                }
                actividad.proceso = mongoose.Types.ObjectId(actividad.proceso);
            }

            if (actividad.area) {
                if (!mongoose.Types.ObjectId.isValid(actividad.area)) {
                    console.error(`Invalid Area ID for actividad ${actividad.oti}: ${actividad.area}`);
                    return res.status(400).json({ error: `Area ID is invalid for actividad: ${actividad.oti}` });
                }
                actividad.area = mongoose.Types.ObjectId(actividad.area);
            }

            if (actividad.maquina) {
                if (!mongoose.Types.ObjectId.isValid(actividad.maquina)) {
                    console.error(`Invalid Maquina ID for actividad ${actividad.oti}: ${actividad.maquina}`);
                    return res.status(400).json({ error: `Maquina ID is invalid for actividad: ${actividad.oti}` });
                }
                actividad.maquina = mongoose.Types.ObjectId(actividad.maquina);
            }

            if (actividad.insumos) {
                if (!mongoose.Types.ObjectId.isValid(actividad.insumos)) {
                    console.error(`Invalid Insumos ID for actividad ${actividad.oti}: ${actividad.insumos}`);
                    return res.status(400).json({ error: `Insumos ID is invalid for actividad: ${actividad.oti}` });
                }
                actividad.insumos = mongoose.Types.ObjectId(actividad.insumos);
            }
        }

        const jornada = new Jornada({ operario: operarioId, horaInicio, horaFin, actividades, fecha, observacionesJornada });
        await jornada.save();

        let totalTiempoPreparacion = 0;
        let totalTiempoOperacion = 0;
        const registrosProduccionIds = [];

        // Crear los registros de producción asociados a la jornada
        for (const actividad of actividades) {
            const nuevoRegistro = new Produccion({
                operario: operarioId,
                fecha,
                oti: actividad.oti,
                area: actividad.area,
                proceso: actividad.proceso,
                maquina: actividad.maquina,
                insumos: actividad.insumos,
                tiempoPreparacion: actividad.tiempoPreparacion || 0,
                tiempoOperacion: actividad.tiempoOperacion || 0,
                observaciones: actividad.observaciones,
                jornada: jornada._id // Asocia el registro a la jornada
            });
            await nuevoRegistro.save();
            registrosProduccionIds.push(nuevoRegistro._id);
            totalTiempoPreparacion += actividad.tiempoPreparacion || 0;
            totalTiempoOperacion += actividad.tiempoOperacion || 0;
        }

        // Actualizar la jornada con los IDs de los registros y los totales de tiempo
        jornada.registros = registrosProduccionIds;
        jornada.totalTiempoPreparacion = totalTiempoPreparacion;
        jornada.totalTiempoOperacion = totalTiempoOperacion;
        await jornada.save();

        res.json({ msg: 'Jornada creada con éxito', jornadaId: jornada._id });

    } catch (error) {
        console.error('Error in registrarJornadaConActividades:', error);
        res.status(500).send('Hubo un error al registrar la jornada con actividades');
    }
};

exports.agregarActividadAJornada = async (req, res) => {
    try {
        const { jornadaId } = req.params;
        const { actividad } = req.body;

        // Validar que el ID de la jornada sea válido
        if (!mongoose.Types.ObjectId.isValid(jornadaId)) {
            return res.status(400).json({ error: 'Jornada ID is invalid' });
        }

        // Validar que los campos de la actividad sean válidos
        if (actividad.proceso && !mongoose.Types.ObjectId.isValid(actividad.proceso)) {
            return res.status(400).json({ error: 'Proceso ID is invalid' });
        }
        if (actividad.area && !mongoose.Types.ObjectId.isValid(actividad.area)) {
            return res.status(400).json({ error: 'Area ID is invalid' });
        }
        if (actividad.maquina && !mongoose.Types.ObjectId.isValid(actividad.maquina)) {
            return res.status(400).json({ error: 'Maquina ID is invalid' });
        }

        // Buscar la jornada
        const jornada = await Jornada.findById(jornadaId);
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }

        // Agregar la nueva actividad a la jornada
        jornada.actividades.push(actividad);
        await jornada.save();

        res.status(200).json({ msg: 'Actividad agregada con éxito', jornada });
    } catch (error) {
        console.error('Error al agregar actividad a la jornada:', error);
        res.status(500).json({ error: 'Hubo un error al agregar la actividad a la jornada' });
    }
};

