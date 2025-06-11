const mongoose = require("mongoose");
const winston = require('winston');
const Produccion = require("../models/Produccion");
const Jornada = require("../models/Jornada");
const { recalcularHorasJornada } = require('../utils/recalcularHoras');
const { recalcularTiempoTotal } = require('../utils/recalcularTiempo');
const fs = require('fs');
const path = require('path');
const verificarYCrearOti = require('../utils/verificarYCrearEntidad');
const Operario = require('../models/Operario'); // <--- AÑADIDO: Importar modelo Operario
const Proceso = require('../models/Proceso'); // Added import
const AreaProduccion = require('../models/AreaProduccion'); // Added import
const Maquina = require('../models/Maquina'); // Added import
const Insumo = require('../models/Insumos'); // Corrected import path from Insumo to Insumos


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
            .populate("oti", "_id numeroOti")
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

        const producciones = await Produccion.find({ operario: operario })
            .populate('operario', 'name')
            .populate('oti', '_id numeroOti')
            .populate('procesos', 'nombre')
            .populate('areaProduccion', 'nombre')
            .populate('maquina', 'nombre')
            .populate('insumos', 'nombre');

        if (!producciones.length) {
            return res.status(404).json({ msg: "No se encontraron producciones para este operario" });
        }

        return res.status(200).json(producciones);
    } catch (error) {
        // Log error in a consistent way
        logger.error("Error al obtener las producciones:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

exports.listarProduccion = async (req, res) => {
    try {
        const { operario, oti } = req.query;
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
        .populate({ path: 'oti', select: '_id numeroOti' })
        .populate({ path: 'procesos', select: 'nombre' })
        .populate({ path: 'areaProduccion', select: 'nombre' })
        .populate({ path: 'maquina', select: 'nombre' })
        .populate({ path: 'operario', select: 'name' })
        .populate({ path: 'insumos', select: 'nombre' });

        res.status(200).json(producciones);
    } catch (error) {
        logger.error('Error al listar producciones:', error);
        res.status(500).json({ msg: 'Error al listar las producciones' });
    }
};

exports.actualizarProduccion = async (req, res) => {
    try {
        const { _id, operario, oti, procesos, areaProduccion, maquina, insumos, fecha, tiempo, horaInicio, horaFin, tipoTiempo, observaciones } = req.body;

        // Validar que el ID de la producción esté presente
        // Validaciones básicas
        if (!_id) {
            return res.status(400).json({ msg: "El ID del registro de producción es requerido." });
        }
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ msg: "El ID del registro de producción no es válido." });
        }
      
        if (!operario || !areaProduccion || !maquina || !fecha || typeof tiempo !== 'number' || !horaInicio || !horaFin || !tipoTiempo || !procesos) { 
            return res.status(400).json({ msg: "Faltan campos requeridos para la actualización o tienen formato incorrecto." });
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
        }        const produccionActualizada = await Produccion.findByIdAndUpdate(
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
                observaciones: observaciones || null
            },
            { new: true, runValidators: true }
        )
        .populate("oti", "_id numeroOti")
        .populate("operario", "name")
        .populate("procesos", "nombre") 
        .populate("areaProduccion", "nombre")
        .populate("maquina", "nombre")
        .populate("insumos", "nombre");

        if (!produccionActualizada) {
            return res.status(404).json({ msg: "Registro de producción no encontrado." });
        }        // Recalcular la jornada asociada si existe
        if (produccionActualizada.operario && fecha) {
            try {
                console.log('🔍 Buscando/creando jornada para recalcular:', {
                    operario: produccionActualizada.operario._id,
                    fecha: new Date(fecha)
                });

                // Normalizar la fecha para buscar la jornada
                const fechaNormalizada = new Date(fecha);
                fechaNormalizada.setUTCHours(0, 0, 0, 0);

                let jornada = await Jornada.findOne({
                    operario: produccionActualizada.operario._id,
                    fecha: fechaNormalizada
                });

                if (!jornada) {
                    console.log('🆕 No existe jornada, creando una nueva');
                    // Crear nueva jornada si no existe
                    jornada = new Jornada({
                        operario: produccionActualizada.operario._id,
                        fecha: fechaNormalizada,
                        registros: [],
                        totalTiempoActividades: { horas: 0, minutos: 0 }
                    });
                    await jornada.save();
                    console.log('✅ Nueva jornada creada:', jornada._id);
                }                // Buscar todas las producciones de este operario en esta fecha
                const producciones = await Produccion.find({
                    operario: produccionActualizada.operario._id,
                    fecha: {
                        $gte: fechaNormalizada,
                        $lt: new Date(fechaNormalizada.getTime() + 24 * 60 * 60 * 1000) // Siguiente día
                    }
                });

                console.log(`📋 Encontradas ${producciones.length} producciones para esta fecha`);

                // Actualizar los registros de la jornada con todas las producciones encontradas
                const registrosIds = producciones.map(p => p._id);
                jornada.registros = registrosIds;

                console.log('📊 Datos de producciones antes del recálculo:', producciones.map(p => ({
                    _id: p._id,
                    tiempo: p.tiempo,
                    horaInicio: p.horaInicio,
                    horaFin: p.horaFin,
                    tipoTiempo: p.tipoTiempo
                })));

                // Guardar la jornada para activar el hook pre-save y recalcular
                await jornada.save();

                console.log('✅ Jornada recalculada exitosamente');
                console.log('📊 Tiempo total calculado:', {
                    horas: jornada.totalTiempoActividades.horas,
                    minutos: jornada.totalTiempoActividades.minutos,
                    tiempoEfectivo: jornada.totalTiempoActividades.tiempoEfectivo,
                    tiempoSumado: jornada.totalTiempoActividades.tiempoSumado
                });

            } catch (jornadaError) {
                console.error('❌ Error al recalcular la jornada:', jornadaError);
                // No fallar la actualización de producción por un error en la jornada
            }
        }

        res.status(200).json({ msg: "Producción actualizada exitosamente", produccion: produccionActualizada });

    } catch (error) {
        logger.error("Error al actualizar producción:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: "Error de casteo: Verifique los IDs proporcionados." });
        }
        res.status(500).json({ msg: "Error interno del servidor al actualizar la producción." });
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

        // Log de parámetros recibidos
        console.log('Parámetros de búsqueda recibidos:', req.query);

        // Filter by OTI
        if (oti && oti.trim() !== '') {
            const otiTrimmed = oti.trim();
            if (mongoose.Types.ObjectId.isValid(otiTrimmed)) {
                query.oti = new mongoose.Types.ObjectId(otiTrimmed);
                console.log('Filtro OTI aplicado (ID):', query.oti);
            } else {
                const otiDoc = await Oti.findOne({ numeroOti: otiTrimmed });
                if (otiDoc) {
                    query.oti = otiDoc._id;
                    console.log('Filtro OTI aplicado (nombre):', query.oti);
                } else {
                    console.log('OTI no encontrada:', otiTrimmed);
                    return res.status(200).json({ totalResultados: 0, resultados: [] });
                }
            }
        }

        // Filter by Operario
        if (operario && operario.trim() !== '') {
            const operarioTrimmed = operario.trim();
            if (mongoose.Types.ObjectId.isValid(operarioTrimmed)) {
                query.operario = new mongoose.Types.ObjectId(operarioTrimmed);
                console.log('Filtro Operario aplicado (ID):', query.operario);
            } else {
                const operarioDoc = await Operario.findOne({ name: operarioTrimmed });
                if (operarioDoc) {
                    query.operario = operarioDoc._id;
                    console.log('Filtro Operario aplicado (nombre):', query.operario);
                } else {
                    console.log('Operario no encontrado:', operarioTrimmed);
                    return res.status(200).json({ totalResultados: 0, resultados: [] });
                }
            }
        }        // Filter by Date Range
        if (fechaInicio && fechaFin) {
            // Si las fechas vienen en formato YYYY-MM-DD, crear fechas locales explícitamente
            let inicio, fin;
            
            if (fechaInicio.includes('T')) {
                // Formato ISO completo
                inicio = new Date(fechaInicio);
            } else {
                // Formato YYYY-MM-DD, crear fecha local
                const [year, month, day] = fechaInicio.split('-').map(Number);
                inicio = new Date(year, month - 1, day, 0, 0, 0, 0);
            }
            
            if (fechaFin.includes('T')) {
                // Formato ISO completo
                fin = new Date(fechaFin);
            } else {
                // Formato YYYY-MM-DD, crear fecha local
                const [year, month, day] = fechaFin.split('-').map(Number);
                fin = new Date(year, month - 1, day, 23, 59, 59, 999);
            }
            
            query.fecha = { $gte: inicio, $lte: fin };
            console.log('🗓️ Filtro de fechas aplicado:', {
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                inicioProcessed: inicio,
                finProcessed: fin,
                query: query.fecha
            });
        }

        // Filter by Proceso (searches if the ID is in the 'procesos' array)
        if (proceso && proceso.trim() !== '') {
            const procesoTrimmed = proceso.trim();
            let procesoIdToQuery;
            if (mongoose.Types.ObjectId.isValid(procesoTrimmed)) {
                procesoIdToQuery = new mongoose.Types.ObjectId(procesoTrimmed);
            } else {
                const procesoDoc = await Proceso.findOne({ nombre: procesoTrimmed });
                if (procesoDoc) {
                    procesoIdToQuery = procesoDoc._id; // This is already an ObjectId
                } else {
                    console.log('Proceso no encontrado:', procesoTrimmed);
                    return res.status(200).json({ totalResultados: 0, resultados: [] });
                }
            }
            if (procesoIdToQuery) {
                query.procesos = { $in: [procesoIdToQuery] };
                console.log('Filtro Proceso aplicado:', query.procesos);
            }
        }

        // Filter by Area de Producción
        if (areaProduccion && areaProduccion.trim() !== '') {
            const areaTrimmed = areaProduccion.trim();
            if (mongoose.Types.ObjectId.isValid(areaTrimmed)) {
                query.areaProduccion = new mongoose.Types.ObjectId(areaTrimmed);
                console.log('Filtro Área aplicado (ID):', query.areaProduccion);
            } else {
                const areaDoc = await AreaProduccion.findOne({ nombre: areaTrimmed });
                if (areaDoc) {
                    query.areaProduccion = areaDoc._id;
                    console.log('Filtro Área aplicado (nombre):', query.areaProduccion);
                } else {
                    console.log('Área no encontrada:', areaTrimmed);
                    return res.status(200).json({ totalResultados: 0, resultados: [] });
                }
            }
        }

        // Filter by Maquina
        if (maquina && maquina.trim() !== '') {
            const maquinaTrimmed = maquina.trim();
            if (mongoose.Types.ObjectId.isValid(maquinaTrimmed)) {
                query.maquina = new mongoose.Types.ObjectId(maquinaTrimmed);
                console.log('Filtro Máquina aplicado (ID):', query.maquina);
            } else {
                const maquinaDoc = await Maquina.findOne({ nombre: maquinaTrimmed });
                if (maquinaDoc) {
                    query.maquina = maquinaDoc._id;
                    console.log('Filtro Máquina aplicado (nombre):', query.maquina);
                } else {
                    console.log('Máquina no encontrada:', maquinaTrimmed);
                    return res.status(200).json({ totalResultados: 0, resultados: [] });
                }
            }
        }

        // Filter by Insumos (searches if the ID is in the 'insumos' array)
        if (insumos && insumos.trim() !== '') {
            const insumosTrimmed = insumos.trim();
            let insumoIdToQuery;
            if (mongoose.Types.ObjectId.isValid(insumosTrimmed)) {
                insumoIdToQuery = new mongoose.Types.ObjectId(insumosTrimmed);
            } else {
                const insumoDoc = await Insumo.findOne({ nombre: insumosTrimmed });
                if (insumoDoc) {
                    insumoIdToQuery = insumoDoc._id; // This is already an ObjectId
                } else {
                    console.log('Insumo no encontrado:', insumosTrimmed);
                    return res.status(200).json({ totalResultados: 0, resultados: [] });
                }
            }
            if (insumoIdToQuery) {
                query.insumos = { $in: [insumoIdToQuery] };
                console.log('Filtro Insumos aplicado:', query.insumos);
            }
        }

        // Log de la consulta final construida
        console.log('Consulta MongoDB construida:', JSON.stringify(query, null, 2));

        const totalResultados = await Produccion.countDocuments(query);
        console.log('Total de resultados encontrados:', totalResultados);

        const producciones = await Produccion.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('oti', '_id numeroOti')
            .populate('operario', 'name')
            .populate('procesos', 'nombre')
            .populate('areaProduccion', 'nombre')
            .populate('maquina', 'nombre')
            .populate('insumos', 'nombre');

        console.log('Producciones encontradas:', producciones.length);
        
        res.status(200).json({ totalResultados, resultados: producciones });
    } catch (error) {
        logger.error('Error al buscar producciones:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
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
            .populate("oti", "_id numeroOti")
            .populate("operario", "name")
            .populate("procesos", "nombre") // Changed from proceso to procesos
            .populate("areaProduccion", "nombre")
            .populate("maquina", "nombre")
            .populate("insumos", "nombre");

        res.status(200).json(producciones);
    } catch (error) {
        logger.error("Error al buscar por fechas:", error);
        res.status(500).json({ msg: "Error al buscar registros" });
    }
};

