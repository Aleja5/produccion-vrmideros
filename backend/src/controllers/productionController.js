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


// Obtener todos los registros de producción
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

// 📌 Registrar Producción
exports.registrarProduccion = async (req, res) => {
    try {
        const { operario, fecha, oti, proceso, areaProduccion, maquina, insumos, horaInicioPreparacion, horaFinPreparacion, horaInicioOperacion, horaFinOperacion, observaciones } = req.body;

        // Log de datos recibidos
        logger.info('Datos recibidos en registrarProduccion:', req.body);

        // Validar campos requeridos
        if (!operario || !fecha || !oti || !proceso || !areaProduccion || !maquina || !insumos) {
            logger.warn('Faltan campos requeridos:', { operario, fecha, oti, proceso, areaProduccion, maquina, insumos });
            return res.status(400).json({ msg: 'Faltan campos requeridos' });
        }

        // Buscar o crear la jornada correspondiente
        const fechaISO = new Date(fecha).toISOString().split('T')[0];
        logger.info('Fecha ISO calculada:', fechaISO);

        let jornada = await Jornada.findOne({ operario, fecha: fechaISO });
        if (!jornada) {
            logger.info('No se encontró jornada, creando una nueva.');
            jornada = new Jornada({ operario, fecha: fechaISO, registros: [] });
            await jornada.save();
        }

        logger.info('Jornada creada o encontrada:', jornada);

        // Calcular tiempos de preparación y operación
        let tiempoPreparacion = 0;
        let tiempoOperacion = 0;

        if (horaInicioPreparacion && horaFinPreparacion) {
            const inicioPreparacion = new Date(`1970-01-01T${horaInicioPreparacion}:00`);
            const finPreparacion = new Date(`1970-01-01T${horaFinPreparacion}:00`);

            if (finPreparacion > inicioPreparacion) {
                tiempoPreparacion = Math.floor((finPreparacion - inicioPreparacion) / 60000); // Convertir a minutos
            } else {
                logger.warn('Hora de fin de preparación menor que hora de inicio:', { horaInicioPreparacion, horaFinPreparacion });
                return res.status(400).json({ msg: 'La hora de fin de preparación debe ser mayor que la hora de inicio' });
            }
        }

        if (horaInicioOperacion && horaFinOperacion) {
            const inicioOperacion = new Date(`1970-01-01T${horaInicioOperacion}:00`);
            const finOperacion = new Date(`1970-01-01T${horaFinOperacion}:00`);

            if (finOperacion > inicioOperacion) {
                tiempoOperacion = Math.floor((finOperacion - inicioOperacion) / 60000); // Convertir a minutos
            } else {
                logger.warn('Hora de fin de operación menor que hora de inicio:', { horaInicioOperacion, horaFinOperacion });
                return res.status(400).json({ msg: 'La hora de fin de operación debe ser mayor que la hora de inicio' });
            }
        }

        const otiId = await verificarYCrearOti(oti);


        // Asignar el ObjectId de OTI al registro de producción
        const nuevaProduccion = new Produccion({
            operario,
            fecha,
            oti: otiId,
            proceso,
            areaProduccion,
            maquina,
            insumos,
            jornada: jornada._id,
            tiempoPreparacion,
            tiempoOperacion,
            observaciones
        });

        logger.info('Creando nueva producción:', nuevaProduccion);
        const produccionGuardada = await nuevaProduccion.save();

        // Asociar el registro a la jornada
        jornada.registros.push(produccionGuardada._id);
        await jornada.save();

        logger.info('Producción registrada y vinculada a la jornada:', produccionGuardada);
        res.status(201).json({ msg: 'Producción registrada y vinculada a la jornada', produccion: produccionGuardada });
    } catch (error) {
        logger.error('Error al registrar producción:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
};

// 📌 Obtener Producciones por Operario
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

// 📌 Listar Producción con detalles para operario
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

// 📌 Actualizar Producción
exports.actualizarProduccion = async (req, res) => {
    try {
        console.log("🛠 Datos recibidos en backend para actualización:", req.body);
        const { _id, operario, oti, proceso, areaProduccion, maquina, insumos, fecha, tiempoPreparacion, tiempoOperacion } = req.body;

        // Validar que el ID de la producción esté presente
        if (!_id) {
            return res.status(400).json({ msg: 'El ID de la producción es requerido' });
        }

        // Buscar la producción existente
        const produccion = await Produccion.findById(_id);
        if (!produccion) {
            return res.status(404).json({ msg: "Producción no encontrada" });
        }

        // Validar Operario
        if (!operario || !mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ msg: "Operario no válido" });
        }
        const operarioDB = await Operario.findById(operario);
        if (!operarioDB) {
            return res.status(404).json({ msg: "Operario no encontrado" });
        }

        // Validar y/o buscar OTI
        let otiExistente = await Oti.findById(oti);
        if (!otiExistente) {
            console.warn(`⚠️ OTI con ID ${oti} no encontrada. Creando nueva OTI.`);
            otiExistente = new Oti({ _id: oti, numeroOti: "Nueva OTI" });
            await otiExistente.save();
        }

        // Validar Proceso
        const procesoExistente = await Proceso.findById(proceso);
        if (!procesoExistente) {
            return res.status(404).json({ msg: "Proceso no encontrado" });
        }

        // Validar Área de Producción
        const areaExistente = await AreaProduccion.findById(areaProduccion);
        if (!areaExistente) {
            return res.status(404).json({ msg: "Área de producción no encontrada" });
        }

        // Validar Máquina
        const maquinaExistente = await Maquina.findById(maquina);
        if (!maquinaExistente) {
            return res.status(404).json({ msg: "Máquina no encontrada" });
        }

        // Validar Insumos
        const insumosExistente = await Insumos.findById(insumos);
        if (!insumosExistente) {
            return res.status(404).json({ msg: "Insumo no encontrado" });
        }

        // Validar Fecha
        const fechaValida = new Date(fecha);
        if (isNaN(fechaValida.getTime())) {
            return res.status(400).json({ msg: "Fecha inválida" });
        }

        // Ajustar la fecha para la zona horaria local
        const fechaLocal = new Date(fecha);
        fechaLocal.setMinutes(fechaLocal.getMinutes() + fechaLocal.getTimezoneOffset());
        produccion.fecha = fechaLocal;

        // Actualizar los datos de la producción
        produccion.oti = otiExistente._id;
        produccion.operario = operarioDB._id;
        produccion.proceso = procesoExistente._id;
        produccion.areaProduccion = areaExistente._id;
        produccion.maquina = maquinaExistente._id;
        produccion.insumos = insumosExistente._id;
        produccion.tiempoPreparacion = tiempoPreparacion;
        produccion.tiempoOperacion = tiempoOperacion;

        // Validar Observaciones
        produccion.observaciones = req.body.observaciones || produccion.observaciones;

        // Guardar cambios
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

// 📌 Eliminar Producción
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
// 📌 Buscar Producción con filtros dinámicos para FilterPanel
exports.buscarProduccion = async (req, res) => {
    try {
        const { oti, operario, fechaInicio, fechaFin, proceso, areaProduccion, maquina, insumos, page = 1, limit = 10 } = req.query;
        const query = {};
        const skip = (parseInt(page) - 1) * parseInt(limit);

        console.log("📥 Filtros recibidos en el backend:", req.query);

        if (oti && oti.trim() !== '') {
            query.oti = oti; // Espera el _id directamente
        }

        if (operario && operario.trim() !== '') {
            query.operario = operario; // Espera el _id directamente
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
            query.proceso = proceso; // Espera el _id directamente
        }

        if (areaProduccion && areaProduccion.trim() !== '') {
            query.areaProduccion = areaProduccion; // Espera el _id directamente
        }

        if (maquina && maquina.trim() !== '') {
            query.maquina = maquina; // Espera el _id directamente
        }

        if (insumos && insumos.trim() !== '') {
            query.insumos = insumos; // Espera el _id directamente
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

