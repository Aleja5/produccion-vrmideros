const mongoose = require('mongoose');
const { Schema } = mongoose;

const jornadaSchema = new Schema({
    operario: {
        type: Schema.Types.ObjectId,
        ref: 'Operario',
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    horaInicio: { // Agregamos horaInicio
        type: Date
    },
    horaFin: { // Agregamos horaFin
        type: Date
    },
    totalTiempoActividades: {
        type: Object,
        default: { horas: 0, minutos: 0 }
    },
    estado: {
        type: String,
        enum: ['en_progreso', 'completa'],
        default: 'en_progreso'
    },
    registros: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produccion'
        }
    ]
}, { timestamps: true });

jornadaSchema.pre('save', async function (next) {
    try {
        if (this.registros && this.registros.length > 0) {
            const Produccion = mongoose.model('Produccion');
            const registros = await Produccion.find({ _id: { $in: this.registros } });

            // Calcular horaInicio y horaFin de la jornada
            const horasInicio = registros.map(registro => registro.horaInicio).filter(Boolean);
            const horasFin = registros.map(registro => registro.horaFin).filter(Boolean);

            this.horaInicio = horasInicio.length > 0 ? new Date(Math.min(...horasInicio.map(h => h.getTime()))) : null;
            this.horaFin = horasFin.length > 0 ? new Date(Math.max(...horasFin.map(h => h.getTime()))) : null;

            // Calcular los tiempos totales en horas y minutos
            const totalMinutos = registros.reduce((total, registro) => {
                return total + (registro.tiempo || 0);
            }, 0);

            this.totalTiempoActividades = {
                horas: Math.floor(totalMinutos / 60),
                minutos: totalMinutos % 60
            };

        } else {
            this.totalTiempoActividades = { horas: 0, minutos: 0 };
            this.horaInicio = null;
            this.horaFin = null;
        }

        next();
    } catch (error) {
        next(error);
    }
});

const Jornada = mongoose.model("Jornada", jornadaSchema);
module.exports = Jornada;