// backend/controllers/jornadaController.js

const mongoose = require('mongoose');
const Produccion = require('../models/Produccion');
const Jornada = require('../models/Jornada');
const Operario = require('../models/Operario');
const { recalcularTiempoTotal } = require('../utils/recalcularTiempo');
const { recalcularHorasJornada } = require('../utils/recalcularHoras');

exports.crearJornada = async (req, res) => {
    try {
        const { operario, fecha } = req.body;

        if (!mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ error: 'ID de operario inválido' });
        }

        const fechaNormalizada = new Date(fecha);
        fechaNormalizada.setUTCHours(0, 0, 0, 0);

        const jornadaExistente = await Jornada.findOne({ operario: operario, fecha: fechaNormalizada });

        if (jornadaExistente) {
            return res.status(400).json({ error: 'Ya existe una jornada para este operario en la fecha actual', jornadaId: jornadaExistente._id });
        }

        const nuevaJornada = new Jornada({
            operario,
            fecha: new Date(fecha + 'T00:00:00.000Z'),
            registros: [],
            totalTiempoActividades: { horas: 0, minutos: 0 }
        });

        await nuevaJornada.save();

        res.status(201).json({ msg: 'Jornada creada con éxito', jornadaId: nuevaJornada._id, jornada: nuevaJornada });

    } catch (error) {
        console.error('Error al crear la jornada:', error);
        res.status(500).json({ error: 'Hubo un error al crear la jornada' });
    }
};

// @desc    Obtener todas las Jornadas
// @route   GET /api/jornadas
// @access  Public (o según tu autenticación)
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
        console.error('Error fetching Jornadas:', error);
        res.status(500).json({ error: 'Error al obtener jornadas' });
    }
};

