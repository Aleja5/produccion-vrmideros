const mongoose = require ('mongoose');

const procesoShema = new mongoose.Schema({
    nombre: {type: String, required: true, unique:true},
}, {timestamps:true});

module.exports = mongoose.model('Proceso', procesoShema, "procesos");