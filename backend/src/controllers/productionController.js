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

        // Definir tiempoPreparacion con un valor predeterminado o lógica específica
        const tiempoPreparacion = req.body.tiempoPreparacion || 0;

        // Definir tiempoOperacion con un valor predeterminado o lógica específica
        const tiempoOperacion = req.body.tiempoOperacion || 0;

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

        // Convert horaInicio (HH:mm string from req.body) to Date object
        // 'horaInicio' here is the destructured variable from req.body
        if (horaInicio !== undefined) { // Check if horaInicio was present in req.body
            if (horaInicio === null) {
                produccion.horaInicio = null; // Allow explicitly setting to null if schema permits
            } else {
                const isString = typeof horaInicio === 'string';
                const isTimeFormat = isString ? /^\d{2}:\d{2}$/.test(horaInicio) : false;

                if (isString && isTimeFormat) {
                    const [hoursStr, minutesStr] = horaInicio.split(':');
                    const hours = parseInt(hoursStr, 10);
                    const minutes = parseInt(minutesStr, 10);

                    if (produccion.fecha instanceof Date && !isNaN(produccion.fecha.getTime()) &&
                        !isNaN(hours) && hours >= 0 && hours <= 23 &&
                        !isNaN(minutes) && minutes >= 0 && minutes <= 59) {
                        
                        const newHoraInicio = new Date(produccion.fecha);
                        newHoraInicio.setHours(hours, minutes, 0, 0);
                        produccion.horaInicio = newHoraInicio;
                    } else {
                        console.warn(`Could not parse horaInicio "\\${horaInicio}" due to invalid time values or invalid base date (produccion.fecha: \\${produccion.fecha}).`);
                        return res.status(400).json({ msg: `Formato de horaInicio \'\\${horaInicio}\' inválido o fecha base inválida.` });
                    }
                } else {
                    console.warn(`horaInicio was provided but not in expected HH:mm format or null: \\${horaInicio}`);
                    return res.status(400).json({ msg: `Formato de horaInicio \'\\${horaInicio}\' debe ser HH:mm o null.` });
                }
            }
        } // If horaInicio was not in req.body (i.e., undefined), produccion.horaInicio (the existing value from DB) is preserved.

        // Convert horaFin (HH:mm string from req.body) to Date object
        // 'horaFin' here is the destructured variable from req.body
        if (horaFin !== undefined) { // Check if horaFin was present in req.body
            if (horaFin === null) {
                produccion.horaFin = null; // Allow explicitly setting to null
            } else {
                const isString = typeof horaFin === 'string';
                const isTimeFormat = isString ? /^\d{2}:\d{2}$/.test(horaFin) : false;

                if (isString && isTimeFormat) {
                    const [hoursStr, minutesStr] = horaFin.split(':');
                    const hours = parseInt(hoursStr, 10);
                    const minutes = parseInt(minutesStr, 10);

                    if (produccion.fecha instanceof Date && !isNaN(produccion.fecha.getTime()) &&
                        !isNaN(hours) && hours >= 0 && hours <= 23 &&
                        !isNaN(minutes) && minutes >= 0 && minutes <= 59) {

                        const newHoraFin = new Date(produccion.fecha);
                        newHoraFin.setHours(hours, minutes, 0, 0);
                        produccion.horaFin = newHoraFin;
                    } else {
                        console.warn(`Could not parse horaFin "\\${horaFin}" due to invalid time values or invalid base date (produccion.fecha: \\${produccion.fecha}).`);
                        return res.status(400).json({ msg: `Formato de horaFin \'\\${horaFin}\' inválido o fecha base inválida.` });
                    }
                } else {
                    console.warn(`horaFin was provided but not in expected HH:mm format or null: \\${horaFin}`);
                    return res.status(400).json({ msg: `Formato de horaFin \'\\${horaFin}\' debe ser HH:mm o null.` });
                }
            }
        } // If horaFin was not in req.body (i.e., undefined), produccion.horaFin (the existing value from DB) is preserved.
        
        produccion.tiempo = tiempo || produccion.tiempo;

        // Validar Observaciones
        produccion.observaciones = req.body.observaciones || produccion.observaciones;


        //  COMPROBAR SI LA FECHA DE LA PRODUCCIÓN CAMBIÓ Y ACTUALIZAR LA JORNADA
        const oldJornadaId = produccion.jornada;
        const newFecha = produccion.fecha;
        let jornadaCambiada = false;

        if (oldJornadaId) {
        const oldJornada = await Jornada.findById(oldJornadaId);

        // Comparar solo la fecha (sin hora)
        const fechaJornada = oldJornada?.fecha?.toISOString().split('T')[0];
        const fechaProduccion = newFecha.toISOString().split('T')[0];

        if (fechaJornada !== fechaProduccion) {
            jornadaCambiada = true;

            // 🗑 Quitar la actividad de la jornada anterior
            if (oldJornada) {
            oldJornada.registros.pull(produccion._id);
            await oldJornada.save();

            // Si la jornada queda vacía, puedes eliminarla
            if (oldJornada.registros.length === 0) {
                await Jornada.findByIdAndDelete(oldJornada._id);
            }
            }

            // 🔍 Buscar o crear nueva jornada con la nueva fecha
            let nuevaJornada = await Jornada.findOne({ operario: operarioDB._id, fecha: newFecha });

            if (!nuevaJornada) {
            nuevaJornada = new Jornada({
                operario: operarioDB._id,
                fecha: newFecha,
                registros: [],
            });
            }

            // Asegurar que la actividad esté incluida
            if (!nuevaJornada.registros.includes(produccion._id)) {
            nuevaJornada.registros.push(produccion._id);
            }

            await nuevaJornada.save();
            produccion.jornada = nuevaJornada._id;
        }
        }
        // Guardar cambios
        const produccionActualizada = await produccion.save();
        console.log("✅ Producción actualizada en BD:", produccionActualizada);

        // Forzar el recálculo de la jornada asociada
        const jornadaParaActualizar = await Jornada.findById(produccionActualizada.jornada);
        if (jornadaParaActualizar) {
            await jornadaParaActualizar.save(); // Esto disparará los hooks pre-save de Jornada
            console.log("🔄 Jornada asociada actualizada para recálculos.");
        } else {
            console.warn(`⚠️ No se encontró la jornada con ID ${produccionActualizada.jornada} para forzar el recálculo.`);
        }

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

