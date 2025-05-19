const express = require('express');
const router = express.Router();
const jornadaController = require('../controllers/jornadaController');


// 📌 registro de produccion en jornada
router.post('/', jornadaController.crearJornada); // Para crear la jornada inicial
router.post('/:jornadaId/actividades', jornadaController.agregarActividadAJornada); // Para agregar una actividad a una jornada existente
router.get('/operario/:id', jornadaController.obtenerJornadasPorOperario);
router.get('/', jornadaController.obtenerJornadas);
router.get('/:id', jornadaController.obtenerJornada);
router.put('/:id', jornadaController.actualizarJornada);
router.delete('/:id', jornadaController.eliminarJornada);

module.exports = router;