// @desc    Obtener una jornada por ID
// @route   GET /api/jornadas/:id
// @access  Public (o según tu autenticación)
exports.obtenerJornada = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar el ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`ID de Jornada inválido: ${id}`);
            return res.status(400).json({ error: 'ID de jornada inválido' });
        }
        // Asegurarse de que todos los campos relacionados se populen correctamente
        const jornada = await Jornada.findById(id).populate({
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
            console.error(`Jornada no encontrada para ID: ${id}`);
            return res.status(404).json({ error: 'Jornada no encontrada' });
        }

        res.status(200).json(jornada);

    } catch (error) {
        console.error(`Error al obtener la Jornada con ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Error al obtener la Jornada' });
    }
};

// @desc    Obtener jornadas por operario
// @route   GET /api/jornadas/operario/:id
// @access  Public (o según tu autenticación)
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
        console.log(`✅ Operario encontrado:`, operarioExiste.name);

        // Obtener las jornadas sin populate por ahora
        const jornadas = await Jornada.find({ operario: id }).sort({ fecha: -1 });

        // Si no hay jornadas, devolver un array vacío inmediatamente
        if (!jornadas || jornadas.length === 0) { // Añadimos .length === 0 para claridad
            console.log(`ℹ️ No se encontraron jornadas para el operario ${id} con los filtros aplicados.`);
            return res.json([]); // Devuelve un array vacío si no hay jornadas
        }

        // Recalcular tiempo y hacer populate completo para cada jornada
        const jornadasConTiempo = await Promise.all(jornadas.map(async (jornada) => {
            const populatedJornada = await Jornada.findById(jornada._id).populate({
                path: 'registros',
                populate: [
                    { path: 'procesos', model: 'Proceso', select: 'nombre' },
                    { path: 'oti', select: 'numeroOti' },
                    { path: 'areaProduccion', select: 'nombre' },
                    { path: 'maquina', select: 'nombre' },
                    { path: 'insumos', model: 'Insumo', select: 'nombre' }
                ]
            });
            return populatedJornada; // Asegúrate de retornar la jornada populada aquí
        })); // <--- Cierre correcto del map y Promise.all


        console.log(`✅ Jornadas encontradas para ${operarioExiste.name}: ${jornadasConTiempo.length}`); // Usar jornadasConTiempo
        res.json(jornadasConTiempo); // Asegúrate de enviar jornadasConTiempo, no 'jornadas'

    } catch (error) {
        console.error(`🚨 Error al obtener las jornadas del operario ${id}:`, error);
        res.status(500).json({ msg: 'Error al obtener las jornadas' });
    }
};
        
    

       

// @desc    Obtener jornadas por operario y fecha
// @route   GET /api/jornadas/operario/:operarioId/fecha/:fecha
// @access  Public (o según tu autenticación)
exports.obtenerJornadasPorOperarioYFecha = async (req, res) => {
    try {
        const { operarioId, fecha } = req.params;
        console.log(`🔎 Buscando jornadas para el operario con ID: ${operarioId} y fecha: ${fecha}`);

        // Opcional: Verificar si el operario existe (solo para logs, no es estrictamente necesario para la query)
        const operario = await Operario.findById(operarioId);
        if (operario) {
            console.log(`✅ Operario encontrado: ${operario.name}`);
        } else {
            console.log(`⚠️ Operario no encontrado con ID: ${operarioId}`);
        }

        const targetDate = new Date(fecha);
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const jornadas = await Jornada.find({
            operario: operarioId,
            fecha: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        console.log(`✅ Jornadas encontradas para ${operario ? operario.name : 'ID ' + operarioId}: ${jornadas.length}`);

        if (jornadas.length === 0) {
            return res.status(404).json({ message: "No se encontraron jornadas para este operario en esta fecha." });
        }
        res.status(200).json(jornadas);
    } catch (error) {
        console.error("Error al buscar jornada por operario y fecha:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID de operario o formato de fecha inválido." });
        }
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


// @desc    Actualizar una jornada (general, incluyendo horas de inicio/fin y registros)
// @route   PUT /api/jornadas/:id
// @access  Public (o según tu autenticación)
exports.actualizarJornada = async (req, res) => {
    try {
        const { id } = req.params;
        const { horaInicio, horaFin, registros } = req.body;

        // Validar ID de la jornada
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de jornada inválido' });
        }

        const jornada = await Jornada.findByIdAndUpdate(
            id,
            { horaInicio, horaFin, registros },
            { new: true, runValidators: true }
        );

        if (!jornada) {
            return res.status(404).json({ error: 'Jornada no encontrada' });
        }

        // Recalcular las horas y el tiempo total de la jornada después de la actualización
        await recalcularHorasJornada(id);
        // Recalcular el tiempo total de actividades
        await recalcularTiempoTotal(id);

        res.status(200).json(await Jornada.findById(id).populate('registros'));

    } catch (error) {
        console.error('Error al actualizar Jornada:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: error.message, errors: error.errors });
        }
        res.status(500).json({ error: 'Error al actualizar Jornada' });
    }
};

// @desc    Eliminar una jornada
// @route   DELETE /api/jornadas/:id
// @access  Public (o según tu autenticación)
exports.eliminarJornada = async (req, res) => {
    try {
        const { id } = req.params;

        const jornada = await Jornada.findByIdAndDelete(id);
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada no encontrada' });
        }
        res.status(200).json({ message: 'Jornada eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar Jornada:', error);
        res.status(500).json({ error: 'Error al eliminar Jornada' });
    }
};

exports.agregarActividadAJornada = async (req, res) => {
    try {
        const { jornadaId } = req.params;
        const {
            operario,
            fecha, // Asegúrate de que esta 'fecha' es la fecha de la actividad, no la de la jornada
            oti,
            proceso,
            areaProduccion,
            maquina,
            insumos,
            tipoTiempo,
            horaInicio,
            horaFin,
            tiempo,
            observaciones
        } = req.body;

        // Validar que el ID de la jornada sea válido
        if (!mongoose.Types.ObjectId.isValid(jornadaId)) {
            return res.status(400).json({ error: 'ID de jornada inválido' });
        }

        // Buscar la jornada
        const jornada = await Jornada.findById(jornadaId);
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada no encontrada' });
        }

        // Normalizar la fecha de la actividad si es diferente a la de la jornada
        const fechaActividadNormalizada = new Date(fecha);
        fechaActividadNormalizada.setUTCHours(0, 0, 0, 0);


        // Validar los campos de la actividad
        const camposRequeridos = { operario, oti, proceso, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin };
        for (const [clave, valor] of Object.entries(camposRequeridos)) {
            if (!valor) return res.status(400).json({ error: `Falta el campo: ${clave}` });
        }
        if (proceso && !mongoose.Types.ObjectId.isValid(proceso)) return res.status(400).json({ error: 'Proceso ID is invalid' });
        if (areaProduccion && !mongoose.Types.ObjectId.isValid(areaProduccion)) return res.status(400).json({ error: 'Area ID is invalid' });
        if (maquina && !mongoose.Types.ObjectId.isValid(maquina)) return res.status(400).json({ error: 'Maquina ID is invalid' });
        if (insumos && !mongoose.Types.ObjectId.isValid(insumos)) return res.status(400).json({ error: 'Insumos ID is invalid' });


        // Crear un nuevo registro de producción (actividad individual)
        const nuevoRegistro = new Produccion({
            operario,
            fecha: fechaActividadNormalizada, // Usar la fecha de la actividad o la de la jornada si son iguales
            oti,
            proceso,
            areaProduccion,
            maquina,
            insumos,
            tipoTiempo,
            horaInicio,
            horaFin,
            tiempo: tiempo || 0,
            observaciones: observaciones || null,
            jornada: jornadaId
        });
        await nuevoRegistro.save();

        // Agregar el _id del nuevo registro a la jornada
        jornada.registros.push(nuevoRegistro._id);
        await jornada.save();

       

        res.status(200).json({ msg: 'Actividad agregada con éxito', jornada: await Jornada.findById(jornadaId).populate('registros') });

    } catch (error) {
        console.error('Error al agregar actividad a la jornada:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: error.message, errors: error.errors });
        }
        res.status(500).json({ error: 'Hubo un error al agregar la actividad a la jornada' });
    }
};

// @desc    Guardar Jornada Completa (maneja creación y adición de actividades en un solo POST)
// @route   POST /api/jornadas/completa (RUTA QUE USAS PARA "GUARDAR JORNADA COMPLETA")
// @access  Public (o según tu autenticación)
exports.guardarJornadaCompleta = async (req, res) => {
    try {
        const { operario, fecha, horaInicio, horaFin, actividades } = req.body;

        // Validar ObjectId para operario
        if (!mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ error: 'ID de operario inválido' });
        }

        // Normalizar la fecha de la jornada
        const fechaNormalizada = new Date(fecha);
        fechaNormalizada.setUTCHours(0, 0, 0, 0);

        let jornada = await Jornada.findOne({ operario: operario, fecha: fechaNormalizada });

        if (!jornada) {
            // Crear nueva jornada si no existe
            jornada = new Jornada({
                operario,
                fecha: fechaNormalizada,
                horaInicio: horaInicio,
                horaFin: horaFin,
                registros: [],
                totalTiempoActividades: 0
            });
        } else {
            // Actualizar horas de jornada existente si se proporcionan
            jornada.horaInicio = horaInicio || jornada.horaInicio;
            jornada.horaFin = horaFin || jornada.horaFin;
        }

        // Procesar y agregar actividades
        const idsNuevosRegistros = [];
        if (Array.isArray(actividades) && actividades.length > 0) {
            for (const actividad of actividades) {
                // Validar los campos de cada actividad individualmente
                if (!actividad.oti || !actividad.proceso || !actividad.areaProduccion || !actividad.maquina || !actividad.insumos || !actividad.tipoTiempo || !actividad.horaInicio || !actividad.horaFin) {
                    return res.status(400).json({ error: `Faltan campos requeridos para una actividad: ${JSON.stringify(actividad)}` });
                }
                if (!mongoose.Types.ObjectId.isValid(actividad.oti)) return res.status(400).json({ error: 'ID de OTI inválido en actividad' });
                if (!mongoose.Types.ObjectId.isValid(actividad.proceso)) return res.status(400).json({ error: 'ID de Proceso inválido en actividad' });
                if (!mongoose.Types.ObjectId.isValid(actividad.areaProduccion)) return res.status(400).json({ error: 'ID de Área de Producción inválido en actividad' });
                if (!mongoose.Types.ObjectId.isValid(actividad.maquina)) return res.status(400).json({ error: 'ID de Máquina inválido en actividad' });
                if (!mongoose.Types.ObjectId.isValid(actividad.insumos)) return res.status(400).json({ error: 'ID de Insumo inválido en actividad' });


                // Crear y guardar cada registro de producción
                const nuevoRegistro = new Produccion({
                    operario: jornada.operario,
                    fecha: jornada.fecha, // La fecha de la actividad será la de la jornada
                    oti: actividad.oti,
                    proceso: actividad.proceso,
                    areaProduccion: actividad.areaProduccion,
                    maquina: actividad.maquina,
                    insumos: actividad.insumos,
                    tipoTiempo: actividad.tipoTiempo,
                    horaInicio: actividad.horaInicio,
                    horaFin: actividad.horaFin,
                    tiempo: actividad.tiempo || 0,
                    observaciones: actividad.observaciones || null,
                    jornada: jornada._id
                });
                await nuevoRegistro.save();
                idsNuevosRegistros.push(nuevoRegistro._id);
            }
        }

        // Añadir las IDs de los nuevos registros a la jornada
        jornada.registros = [...new Set([...jornada.registros.map(r => r.toString()), ...idsNuevosRegistros.map(id => id.toString())])];
        jornada.registros = jornada.registros.map(id => new mongoose.Types.ObjectId(id));

        await jornada.save();

        // Recalcular horas y tiempo total de la jornada después de agregar todas las actividades
        await recalcularHorasJornada(jornada._id);

        const jornadaFinal = await Jornada.findById(jornada._id).populate('operario', 'name cedula').populate({
            path: 'registros',
            populate: [
                { path: 'oti', select: 'numeroOti' },
                { path: 'proceso', select: 'nombre' },
                { path: 'areaProduccion', select: 'nombre' },
                { path: 'maquina', select: 'nombre' },
                { path: 'insumos', select: 'nombre' }
            ]
        });

        res.status(201).json({ msg: 'Jornada y actividades guardadas con éxito', jornada: jornadaFinal });

    } catch (error) {
        console.error('Error al guardar la jornada completa:', error);
        if (error.name === 'ValidationError') {
            const errors = {};
            for (let field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ msg: 'Error de validación', errors });
        }
        res.status(500).json({ error: 'Hubo un error al guardar la jornada completa' });
    }
};

// ** ESTA ES LA FUNCIÓN QUE DEBE ESTAR EN EL BLOQUE PRINCIPAL exports **
// @desc    Obtener jornadas por operario y fecha
// @route   GET /api/jornadas/operario/:operarioId/fecha/:fecha
// @access  Public (o según tu autenticación)
exports.obtenerJornadasPorOperarioYFecha = async (req, res) => {
    try {
        const { operarioId, fecha } = req.params;
        console.log(`🔎 Buscando jornadas para el operario con ID: ${operarioId} y fecha: ${fecha}`);

        // Opcional: Verificar si el operario existe (solo para logs, no es estrictamente necesario para la query)
        const operario = await Operario.findById(operarioId);
        if (operario) {
            console.log(`✅ Operario encontrado: ${operario.name}`);
        } else {
            console.log(`⚠️ Operario no encontrado con ID: ${operarioId}`);
        }

        // Convertir la fecha a un objeto Date y buscar por operario y fecha exacta
        const targetDate = new Date(fecha);
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC

        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999); // Fin del día en UTC

        const jornadas = await Jornada.find({
            operario: operarioId,
            fecha: {
                $gte: startOfDay, // Mayor o igual que el inicio del día
                $lte: endOfDay    // Menor o igual que el fin del día
            }
        });

        console.log(`✅ Jornadas encontradas para ${operario ? operario.name : 'ID ' + operarioId}: ${jornadas.length}`);

        if (jornadas.length === 0) {
            return res.status(404).json({ message: "No se encontraron jornadas para este operario en esta fecha." });
        }
        res.status(200).json(jornadas); // Devolver array de jornadas
    } catch (error) {
        console.error("Error al buscar jornada por operario y fecha:", error);
        // Manejo de CastError para ObjectId inválidos
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID de operario o formato de fecha inválido." });
        }
        res.status(500).json({ message: "Error interno del servidor." });
    };
    
};