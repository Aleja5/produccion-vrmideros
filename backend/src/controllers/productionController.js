const mongoose = require("mongoose");
const winston = require('winston');
const Produccion = require("../models/Produccion");
const Jornada = require("../models/Jornada");
const { recalcularHorasJornada } = require('../utils/recalcularHoras');
const { recalcularTiempoTotal } = require('../utils/recalcularTiempo');
const fs = require('fs');
const path = require('path');
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

const logFilePath = path.join(__dirname, '..', '..', 'logs', 'produccion.log');

// Función para registrar mensajes en el archivo de log y en la consola
const logMessage = (message) => {
  console.log(message);
  fs.appendFileSync(logFilePath, `\${new Date().toISOString()} - \${message}\\n`);
};

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
            .populate("procesos", "nombre")
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
        const { operario, fecha, oti, procesos, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin, tiempo, observaciones } = req.body;

        // Log de datos recibidos
        logger.info('Datos recibidos en registrarProduccion:', req.body);

        // Nueva validación más detallada
        const validationErrors = [];
        if (!operario) validationErrors.push('operario');
        if (!fecha) validationErrors.push('fecha');
        if (!oti) validationErrors.push('oti');
        if (!procesos || !Array.isArray(procesos)) { // Asegura que procesos sea un array
            validationErrors.push('procesos (debe ser un array)');
        } else if (procesos.length === 0 && (tipoTiempo === "Operación" || tipoTiempo === "Preparación")) { // Ejemplo: requerir procesos si es operación/preparación
            // Ajusta esta lógica si procesos puede estar vacío en ciertos casos o siempre debe tener al menos uno.
            // Por ahora, solo validamos que sea un array. El modelo Produccion.js ya requiere que los elementos internos sean ObjectId.
        }
        if (!areaProduccion) validationErrors.push('areaProduccion');
        if (!maquina) validationErrors.push('maquina');
        if (!insumos || !Array.isArray(insumos)) { // Asegura que insumos sea un array
            validationErrors.push('insumos (debe ser un array)');
        }
        // Similar a procesos, puedes añadir validación de insumos.length === 0 si es necesario.
        if (!tipoTiempo) validationErrors.push('tipoTiempo');
        if (!horaInicio) validationErrors.push('horaInicio');
        if (!horaFin) validationErrors.push('horaFin');
        if (typeof tiempo !== 'number') { // Permite que tiempo sea 0
            validationErrors.push('tiempo (debe ser un número)');
        }

        if (validationErrors.length > 0) {
            const message = `Faltan campos requeridos o tienen formato incorrecto: ${validationErrors.join(', ')}`;
            logger.warn(message, { body: req.body, errors: validationErrors });
            return res.status(400).json({ msg: message, fields: validationErrors });
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

        const otiId = await verificarYCrearOti(oti);

        // Asignar el ObjectId de OTI al registro de producción
        const nuevaProduccion = new Produccion({
            operario,
            fecha,
            oti: otiId,
            procesos,
            areaProduccion,
            maquina,
            insumos,
            jornada: jornada._id,
            tipoTiempo,
            horaInicio,
            horaFin,
            tiempo,
            observaciones: observaciones || null
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
        .populate({ path: 'procesos', select: 'nombre' })
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
        const { _id, operario, oti, procesos, areaProduccion, maquina, insumos, fecha, tiempo, horaInicio, horaFin, tipoTiempo} = req.body;

        // Validaciones básicas
        if (!_id) {
            return res.status(400).json({ msg: "El ID del registro de producción es requerido." });
        }
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ msg: "El ID del registro de producción no es válido." });
        }

        // Verificar que todos los campos necesarios para la actualización están presentes
        if (!operario || !oti || !procesos || !areaProduccion || !maquina || !insumos || !fecha || !tiempo || !horaInicio || !horaFin || !tipoTiempo) { 
            console.log("Faltan campos requeridos para la actualización:", { operario, oti, procesos, areaProduccion, maquina, insumos, fecha, tiempo, horaInicio, horaFin, tipoTiempo }); 
            return res.status(400).json({ msg: "Faltan campos requeridos para la actualización." });
        }

        // Convertir IDs de string a ObjectId donde sea necesario
        const operarioId = new mongoose.Types.ObjectId(operario);
        const areaProduccionId = new mongoose.Types.ObjectId(areaProduccion);
        const maquinaId = new mongoose.Types.ObjectId(maquina);
        const procesosIds = Array.isArray(procesos) ? procesos.map(pId => new mongoose.Types.ObjectId(pId)) : [new mongoose.Types.ObjectId(procesos)];
        const insumosIds = Array.isArray(insumos) ? insumos.map(iId => new mongoose.Types.ObjectId(iId)) : [new mongoose.Types.ObjectId(insumos)];

        // Verificar y/o crear OTI
        const otiId = await verificarYCrearOti(oti);
        if (!otiId) {
            return res.status(400).json({ msg: "Error al verificar o crear la OTI." });
        }

        const produccionActualizada = await Produccion.findByIdAndUpdate(
            _id,
            {
                operario: operarioId,
                oti: otiId,
                procesos: procesosIds, 
                areaProduccion: areaProduccionId,
                maquina: maquinaId,
                insumos: insumosIds,
                fecha,
                tiempo,
                horaInicio,
                horaFin,
                tipoTiempo,
                // No actualizamos la jornada aquí directamente, se maneja por separado si es necesario
            },
            { new: true, runValidators: true }
        )
        .populate("oti", "numeroOti")
        .populate("operario", "name")
        .populate("procesos", "nombre") 
        .populate("areaProduccion", "nombre")
        .populate("maquina", "nombre")
        .populate("insumos", "nombre");

        if (!produccionActualizada) {
            return res.status(404).json({ msg: "Registro de producción no encontrado." });
        }

        // Recalcular tiempo total de la OTI si es necesario (opcional, dependiendo de la lógica de negocio)
        // await recalcularTiempoTotal(otiId);

        console.log("✅ Producción actualizada exitosamente:", produccionActualizada);
        res.status(200).json({ msg: "Producción actualizada exitosamente", produccion: produccionActualizada });

    } catch (error) {
        console.error("❌ Error al actualizar producción:", error);
        // Considerar enviar un mensaje más específico basado en el tipo de error
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: "Error de casteo: Verifique los IDs proporcionados.", error: error.message });
        }
        res.status(500).json({ msg: "Error interno del servidor al actualizar la producción.", error: error.message });
    }
};

