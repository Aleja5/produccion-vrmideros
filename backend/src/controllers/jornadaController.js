const mongoose = require('mongoose');
const Produccion = require('../models/Produccion');
const Jornada = require('../models/Jornada');
const Operario = require('../models/Operario');
const { recalcularTiempoTotal } = require('../utils/recalcularTiempo');
const { recalcularHorasJornada } = require('../utils/recalcularHoras');

exports.crearJornada = async (req, res) => {
    try {
        const { operario, fecha, actividades = [] } = req.body;

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
        const nuevaJornada = new Jornada({ 
            operario, 
            fecha: new Date(fecha + 'T00:00:00.000Z'), 
            registros: [],
            totalTiempoActividades: { horas: 0, minutos: 0 }
        });

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
        const { limit, sort } = req.query;
        let query = Jornada.find();

        if (sort) {
            const sortParams = {};
            const parts = sort.split(':');
            sortParams[parts[0]] = parts[1] === 'desc' ? -1 : 1;
            query = query.sort(sortParams);
        } else {
            // Default sort if not provided
            query = query.sort({ fecha: -1 });
        }

        if (limit) {
            query = query.limit(parseInt(limit, 10));
        }

        // Popular el campo operario de la Jornada
        query = query.populate('operario', 'name');

        const jornadas = await query.
        populate({
            path: 'registros',
            populate: [
                { path: 'operario', select: 'name' },
                { path: 'oti', select: 'numeroOti' },
                { path: 'procesos', model: 'Proceso', select: 'nombre' }, // Ensured model is specified for clarity
                { path: 'areaProduccion', select: 'nombre' },
                { path: 'maquina', select: 'nombre' },
                { path: 'insumos', model: 'Insumo', select: 'nombre' } // Ensured model is specified for clarity
            ],
            
        });
        
        const jornadasConTiempo = jornadas.map(jornada => {
            return {
                ...jornada.toObject(),
                totalTiempoActividades: jornada.totalTiempoActividades || { horas: 0, minutos: 0 }
            };
        });

        res.status(200).json(jornadasConTiempo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching Jornadas' });
    }
};

// ontener una jornada por ID
exports.obtenerJornada = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`Invalid Jornada ID: ${id}`);
            return res.status(400).json({ error: 'Jornada ID is invalid' });
        }
        // Asegurarse de que todos los campos relacionados se populen correctamente
        const jornada = await Jornada.findById(id)
            .populate('operario', 'name') // <--- Añadir esta línea para popular el operario
            .populate({
            path: 'registros',
            populate: [
                { path: 'oti', model: 'Oti', select: 'numeroOti' },
                { path: 'procesos', model: 'Proceso', select: 'nombre' }, // Corrected path and ensured model
                { path: 'areaProduccion', model: 'AreaProduccion', select: 'nombre' },
                { path: 'maquina', model: 'Maquina', select: 'nombre' },
                { path: 'insumos', model: 'Insumo', select: 'nombre' } // Ensured model
            ]
        });

        if (!jornada) {
            console.error(`Jornada not found for ID: ${id}`);
            return res.status(404).json({ error: 'Jornada not found' });
        }

        res.status(200).json(jornada);

    } catch (error) {
        console.error(`Error fetching Jornada with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Error fetching Jornada' });
    }
};

// obtener jornadas por operario
exports.obtenerJornadasPorOperario = async (req, res) => {
    const { id } = req.params; // Operario ID
    const { fecha } = req.query; // Optional date filter

    try {
        console.log(`🔎 Buscando jornadas para el operario con ID: ${id}`);

        // Verificar si el operario existe
        const operarioExiste = await Operario.findById(id);
        if (!operarioExiste) {
            console.error(`❌ Operario con ID ${id} no encontrado`);
            return res.status(404).json({ msg: 'Operario no encontrado' });
        }
        console.log(`✅ Operario encontrado:`, operarioExiste);

        let queryConditions = { operario: id };

        if (fecha) {
            console.log(`📅 Filtrando por fecha: ${fecha}`);
            const fechaInicio = new Date(fecha);
            fechaInicio.setUTCHours(0, 0, 0, 0);

            const fechaFin = new Date(fecha);
            fechaFin.setUTCHours(23, 59, 59, 999);
            
            queryConditions.fecha = { $gte: fechaInicio, $lte: fechaFin };
        }
        
        // Obtener las jornadas y popular los registros directamente
        const jornadas = await Jornada.find(queryConditions)
            .sort({ fecha: -1 })
            .populate({
                path: 'registros',
                populate: [
                    { path: 'procesos', model: 'Proceso', select: 'nombre' }, // Corrected path and ensured model
                    { path: 'oti', select: 'numeroOti' },
                    { path: 'areaProduccion', select: 'nombre' },
                    { path: 'maquina', select: 'nombre' },
                    { path: 'insumos', model: 'Insumo', select: 'nombre' } // Ensured model
                ]
            });

        if (!jornadas) {
            console.log(`ℹ️ No se encontraron jornadas para el operario ${id} con los filtros aplicados.`);
            return res.json([]); // Devuelve un array vacío si no hay jornadas
        }

        console.log(`✅ Jornadas encontradas para ${operarioExiste.name}: ${jornadas.length}`);
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
        const { horaInicio, horaFin, registros, estado } = req.body;
        
        // Validar ID de la jornada
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Jornada ID is invalid' });
        }
        
        const updateFields = { };
        if (horaInicio !== undefined) updateFields.horaInicio = horaInicio;
        if (horaFin !== undefined) updateFields.horaFin = horaFin;
        if (registros !== undefined) updateFields.registros = registros;
        if (estado !== undefined) updateFields.estado = estado;

        const jornada = await Jornada.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }

        // Recalcular las horas de la jornada después de la actualización
        await recalcularHorasJornada(id);
        // Recalcular el tiempo total de actividades
        await recalcularTiempoTotal(id);

        res.status(200).json(await Jornada.findById(id).populate('registros'));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating Jornada' });
    }
};

// eliminar una jornada
exports.eliminarJornada = async (req, res) => {
    try {
        const { id } = req.params;
        const jornada = await Jornada.findByIdAndDelete(id);
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }
        res.status(200).json({ message: 'Jornada deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting Jornada' });
    }
};

exports.agregarActividadAJornada = async (req, res) => {
    try {
        const { jornadaId } = req.params;
        const { operario, fecha, oti, proceso, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin, tiempo, observaciones } = req.body;

        // Validar que el ID de la jornada sea válido
        if (!mongoose.Types.ObjectId.isValid(jornadaId)) {
            return res.status(400).json({ error: 'Jornada ID is invalid' });
        }

        // Buscar la jornada
        const jornada = await Jornada.findById(jornadaId).populate('registros');
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }

        // Validar los campos de la actividad
        const camposRequeridos = { operario, fecha, oti, proceso, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin };
        for (const [clave, valor] of Object.entries(camposRequeridos)) {
            if (!valor) return res.status(400).json({ error: `Falta el campo: ${clave}` });
}
        if (proceso && !mongoose.Types.ObjectId.isValid(proceso)) return res.status(400).json({ error: 'Proceso ID is invalid' });
        if (areaProduccion && !mongoose.Types.ObjectId.isValid(areaProduccion)) return res.status(400).json({ error: 'Area ID is invalid' });
        if (maquina && !mongoose.Types.ObjectId.isValid(maquina)) return res.status(400).json({ error: 'Maquina ID is invalid' });
        if (insumos && !mongoose.Types.ObjectId.isValid(insumos)) return res.status(400).json({ error: 'Insumos ID is invalid' });

        // Crear un nuevo registro de producción para la actividad
        const nuevoRegistro = new Produccion({
            operario,
            fecha: new Date(fecha + 'T00:00:00.000Z'),
            oti,
            proceso,
            areaProduccion,
            maquina,
            insumos,
            tipoTiempo,
            horaInicio,
            horaFin,
            tiempo,
            observaciones: observaciones || null,
            jornada: jornadaId
        });
        await nuevoRegistro.save();

        // Agregar el nuevo registro a la jornada
        jornada.registros.push(nuevoRegistro._id);
        await jornada.save();

        // Recalcular la hora de inicio y fin de la jornada
        await recalcularHorasJornada(jornadaId);
        // Recalcular el tiempo total de actividades
        await recalcularTiempoTotal(jornadaId);

        // Asegurar la correcta populación antes de enviar la respuesta
        const jornadaActualizada = await Jornada.findById(jornadaId).populate({
            path: 'registros',
            populate: [
                { path: 'procesos', model: 'Proceso', select: 'nombre' },
                { path: 'oti', select: 'numeroOti' },
                { path: 'areaProduccion', select: 'nombre' },
                { path: 'maquina', select: 'nombre' },
                { path: 'insumos', model: 'Insumo', select: 'nombre' }
            ]
        });

        res.status(200).json({ msg: 'Actividad agregada con éxito', jornada: jornadaActualizada });
              
    } catch (error) {
        console.error('Error al agregar actividad a la jornada:', error);
        res.status(500).json({ error: 'Hubo un error al agregar la actividad a la jornada' });
    }
};

