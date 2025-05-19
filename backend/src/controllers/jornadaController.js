const mongoose = require('mongoose');
const Produccion = require('../models/Produccion');
const Jornada = require('../models/Jornada');
const Operario = require('../models/Operario');


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
            registros: [] });

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
        const jornadas = await Jornada.find().populate('registros');
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

        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`Invalid Jornada ID: ${id}`);
            return res.status(400).json({ error: 'Jornada ID is invalid' });
        }
        // Fetch the Jornada and populate registros and their references
        const jornada = await Jornada.findById(id).populate({
            path: 'registros',
            populate: [
                { path: 'oti', select: 'numeroOti' },
                { path: 'proceso', select: 'nombre' },
                { path: 'areaProduccion', select: 'nombre' },
                { path: 'maquina', select: 'nombre' },
                { path: 'insumos', select: 'nombre' }
            ]
        });

        if (!jornada) {
            console.error(`Jornada not found for ID: ${id}`);
            return res.status(404).json({ error: 'Jornada not found' });
        }

        // Recalcular las horas de la jornada
        await recalcularHorasJornada(id);

        console.log(`Jornada fetched successfully:`, await Jornada.findById(id).populate({
            path: 'registros',
            populate: [
                { path: 'oti', select: 'numeroOti' },
                { path: 'proceso', select: 'nombre' },
                { path: 'areaProduccion', select: 'nombre' },
                { path: 'maquina', select: 'nombre' },
                { path: 'insumos', select: 'nombre' }
            ]
        }));
        res.status(200).json(await Jornada.findById(id).populate({
            path: 'registros',
            populate: [
                { path: 'oti', select: 'numeroOti' },
                { path: 'proceso', select: 'nombre' },
                { path: 'areaProduccion', select: 'nombre' },
                { path: 'maquina', select: 'nombre' },
                { path: 'insumos', select: 'nombre' }
            ]
        }));

    } catch (error) {
        console.error(`Error fetching Jornada with ID ${req.params.id}:`, error);
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
            populate: [
                { path: 'proceso', select: 'nombre' },
                { path: 'oti', select: 'numeroOti' }
            ]
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
        const { horaInicio, horaFin, registros } = req.body;
        
        // Validar ID de la jornada
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Jornada ID is invalid' });
        }
        
        const jornada = await Jornada.findByIdAndUpdate(
            id,
            { horaInicio, horaFin, registros },
            { new: true }
        );
        if (!jornada) {
            return res.status(404).json({ error: 'Jornada not found' });
        }

        // Recalcular las horas de la jornada después de la actualización
        await recalcularHorasJornada(id);

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
// Función auxiliar para recalcular las horas de inicio y fin de la jornada
async function recalcularHorasJornada(jornadaId) {
    const jornada = await Jornada.findById(jornadaId).populate('registros');
    if (!jornada) {
        console.error(`Jornada no encontrada con ID: ${jornadaId} al recalcular horas.`);
        return;
    }

    const horasInicio = jornada.registros.map(registro => registro.horaInicio).filter(Boolean);
    const horasFin = jornada.registros.map(registro => registro.horaFin).filter(Boolean);

    jornada.horaInicio = horasInicio.length > 0 ? new Date(Math.min(...horasInicio.map(h => new Date(h).getTime()))) : null;
    jornada.horaFin = horasFin.length > 0 ? new Date(Math.max(...horasFin.map(h => new Date(h).getTime()))) : null;

    await jornada.save();
    console.log(`Horas de la jornada ${jornadaId} recalculadas: Inicio: ${jornada.horaInicio}, Fin: ${jornada.horaFin}`);
}

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
        if (!operario || !fecha || !oti || !proceso || !areaProduccion || !maquina || !insumos || !tipoTiempo || !horaInicio || !horaFin) {
            return res.status(400).json({ error: 'Faltan campos requeridos para la actividad' });
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

        res.status(200).json({ msg: 'Actividad agregada con éxito', jornada: await Jornada.findById(jornadaId).populate('registros') });
              
    } catch (error) {
        console.error('Error al agregar actividad a la jornada:', error);
        res.status(500).json({ error: 'Hubo un error al agregar la actividad a la jornada' });
    }
};

