const mongoose = require('mongoose');
const { Schema } = mongoose; // Añade esto si no lo tienes

const produccionSchema = new mongoose.Schema({
    oti: { type: String, required: true }, // CAMBIO 1: De ObjectId a String
    operario: { type: Schema.Types.ObjectId, ref: 'Operario', required: true },
    // ELIMINA ESTA LÍNEA (CAMBIO 2): fecha: { type: Date, default: Date.now, required: true },
    proceso: { type: Schema.Types.ObjectId, ref: 'Proceso', required: true },
    areaProduccion: { type: Schema.Types.ObjectId, ref: 'AreaProduccion', required: true },
    maquina: { type: Schema.Types.ObjectId, ref: 'Maquina', required: true },
    insumos: { type: Schema.Types.ObjectId, ref: 'Insumo', required: true },
    // CAMBIO 3: Decide si 'jornada' es requerido o no, y si la referencia es 'Jornada' o 'JornadaProduccion'
    jornada: {type:mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: false}, // Sugerencia: ref a 'Jornada' y required: false
    // Si necesitas que cada actividad "sepa" a qué jornada pertenece para búsquedas directas,
    // entonces debes enviar el 'jornadaId' desde el frontend en 'actividadToSend'.

    tipoTiempo: { type: String, enum: ['Preparación', 'Operación', 'Alimentacion'], required: true },
    horaInicio: { type: Date, required: true },
    horaFin: { type: Date, required: true },
    tiempo: {type: Number, required: true},

    observaciones: String,
}, { timestamps: true });

// Asegúrate de que el nombre del modelo que usas en Jornada.js (ref: 'Produccion') coincida aquí.
module.exports = mongoose.model('Produccion', produccionSchema, "registroProduccion");