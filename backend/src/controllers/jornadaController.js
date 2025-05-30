// backend/controllers/jornadaController.js (o como lo tengas)

const mongoose = require('mongoose');
const Produccion = require('../models/Produccion');
const Jornada = require('../models/Jornada');
const Operario = require('../models/Operario');
const { recalcularTiempoTotal } = require('../utils/recalcularTiempo');
const { recalcularHorasJornada } = require('../utils/recalcularHoras');

exports.crearJornada = async (req, res) => {
    try {
        const { operario, fecha } = req.body; // 'actividades' no se pasa al crear una jornada vacía

        // Validar ObjectId para operario
        if (!mongoose.Types.ObjectId.isValid(operario)) {
            return res.status(400).json({ error: 'ID de operario inválido' });
        }

        // Normalizar la fecha para la búsqueda (solo año, mes, día)
        const fechaNormalizada = new Date(fecha);
        fechaNormalizada.setUTCHours(0, 0, 0, 0); // Establecer a medianoche UTC para evitar problemas de zona horaria

        // Verificar si ya existe una jornada para este operario en esta fecha
        const jornadaExistente = await Jornada.findOne({ operario: operario, fecha: fechaNormalizada });

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
        const jornadas = await Jornada.find().
        populate({
            path: 'registros',
            populate: [
                { path: 'oti', select: 'numeroOti' },
                { path: 'proceso', select: 'nombre' },
                { path: 'areaProduccion', select: 'nombre' },
                { path: 'maquina', select: 'nombre' },
                { path: 'insumos', select: 'nombre' }
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
                { path: 'proceso', model: 'Proceso', select: 'nombre' },
                { path: 'areaProduccion', model: 'AreaProduccion', select: 'nombre' },
                { path: 'maquina', model: 'Maquina', select: 'nombre' },
                { path: 'insumos', model: 'Insumo', select: 'nombre' }
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
    const { id } = req.params;

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

        // Recalcular tiempo y hacer populate completo para cada jornada
        const jornadasConTiempo = await Promise.all(jornadas.map(async (jornada) => {

            return await Jornada.findById(jornada._id).populate({
                path: 'registros',
                populate: [
                    { path: 'proceso', select: 'nombre' },
                    { path: 'oti', select: 'numeroOti' },
                    { path: 'areaProduccion', select: 'nombre' },
                    { path: 'maquina', select: 'nombre' },
                    { path: 'insumos', select: 'nombre' }
                ]
            });
        }));

        console.log(`✅ Jornadas encontradas para ${operarioExiste.name}: ${jornadas.length}`);
        res.json(jornadasConTiempo);

    } catch (error) {
        console.error(`🚨 Error al obtener las jornadas del operario ${id}:`, error);
        res.status(500).json({ msg: 'Error al obtener las jornadas' });
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

        // Convertir registros a ObjectIds si vienen como objetos completos o si es necesario
        // O simplemente pasar el array de IDs si ya está así.
        // Si 'registros' contiene objetos completos de actividades, Mongoose puede intentar validarlos
        // contra el esquema de Produccion si está en un array de subdocumentos, o solo guardar los IDs.
        // Asumiendo que 'registros' aquí son IDs o que solo se actualizan horaInicio/horaFin.

        const jornada = await Jornada.findByIdAndUpdate(
            id,
            { horaInicio, horaFin, registros }, // Cuidado aquí: si registros no son solo IDs, podría haber un problema.
                                               // Si quieres actualizar solo horaInicio/horaFin, no pases 'registros'
                                               // a menos que sean el array de IDs.
            { new: true, runValidators: true } // runValidators: true para que Mongoose valide el update
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
        // Opcional: Eliminar los registros de producción asociados antes de eliminar la jornada
        // await Produccion.deleteMany({ jornada: id });

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
            fecha, // Esta fecha es la de la jornada, no la de la actividad específica (que es la misma)
            oti,
            proceso,
            areaProduccion,
            maquina,
            insumos,
            tipoTiempo,
            horaInicio,
            horaFin,
            tiempo, // Este 'tiempo' ya viene del frontend como número de minutos
            observaciones
        } = req.body;

        // Validar que el ID de la jornada sea válido
        if (!mongoose.Types.ObjectId.isValid(jornadaId)) {
            return res.status(400).json({ error: 'ID de jornada inválido' });
        }

        // Buscar la jornada
        const jornada = await Jornada.findById(jornadaId); // No necesitas poblar registros aquí si solo vas a agregar un nuevo _id
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada no encontrada' });
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

        // Crear un nuevo registro de producción (actividad individual)
        const nuevoRegistro = new Produccion({
            operario,
            fecha: fechaActividadNormalizada,
            oti,
            proceso,
            areaProduccion,
            maquina,
            insumos,
            tipoTiempo,
            horaInicio, // Asume que horaInicio/horaFin ya vienen como Date o string parseable a Date
            horaFin,
            tiempo: tiempo || 0, // Asegurarse de que 'tiempo' es un Number
            observaciones: observaciones || null,
            jornada: jornadaId // Enlazar la actividad con la jornada
        });
        await nuevoRegistro.save(); // Guarda la actividad en su propia colección

        // Agregar el _id del nuevo registro a la jornada
        jornada.registros.push(nuevoRegistro._id);
        await jornada.save(); // Guarda la jornada, lo que podría activar un 'pre-save' hook

        // Recalcular las horas de inicio/fin y el totalTiempoActividades de la jornada
        // Esto es crucial para mantener la jornada actualizada
        await recalcularHorasJornada(jornadaId);
        // Recalcular el tiempo total de actividades
        await recalcularTiempoTotal(jornadaId);

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
                horaInicio: horaInicio, // Asume que ya vienen como Date o string parseable
                horaFin: horaFin,
                registros: [],
                totalTiempoActividades: 0 // Se calculará después de agregar las actividades
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
                    operario: jornada.operario, // Usar el operario de la jornada
                    fecha: jornada.fecha,       // Usar la fecha de la jornada
                    oti: actividad.oti,
                    proceso: actividad.proceso,
                    areaProduccion: actividad.areaProduccion,
                    maquina: actividad.maquina,
                    insumos: actividad.insumos,
                    tipoTiempo: actividad.tipoTiempo,
                    horaInicio: actividad.horaInicio,
                    horaFin: actividad.horaFin,
                    tiempo: actividad.tiempo || 0, // Asegurarse de que 'tiempo' es un Number
                    observaciones: actividad.observaciones || null,
                    jornada: jornada._id
                });
                await nuevoRegistro.save();
                idsNuevosRegistros.push(nuevoRegistro._id);
            }
        }

        // Añadir las IDs de los nuevos registros a la jornada (si no están ya ahí)
        // Puedes querer evitar duplicados si la jornada ya tenía registros
        jornada.registros = [...new Set([...jornada.registros.map(r => r.toString()), ...idsNuevosRegistros.map(id => id.toString())])];
        // Convertir de vuelta a ObjectId para guardar
        jornada.registros = jornada.registros.map(id => new mongoose.Types.ObjectId(id));


        await jornada.save(); // Guarda la jornada con los nuevos registros

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
            // Manejar errores de validación de Mongoose
            const errors = {};
            for (let field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ msg: 'Error de validación', errors });
        }
        res.status(500).json({ error: 'Hubo un error al guardar la jornada completa' });
    }
};


