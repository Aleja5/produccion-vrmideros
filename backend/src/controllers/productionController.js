const mongoose = require("mongoose");
const winston = require('winston');
const Produccion = require("../models/Produccion");
const Jornada = require("../models/Jornada");
const verificarYCrearOti = require('../utils/verificarYCrearEntidad');

// Configuración del logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/produccion.log' }),
        new winston.transports.Console()
    ],
});

const Oti = require('../models/Oti');
const Proceso = require('../models/Proceso');
const AreaProduccion = require('../models/AreaProduccion');
const Maquina = require('../models/Maquina');
const Operario = require("../models/Operario")
const Insumos = require('../models/Insumos');

// Convierte { horas, minutos } o número a minutos
function aMinutos(tiempo) {
    if (!tiempo) return 0;
    if (typeof tiempo === "number") return tiempo;
    if (typeof tiempo === "object") {
        return (tiempo.horas || 0) * 60 + (tiempo.minutos || 0);
    }
    return 0;
}

// 📌 FUNCIÓN CORREGIDA: Registrar Producción
exports.registrarProduccion = async (req, res) => {
    try {
        const { operario, fecha, oti, proceso, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin, tiempo, tiempoOperacion, tiempoPreparacion, observaciones } = req.body;

        // Log de datos recibidos
        logger.info('Datos recibidos en registrarProduccion:', req.body);

        // Validar campos requeridos
        if (!operario || !oti || !proceso || !areaProduccion || !maquina || !insumos || !tipoTiempo || !horaInicio || !horaFin || !tiempo) {
            logger.warn('Faltan campos requeridos:', { operario, fecha, oti, proceso, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin, tiempo });
            return res.status(400).json({ msg: 'Faltan campos requeridos' });
        }

        // CORRECCIÓN 1: Usar horaInicio para determinar la fecha si no se proporciona fecha
        const fechaParaJornada = fecha || horaInicio;
        
        // CORRECCIÓN 2: Calcular fecha correctamente respetando zona horaria local
        const fechaLocal = new Date(fechaParaJornada);
        const fechaISO = `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getDate()).padStart(2, '0')}`;
        
        logger.info('Fecha calculada para jornada:', {
            fechaOriginal: fechaParaJornada,
            fechaLocal: fechaLocal.toISOString(),
            fechaISO: fechaISO
        });

        // Buscar o crear la jornada correspondiente
        let jornada = await Jornada.findOne({ 
            operario, 
            fecha: {
                $gte: new Date(fechaISO + 'T00:00:00.000Z'),
                $lt: new Date(fechaISO + 'T23:59:59.999Z')
            }
        });
        
        if (!jornada) {
            logger.info('No se encontró jornada, creando una nueva.');
            jornada = new Jornada({ 
                operario, 
                fecha: new Date(fechaISO + 'T00:00:00.000Z'), 
                registros: [] 
            });
            await jornada.save();
            logger.info('Nueva jornada creada:', jornada);
        } else {
            logger.info('Jornada existente encontrada:', jornada);
        }

        // CORRECCIÓN 3: Verificar y crear OTI de manera más robusta
        let otiId;
        try {
            otiId = await verificarYCrearOti(oti);
            logger.info('OTI verificada/creada:', otiId);
        } catch (error) {
            logger.error('Error al verificar/crear OTI:', error);
            return res.status(400).json({ msg: 'Error al procesar OTI', error: error.message });
        }

        // CORRECCIÓN 4: Validar que todas las referencias existan
        const validaciones = await Promise.all([
            Operario.findById(operario),
            Proceso.findById(proceso),
            AreaProduccion.findById(areaProduccion),
            Maquina.findById(maquina),
            Insumos.findById(insumos)
        ]);

        const [operarioDoc, procesoDoc, areaDoc, maquinaDoc, insumosDoc] = validaciones;

        if (!operarioDoc) {
            logger.error('Operario no encontrado:', operario);
            return res.status(404).json({ msg: 'Operario no encontrado' });
        }
        if (!procesoDoc) {
            logger.error('Proceso no encontrado:', proceso);
            return res.status(404).json({ msg: 'Proceso no encontrado' });
        }
        if (!areaDoc) {
            logger.error('Área de producción no encontrada:', areaProduccion);
            return res.status(404).json({ msg: 'Área de producción no encontrada' });
        }
        if (!maquinaDoc) {
            logger.error('Máquina no encontrada:', maquina);
            return res.status(404).json({ msg: 'Máquina no encontrada' });
        }
        if (!insumosDoc) {
            logger.error('Insumos no encontrados:', insumos);
            return res.status(404).json({ msg: 'Insumos no encontrados' });
        }

        // CORRECCIÓN 5: Validar y convertir fechas de hora correctamente
        const horaInicioDate = new Date(horaInicio);
        const horaFinDate = new Date(horaFin);

        if (isNaN(horaInicioDate.getTime()) || isNaN(horaFinDate.getTime())) {
            logger.error('Fechas de hora inválidas:', { horaInicio, horaFin });
            return res.status(400).json({ msg: 'Fechas de hora inválidas' });
        }

        // Crear el registro de producción
        const nuevaProduccion = new Produccion({
            operario,
            fecha: horaInicioDate, // CORRECCIÓN: Usar horaInicio como fecha del registro
            oti: otiId,
            proceso,
            areaProduccion,
            maquina,
            insumos,
            jornada: jornada._id,
            tipoTiempo,
            horaInicio: horaInicioDate,
            horaFin: horaFinDate,
            tiempo: aMinutos(tiempo),
            tiempoOperacion: aMinutos(tiempoOperacion || 0),
            tiempoPreparacion: aMinutos(tiempoPreparacion || 0),
            observaciones: observaciones || ""
        });

        logger.info('Creando nueva producción:', {
            ...nuevaProduccion.toObject(),
            horaInicio: nuevaProduccion.horaInicio.toISOString(),
            horaFin: nuevaProduccion.horaFin.toISOString()
        });

        const produccionGuardada = await nuevaProduccion.save();
        logger.info('Producción guardada exitosamente:', produccionGuardada._id);

        // Asociar el registro a la jornada
        jornada.registros.push(produccionGuardada._id);
        await jornada.save();
        logger.info('Registro asociado a jornada. Total registros en jornada:', jornada.registros.length);

        // CORRECCIÓN 6: Devolver respuesta más completa
        const produccionCompleta = await Produccion.findById(produccionGuardada._id)
            .populate('oti', 'numeroOti')
            .populate('operario', 'name')
            .populate('proceso', 'nombre')
            .populate('areaProduccion', 'nombre')
            .populate('maquina', 'nombre')
            .populate('insumos', 'nombre');

        logger.info('Producción registrada exitosamente:', {
            id: produccionGuardada._id,
            jornadaId: jornada._id,
            fecha: fechaISO
        });

        res.status(201).json({ 
            msg: 'Producción registrada y vinculada a la jornada exitosamente', 
            produccion: produccionCompleta,
            jornada: {
                id: jornada._id,
                fecha: jornada.fecha,
                totalRegistros: jornada.registros.length
            }
        });

    } catch (error) {
        logger.error('Error completo al registrar producción:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        
        // Devolver error más específico
        let errorMessage = 'Error interno del servidor';
        let statusCode = 500;

        if (error.name === 'ValidationError') {
            errorMessage = 'Error de validación: ' + Object.values(error.errors).map(e => e.message).join(', ');
            statusCode = 400;
        } else if (error.name === 'CastError') {
            errorMessage = 'ID inválido proporcionado';
            statusCode = 400;
        } else if (error.code === 11000) {
            errorMessage = 'Registro duplicado';
            statusCode = 409;
        }

        res.status(statusCode).json({ 
            msg: errorMessage, 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};

// Resto de funciones sin cambios...
exports.getAllProduccion = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;

        page = isNaN(parseInt(page)) ? 1 : parseInt(page);
        limit = isNaN(parseInt(limit)) ? 10 : parseInt(limit);

        const skip = (page - 1) * limit;

        const totalResults = await Produccion.countDocuments({});

        const registros = await Produccion.find()
            .sort({ fecha: -1 })
            .skip(skip)
            .limit(limit)
            .populate("oti", "numeroOti")
            .populate("operario", "name")
            .populate("proceso", "nombre")
            .populate("areaProduccion", "nombre")
            .populate("maquina", "nombre")
            .populate("insumos", "nombre");

        res.json({ totalResults, resultados: registros });
    } catch (error) {
        console.error("error en getAllProduccion:", error);
        res.status(500).json({ message: "Error obteniendo registros", error, totalResults: 0, resultados: [] });
    }
};

exports.obtenerProducciones = async (req, res) => {
    try {
        const { operario } = req.query;

        if (!operario) {
            return res.status(400).json({ msg: "El ID del operario es requerido" });
        }

        if (!mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ msg: "El ID del operario no es válido" });
        }

        const producciones = await Produccion.find({ operario: operario }).populate('operario', 'name');

        if (!producciones.length) {
            return res.status(404).json({ msg: "No se encontraron producciones para este operario" });
        }

        return res.status(200).json(producciones);
    } catch (error) {
        console.error("Error al obtener las producciones:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

exports.listarProduccion = async (req, res) => {
    try {
        const { operario, oti } = req.query;
        console.log("🟢 ID del operario recibido en el backend:", operario);
        
        if (!mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ error: "ID de operario no válido" });
        }

        const query = { operario: new mongoose.Types.ObjectId(operario) };

        if (oti) {
            const otiDoc = await Oti.findOne({ numeroOti: oti });
            if (otiDoc) {
                query.oti = otiDoc._id;
            } else {
                return res.status(404).json({ msg: 'OTI no encontrada' });
            }
        }

        const producciones = await Produccion.find(query)
        .sort({ fecha: -1 })
        .populate({ path: 'oti', select: 'numeroOti' })
        .populate({ path: 'proceso', select: 'nombre' })
        .populate({ path: 'areaProduccion', select: 'nombre' })
        .populate({ path: 'maquina', select: 'nombre' })
        .populate({ path: 'operario', select: 'name' })
        .populate({ path: 'insumos', select: 'nombre' });

        console.log("📊 Producciones enviadas al frontend:", JSON.stringify(producciones, null, 2));

        res.status(200).json(producciones);
        console.log("📌 Buscando producciones para operario:", operario);

    } catch (error) {
        console.error('Error al listar producciones:', error);
        res.status(500).json({ msg: 'Error al listar las producciones', error: error.message });
    }
};

exports.actualizarProduccion = async (req, res) => {
    try {
        console.log("🛠 Datos recibidos en backend para actualización:", req.body);
        const { _id, operario, oti, proceso, areaProduccion, maquina, insumos, fecha, tiempo, horaInicio, horaFin, tipoTiempo} = req.body;

        if (!_id) {
            return res.status(400).json({ msg: 'El ID de la producción es requerido' });
        }

        const produccion = await Produccion.findById(_id);
        if (!produccion) {
            return res.status(404).json({ msg: "Producción no encontrada" });
        }

        if (!operario || !mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ msg: "Operario no válido" });
        }
        const operarioDB = await Operario.findById(operario);
        if (!operarioDB) {
            return res.status(404).json({ msg: "Operario no encontrado" });
        }

        let otiExistente = await Oti.findById(oti);
        if (!otiExistente) {
            console.warn(`⚠️ OTI con ID ${oti} no encontrada. Creando nueva OTI.`);
            otiExistente = new Oti({ _id: oti, numeroOti: "Nueva OTI" });
            await otiExistente.save();
        }

        const procesoExistente = await Proceso.findById(proceso);
        if (!procesoExistente) {
            return res.status(404).json({ msg: "Proceso no encontrado" });
        }

        const areaExistente = await AreaProduccion.findById(areaProduccion);
        if (!areaExistente) {
            return res.status(404).json({ msg: "Área de producción no encontrada" });
        }

        const maquinaExistente = await Maquina.findById(maquina);
        if (!maquinaExistente) {
            return res.status(404).json({ msg: "Máquina no encontrada" });
        }

        const insumosExistente = await Insumos.findById(insumos);
        if (!insumosExistente) {
            return res.status(404).json({ msg: "Insumo no encontrado" });
        }

        const fechaValida = new Date(fecha);
        if (isNaN(fechaValida.getTime())) {
            return res.status(400).json({ msg: "Fecha inválida" });
        }

        const fechaLocal = new Date(fecha);
        fechaLocal.setMinutes(fechaLocal.getMinutes() + fechaLocal.getTimezoneOffset());
        produccion.fecha = fechaLocal;

        produccion.oti = otiExistente._id;
        produccion.operario = operarioDB._id;
        produccion.proceso = procesoExistente._id;
        produccion.areaProduccion = areaExistente._id;
        produccion.maquina = maquinaExistente._id;
        produccion.insumos = insumosExistente._id;
        produccion.tiempoPreparacion = tiempoPreparacion;
        produccion.tiempoOperacion = tiempoOperacion;
        produccion.observaciones = req.body.observaciones || produccion.observaciones;

        const produccionActualizada = await produccion.save();
        console.log("✅ Producción actualizada en BD:", produccionActualizada);

        res.status(200).json({
            msg: "Producción actualizada exitosamente",
            produccion: produccionActualizada
        });

    } catch (error) {
        console.error("❌ Error al actualizar producción:", error);
        res.status(500).json({ msg: "Error al actualizar la producción", error: error.message });
    }
};