// 📌 Eliminar Producción
exports.eliminarProduccion = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que el ID de la producción esté presente
        if (!id) {
            return res.status(400).json({ msg: 'El ID de la producción es requerido' });
        }

        // Buscar la producción a eliminar
        const produccion = await Produccion.findById(id);
        if (!produccion) {
            return res.status(404).json({ msg: "Producción no encontrada" });
        }

        const jornadaId = produccion.jornada; // Guardar el ID de la jornada antes de eliminar la producción

        // Eliminar la producción
        await Produccion.findByIdAndDelete(id);

        // Si la producción estaba asociada a una jornada, actualizar la jornada
        if (jornadaId) {
            const jornada = await Jornada.findById(jornadaId);
            if (jornada) {
                // Remover el ID de la producción eliminada de los registros de la jornada
                jornada.registros = jornada.registros.filter(registroId => registroId.toString() !== id.toString());
                
                // Guardar la jornada para disparar el hook pre-save y recalcular totales
                await jornada.save(); 
                logger.info(`Jornada ${jornadaId} actualizada tras eliminación de producción ${id}.`);
            } else {
                logger.warn(`No se encontró la jornada con ID ${jornadaId} para actualizar tras eliminar producción ${id}.`);
            }
        }

        logger.info(`Producción con ID: ${id} eliminada exitosamente.`);
        res.status(200).json({ msg: "Producción eliminada exitosamente" });

    } catch (error) {
        logger.error("Error al eliminar producción:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
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

        if (proceso && proceso.trim() !== '') { // Should be procesos
            // If 'proceso' is an array of IDs
            if (Array.isArray(proceso) && proceso.length > 0) {
                query.procesos = { $in: proceso.map(p => new mongoose.Types.ObjectId(p)) };
            } else if (mongoose.Types.ObjectId.isValid(proceso)) {
                 // If 'proceso' is a single ID string 
                query.procesos = new mongoose.Types.ObjectId(proceso);
            }
        }

        if (areaProduccion && areaProduccion.trim() !== '') {
            query.areaProduccion = areaProduccion;
        }

        if (maquina && maquina.trim() !== '') {
            query.maquina = maquina;
        }

        if (insumos && insumos.trim() !== '') { // Should be insumos, and handle array
            // If 'insumos' is an array of IDs
            if (Array.isArray(insumos) && insumos.length > 0) {
                query.insumos = { $in: insumos.map(i => new mongoose.Types.ObjectId(i)) };
            } else if (mongoose.Types.ObjectId.isValid(insumos)){
                // If 'insumos' is a single ID string
                query.insumos = new mongoose.Types.ObjectId(insumos);
            }
        }

        console.log("🔍 Query final construida para la búsqueda:", query);

        const totalResultados = await Produccion.countDocuments(query);
        console.log("📊 Total de resultados encontrados:", totalResultados);

        const producciones = await Produccion.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('oti', 'numeroOti')
            .populate('operario', 'name')
            .populate('procesos', 'nombre') // Changed from proceso to procesos
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
            .populate("procesos", "nombre") // Changed from proceso to procesos
            .populate("areaProduccion", "nombre")
            .populate("maquina", "nombre")
            .populate("insumos", "nombre");

        res.status(200).json(producciones);
    } catch (error) {
        console.error("Error al buscar por fechas:", error);
        res.status(500).json({ msg: "Error al buscar registros" });
    }
};