// Función auxiliar para recalcular las horas de inicio, fin y el tiempo total de la jornada
// Se llama después de agregar/actualizar actividades en una jornada
async function recalcularHorasJornada(jornadaId) {
    const jornada = await Jornada.findById(jornadaId).populate('registros'); // Poblar registros para acceder a los tiempos
    if (!jornada) {
        console.error(`Jornada no encontrada con ID: ${jornadaId} al recalcular horas.`);
        return;
    }

    let minHoraInicio = null;
    let maxHoraFin = null;
    let totalTiempoAcumulado = 0; // Este es el campo 'totalTiempoActividades'

    if (jornada.registros && jornada.registros.length > 0) {
        const horasInicio = jornada.registros
            .map(registro => registro.horaInicio ? new Date(registro.horaInicio).getTime() : null)
            .filter(Boolean); // Filtrar valores nulos

        const horasFin = jornada.registros
            .map(registro => registro.horaFin ? new Date(registro.horaFin).getTime() : null)
            .filter(Boolean); // Filtrar valores nulos

        if (horasInicio.length > 0) {
            minHoraInicio = new Date(Math.min(...horasInicio));
        }
        if (horasFin.length > 0) {
            maxHoraFin = new Date(Math.max(...horasFin));
        }

        // Calcular el totalTiempoActividades sumando el 'tiempo' de cada registro
        totalTiempoAcumulado = jornada.registros.reduce((sum, registro) => {
            // Asegurarse de que registro.tiempo sea un número (en minutos)
            return sum + (registro.tiempo || 0);
        }, 0);
    }

    // Asignar los valores recalculados a la jornada
    jornada.horaInicio = minHoraInicio;
    jornada.horaFin = maxHoraFin;
    jornada.totalTiempoActividades = totalTiempoAcumulado; // <-- ¡Aquí se asigna el número!

    // Guardar los cambios en la base de datos
    await jornada.save({ validateBeforeSave: false }); // validateBeforeSave: false para evitar re-validar campos
                                                        // que no se están modificando explícitamente en este hook.
                                                        // O elimínalo si quieres que Mongoose valide todo el doc.
    console.log(`Horas y tiempo total de la jornada ${jornadaId} recalculadas: Inicio: ${jornada.horaInicio}, Fin: ${jornada.horaFin}, Total Actividades: ${jornada.totalTiempoActividades} minutos.`);
}