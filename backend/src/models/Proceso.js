const mongoose = require ('mongoose');

const procesoSchema = new mongoose.Schema({
    nombre: {type: String, required: true, unique:true},
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AreaProduccion', required: false } 
}, {timestamps:true});

module.exports = mongoose.model('Proceso', procesoSchema, "procesos");