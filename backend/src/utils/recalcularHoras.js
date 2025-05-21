const Jornada = require('../models/Jornada');

// Recalcular la horaInicio y horaFin basados en los registros de producción
const recalcularHorasJornada = async (jornadaId) => {
    try {
        const jornada = await Jornada.findById(jornadaId).populate('registros');
        if (!jornada || !jornada.registros.length) {
            // Si no hay registros, limpia las horas
            await Jornada.findByIdAndUpdate(jornadaId, {
                horaInicio: null,
                horaFin: null
            });
            return;
        }

        const horasInicio = jornada.registros.map(r => r.horaInicio).filter(Boolean);
        const horasFin = jornada.registros.map(r => r.horaFin).filter(Boolean);

        const nuevaHoraInicio = horasInicio.length > 0 ? new Date(Math.min(...horasInicio.map(h => new Date(h).getTime()))) : null;
        const nuevaHoraFin = horasFin.length > 0 ? new Date(Math.max(...horasFin.map(h => new Date(h).getTime()))) : null;

        const cambios =
            (jornada.horaInicio?.getTime() || null) !== (nuevaHoraInicio?.getTime() || null) ||
            (jornada.horaFin?.getTime() || null) !== (nuevaHoraFin?.getTime() || null);

        if (cambios) {
            await Jornada.findByIdAndUpdate(jornadaId, {
                horaInicio: nuevaHoraInicio,
                horaFin: nuevaHoraFin
            });
            console.log(`⏱ Jornada ${jornadaId} actualizada con nuevas horas.`);
        }

    } catch (error) {
        console.error(`🚨 Error al recalcular horas de la jornada ${jornadaId}:`, error);
    }
};

module.exports = recalcularHorasJornada;