exports.eliminarProduccion = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: 'ID de producción no válido' });
        }

        const registroEliminado = await Produccion.findByIdAndDelete(id);

        if (!registroEliminado) {
            return res.status(404).json({ msg: 'Registro de producción no encontrado' });
        }

        res.json({ msg: 'Registro de producción eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar producción:', error);
        res.status(500).json({ msg: 'Error al eliminar producción', error: error.message });
    }
};

exports.buscarProduccion = async (req, res) => {
    try {
        const { oti, operario, fechaInicio, fechaFin, proceso, areaProduccion, maquina, insumos, page = 1, limit = 10 } = req.query;
        const query = {};
        const skip = (parseInt(page) - 1) * parseInt(limit);

        console.log("📥 Filtros recibidos en el backend:", req.query);

        if (oti && oti.trim() !== '') {
            query.oti = oti;
        }

        if (operario && operario.trim() !== '') {
            query.operario = operario;
        }

        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            inicio.setHours(0, 0, 0, 0);

            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);

            query.fecha = {
                $gte: inicio,
                $lte: fin,
            };
        }

        if (proceso && proceso.trim() !== '') {
            query.proceso = proceso;
        }

        if (areaProduccion && areaProduccion.trim() !== '') {
            query.areaProduccion = areaProduccion;
        }

        if (maquina && maquina.trim() !== '') {
            query.maquina = maquina;
        }

        if (insumos && insumos.trim() !== '') {
            query.insumos = insumos;
        }

        console.log("🔍 Query final construida para la búsqueda:", query);

        const totalResultados = await Produccion.countDocuments(query);
        console.log("📊 Total de resultados encontrados:", totalResultados);

        const producciones = await Produccion.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('oti', 'numeroOti')
            .populate('operario', 'name')
            .populate('proceso', 'nombre')
            .populate('areaProduccion', 'nombre')
            .populate('maquina', 'nombre')
            .populate('insumos', 'nombre');

        res.status(200).json({ totalResultados, resultados: producciones });
    } catch (error) {
        console.error('❌ Error al buscar producciones:', error);
        res.status(500).json({ msg: 'Error interno del servidor', error: error.message });
    }
};

exports.buscarPorFechas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ msg: "Faltan parámetros requeridos: fechaInicio y fechaFin" });
        }

        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);

        if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
            return res.status(400).json({ msg: "Fechas inválidas" });
        }

        const producciones = await Produccion.find({
            fecha: {
                $gte: inicio,
                $lte: fin,
            },
        })
            .populate("oti", "numeroOti")
            .populate("operario", "name")
            .populate("proceso", "nombre")
            .populate("areaProduccion", "nombre")
            .populate("maquina", "nombre")
            .populate("insumos", "nombre");

        res.status(200).json(producciones);
    } catch (error) {
        console.error("Error al buscar por fechas:", error);
        res.status(500).json({ msg: "Error al buscar registros" });
    }
};