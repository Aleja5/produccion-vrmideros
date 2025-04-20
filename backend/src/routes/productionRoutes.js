const express = require('express');
const router = express.Router();
const { 
    registrarProduccion,
    obtenerProducciones,
    actualizarProduccion,
    eliminarProduccion,
    listarProduccion,
    buscarProduccion 
} = require('../controllers/productionController');
const AreaProduccion = require('../models/AreaProduccion');
const Maquina = require('../models/Maquina');
const Proceso = require('../models/Proceso');
const Operario = require('../models/Operario');
const Produccion = require('../models/Produccion');
const Oti = require('../models/Oti');

// 📌 Registrar Producción
router.post('/registrar', registrarProduccion);
    
// 📌 Obtener todas las producciones
router.get('/obtener', obtenerProducciones);

// 📌 Listar producciones con filtros
router.get('/filtrar', listarProduccion);

// 📌 Actualizar producción
router.put('/actualizar/:id', actualizarProduccion);

// 📌 Eliminar producción
router.delete('/eliminar/:id', eliminarProduccion);

// 📌 Buscar producción
router.get('/buscar-produccion', buscarProduccion);

// Endpoint para obtener registros de producción de un operario en un rango de fechas
router.get('/operario-produccion', async (req, res) => {
    try {
        const { operarioId, fechaInicio, fechaFin } = req.query;

        if (!operarioId || !fechaInicio || !fechaFin) {
            return res.status(400).json({ msg: 'Faltan parámetros requeridos: operarioId, fechaInicio, fechaFin' });
        }

        const producciones = await Produccion.find({
            operario: operarioId,
            fecha: {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin),
            },
        })
            .populate('oti', 'numeroOti')
            .populate('proceso', 'nombre')
            .populate('areaProduccion', 'nombre')
            .populate('maquina', 'nombre')
            .populate('operario', 'name');

        res.status(200).json(producciones);
    } catch (error) {
        console.error('Error al obtener registros de producción:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
});

// Endpoint para obtener la lista de operarios
router.get('/operarios', async (req, res) => {
    try {
        const operarios = await Operario.find({}, 'name _id'); // Selecciona solo los campos necesarios
        res.status(200).json(operarios);
    } catch (error) {
        console.error('Error al obtener la lista de operarios:', error);
        res.status(500).json({ msg: 'Error al obtener la lista de operarios' });
    }
});

// Endpoint para obtener todas las áreas de producción
router.get('/areas', async (req, res) => {
    try {
        const areas = await AreaProduccion.find({}, 'nombre');
        res.status(200).json(areas);
    } catch (error) {
        console.error('Error al obtener áreas de producción:', error);
        res.status(500).json({ msg: 'Error al obtener áreas de producción' });
    }
});

// Endpoint para obtener todas las máquinas
router.get('/maquinas', async (req, res) => {
    try {
        const maquinas = await Maquina.find({}, 'nombre');
        res.status(200).json(maquinas);
    } catch (error) {
        console.error('Error al obtener máquinas:', error);
        res.status(500).json({ msg: 'Error al obtener máquinas' });
    }
});

// Endpoint para obtener todos los procesos
router.get('/procesos', async (req, res) => {
    try {
        const procesos = await Proceso.find({}, 'nombre');
        res.status(200).json(procesos);
    } catch (error) {
        console.error('Error al obtener procesos:', error);
        res.status(500).json({ msg: 'Error al obtener procesos' });
    }
});

// Endpoint para obtener todos los operarios
router.get('/operarios', async (req, res) => {
    try {
        const operarios = await Operario.find({}, 'name');
        res.status(200).json(operarios);
    } catch (error) {
        console.error('Error al obtener operarios:', error);
        res.status(500).json({ msg: 'Error al obtener operarios' });
    }
});

// Endpoint general para filtrar producciones dinámicamente
router.get('/filtrar-producciones', async (req, res) => {
    try {
        const filtros = req.query;
        const query = {};

        // Construir la consulta dinámicamente según los filtros recibidos
        if (filtros.operario && filtros.operario.trim() !== '') {
            query.operario = filtros.operario;
        }
        if (filtros.area && filtros.area.trim() !== '') {
            query.areaProduccion = filtros.area;
        }
        if (filtros.maquina && filtros.maquina.trim() !== '') {
            query.maquina = filtros.maquina;
        }
        if (filtros.proceso && filtros.proceso.trim() !== '') {
            query.proceso = filtros.proceso;
        }
        if (filtros.fechaInicio && filtros.fechaFin) {
            query.fecha = {
                $gte: new Date(filtros.fechaInicio),
                $lte: new Date(filtros.fechaFin),
            };
        }
        if (filtros.oti && filtros.oti.trim() !== '') {
            try {
                const otiDoc = await Oti.findOne({ numeroOti: filtros.oti });
                if (otiDoc) {
                    query.oti = otiDoc._id;
                } else {
                    return res.status(404).json({ msg: 'OTI no encontrada' });
                }
            } catch (error) {
                console.error('Error al buscar OTI:', error);
                return res.status(500).json({ msg: 'Error al procesar el filtro OTI', error: error.message });
            }
        }

        // Permitir valores nulos o vacíos en los campos
        const producciones = await Produccion.find(query)
            .populate('oti', 'numeroOti')
            .populate('operario', 'name')
            .populate('proceso', 'nombre')
            .populate('areaProduccion', 'nombre')
            .populate('maquina', 'nombre');

        res.status(200).json(producciones);
    } catch (error) {
        console.error('Error al filtrar producciones:', error);
        res.status(500).json({ msg: 'Error al filtrar producciones', error: error.message });
    }
});

module.exports = router;