const mongoose = require('mongoose');
const { Schema } = mongoose;

const JornadaSchema = new Schema({
    operario: {
        type: Schema.Types.ObjectId,
        ref: 'Operario',
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    horaInicio: {
        type: Date,        
    },
    horaFin: {
        type: Date,        
    },
    observacionesJornada:{
        type:String
    },
    totalTiempoPreparacion: {
        type: Number,
        default: 0
    },
    totalTiempoOperacion: {
        type: Number,
        default: 0
    },
    totalTiempoActividades: {
        type: Number,
        default: 0
    },
    registros: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produccion'
        }
    ]
}, { timestamps: true });

JornadaSchema.pre('save', async function (next) {
    try {
        if (this.registros && this.registros.length > 0) {
            const Produccion = mongoose.model('Produccion');
            const registros = await Produccion.find({ _id: { $in: this.registros } });

            this.totalTiempoActividades = registros.reduce((total, registro) => {
                return total + (registro.tiempoOperacion || 0) + (registro.tiempoPreparacion || 0);
            }, 0);

            this.totalTiempoPreparacion = registros.reduce((total, registro) => {
                return total + (registro.tiempoPreparacion || 0);
            }, 0);

            this.totalTiempoOperacion = registros.reduce((total, registro) => {
                return total + (registro.tiempoOperacion || 0);
            }, 0);
        } else {
            this.totalTiempoActividades = 0;
            this.totalTiempoPreparacion = 0;
            this.totalTiempoOperacion = 0;
        }

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Jornada', JornadaSchema);