const mongoose = require('mongoose');

const produccionSchema = new mongoose.Schema({
    oti: { type: mongoose.Schema.Types.ObjectId, ref: 'Oti', required: true },
    operario: { type: mongoose.Schema.Types.ObjectId, ref: 'Operario', required: true },
    fecha: { type: Date, default: Date.now, required: true },
    proceso: { type: mongoose.Schema.Types.ObjectId, ref: 'Proceso', required: true },
    areaProduccion: { type: mongoose.Schema.Types.ObjectId, ref: 'AreaProduccion', required: true },
    maquina: { type: mongoose.Schema.Types.ObjectId, ref: 'Maquina', required: true },
    tiempoPreparacion: {
        type: Number,
        required: true,
        min: [0, 'El tiempo de preparación no puede ser negativo'],
    },
    tiempoOperacion: {
        type: Number,
        required: true,
        min: [0, 'El tiempo de operación no puede ser negativo'],
    },
    observaciones: String,
}, { timestamps: true });

module.exports = mongoose.model('Produccion', produccionSchema,"registroProduccion");

 