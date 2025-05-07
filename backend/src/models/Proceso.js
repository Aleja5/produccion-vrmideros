const mongoose = require ('mongoose');

const procesoSchema = new mongoose.Schema({
    nombre: {type: String, required: true, unique:true},
}, {timestamps:true});

module.exports = mongoose.model('Proceso', procesoSchema, "procesos");