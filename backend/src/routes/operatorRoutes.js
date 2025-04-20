const express = require('express');
const { validateCedula } = require('../controllers/operatorController');
const Operario = require('../models/Operario');

const router = express.Router();

// Ruta para validar cédula
router.post('/validate-cedula', validateCedula);

// Ruta para buscar operarios por nombre
router.get('/buscar/operario', async (req, res) => {
    try {
        const { nombre } = req.query;
        const operarios = await Operario.find({ name: { $regex: nombre, $options: 'i' } });
        if (operarios.length === 0) {
            return res.status(404).json({ msg: 'No se encontraron operarios con ese nombre' });
        }
        res.status(200).json(operarios);
    } catch (error) {
        console.error('Error al buscar operarios:', error);
        res.status(500).json({ msg: 'Error al buscar operarios', error: error.message });
    }
});

module.exports = router;