// NUEVO: Obtener todas las OTIs para filtros
exports.getAllOtiParaFiltros = async (req, res) => {
    try {
        const otis = await Oti.find({}, '_id numeroOti').sort({ numeroOti: 1 });
        res.status(200).json(otis);
    } catch (error) {
        logger.error("Error al obtener OTIs para filtros:", error);
        res.status(500).json({ msg: "Error interno del servidor al obtener OTIs" });
    }
};

// NUEVO: Obtener todos los Operarios para filtros
exports.getAllOperariosParaFiltros = async (req, res) => {
    try {
        const operarios = await Operario.find({}, '_id name').sort({ name: 1 }); // Asumiendo que el campo es 'name'
        res.status(200).json(operarios);
    } catch (error) {
        logger.error("Error al obtener Operarios para filtros:", error);
        res.status(500).json({ msg: "Error interno del servidor al obtener Operarios" });
    }
};

// NUEVO: Función de debug para verificar datos existentes
exports.debugDatos = async (req, res) => {
    try {
        console.log('=== DEBUG: Verificando datos en la base de datos ===');
        
        // Contar total de registros de producción
        const totalProduccion = await Produccion.countDocuments({});
        console.log('Total de registros de producción:', totalProduccion);
        
        // Obtener algunos registros de muestra
        const muestraProduccion = await Produccion.find({})
            .limit(3)
            .populate('operario', 'name')
            .populate('oti', 'numeroOti');
        
        console.log('Muestra de registros de producción:');
        muestraProduccion.forEach((prod, index) => {
            console.log(`Registro ${index + 1}:`, {
                _id: prod._id,
                operario: prod.operario,
                oti: prod.oti,
                fecha: prod.fecha
            });
        });
        
        // Verificar operarios existentes
        const operarios = await Operario.find({}, '_id name').limit(5);
        console.log('Operarios en la base de datos:');
        operarios.forEach(op => {
            console.log(`- ${op.name} (ID: ${op._id})`);
        });
        
        res.status(200).json({
            totalProduccion,
            muestraProduccion,
            operarios
        });
    } catch (error) {
        console.error('Error en debug:', error);
        res.status(500).json({ error: error.message });
    }
};