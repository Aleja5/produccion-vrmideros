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
        const { operario, fecha, oti, proceso, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin, tiempo, observaciones } = req.body;

        // Log de datos recibidos
        logger.info('Datos recibidos en registrarProduccion:', req.body);

        // Validar campos requeridos
        if (!operario || !fecha || !oti || !proceso || !areaProduccion || !maquina || !insumos || !tipoTiempo || !horaInicio || !horaFin || !tiempo) {
            logger.warn('Faltan campos requeridos:', { operario, fecha, oti, proceso, areaProduccion, maquina, insumos, tipoTiempo, horaInicio, horaFin, tiempo });
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
        const { _id, operario, oti, proceso, areaProduccion, maquina, insumos, fecha, tiempo, horaInicio, horaFin, tipoTiempo} = req.body;

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
        produccion.tipoTiempo = tipoTiempo || produccion.tipoTiempo;
        produccion.horaInicio = horaInicio || produccion.horaInicio;
        produccion.horaFin = horaFin || produccion.horaFin;
        produccion.tiempo = tiempo || produccion.tiempo;

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
  const { id } = req.params;
  logMessage('[eliminarProduccion] Iniciando eliminación para el ID: ' + id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    logMessage('[eliminarProduccion] ID no válido: ' + id);
    return res.status(400).json({ msg: "ID no válido" });
  }

  try {
    logMessage('[eliminarProduccion] Buscando producción con ID: ' + id);
    const produccion = await Produccion.findById(id);

    if (!produccion) {
      logMessage('[eliminarProduccion] Producción no encontrada con ID: ' + id);
      return res.status(404).json({ msg: "Producción no encontrada" });
    }
    logMessage('[eliminarProduccion] Producción encontrada: ' + JSON.stringify(produccion));

    const jornadaId = produccion.jornada;
    logMessage('[eliminarProduccion] ID de Jornada asociada: ' + jornadaId);

    // Eliminar la referencia de la producción en la jornada
    if (jornadaId) {
      logMessage('[eliminarProduccion] Actualizando Jornada: ' + jornadaId + ' para quitar la producción: ' + id);
      const jornadaActualizada = await Jornada.findByIdAndUpdate(
        jornadaId,
        { $pull: { registros: id } },
        { new: true }
      );
      if (jornadaActualizada) {
        logMessage('[eliminarProduccion] Jornada actualizada: ' + JSON.stringify(jornadaActualizada));
        // Recalcular horas y tiempo total de la jornada
        logMessage('[eliminarProduccion] Recalculando horas para Jornada ID: ' + jornadaId);
        await recalcularHorasJornada(jornadaId.toString());
        logMessage('[eliminarProduccion] Recalculando tiempo total para Jornada ID: ' + jornadaId);
        await recalcularTiempoTotal(jornadaId.toString());
        logMessage('[eliminarProduccion] Recalculos completados para Jornada ID: ' + jornadaId);
      } else {
        logMessage('[eliminarProduccion] No se encontró la Jornada con ID: ' + jornadaId + ' para actualizar.');
      }
    } else {
      logMessage('[eliminarProduccion] La producción no está asociada a ninguna jornada.');
    }

    // Eliminar el registro de producción
    logMessage('[eliminarProduccion] Eliminando Producción con ID: ' + id);
    const resultadoDelete = await Produccion.findByIdAndDelete(id);

    if (!resultadoDelete) {
        logMessage('[eliminarProduccion] No se pudo eliminar la Producción con ID (findByIdAndDelete retornó null): ' + id);
        // Considerar si esto debe ser un error 500 o si la lógica anterior de no encontrarla ya lo cubrió.
        // Por ahora, si llegamos aquí después de encontrarla, es un error.
        return res.status(500).json({ msg: "Error al eliminar la producción, no se encontró después de la búsqueda inicial." });
    }

    logMessage('[eliminarProduccion] Producción eliminada exitosamente: ' + id);
    res.status(200).json({ msg: "Producción eliminada exitosamente" });

  } catch (error) {
    logMessage('[eliminarProduccion] Error durante la eliminación de producción ID ' + id + ': ' + error.message + '\\nStack: ' + error.stack);
    res.status(500).json({ msg: "Error al eliminar la producción", error: error.message });
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

