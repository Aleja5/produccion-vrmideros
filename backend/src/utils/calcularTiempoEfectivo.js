/**
 * Calcula el tiempo efectivo de trabajo agrupando actividades y eliminando solapamientos
 * @param {Array} registros - Array de registros de producción
 * @returns {Object} - Objeto con información del tiempo calculado
 */
function calcularTiempoEfectivo(registros) {
    if (!registros || registros.length === 0) {
        return {
            horaInicio: null,
            horaFin: null,
            tiempoEfectivoMinutos: 0,
            tiempoRangoMinutos: 0,
            solapamientos: 0
        };
    }

    // Convertir registros a intervalos de tiempo
    const intervalos = registros
        .filter(registro => registro.horaInicio && registro.horaFin)
        .map(registro => ({
            inicio: new Date(registro.horaInicio),
            fin: new Date(registro.horaFin),
            duracion: registro.tiempo || 0,
            id: registro._id
        }))
        .sort((a, b) => a.inicio - b.inicio);

    if (intervalos.length === 0) {
        // Si no hay intervalos válidos, calcular basado en tiempos de duración
        const tiempoTotal = registros.reduce((total, registro) => total + (registro.tiempo || 0), 0);
        return {
            horaInicio: null,
            horaFin: null,
            tiempoEfectivoMinutos: tiempoTotal,
            tiempoRangoMinutos: tiempoTotal,
            solapamientos: 0
        };
    }

    // Fusionar intervalos solapados
    const intervalosConsolidados = [];
    let intervaloActual = intervalos[0];
    let solapamientos = 0;

    for (let i = 1; i < intervalos.length; i++) {
        const siguienteIntervalo = intervalos[i];

        // Si hay solapamiento
        if (intervaloActual.fin >= siguienteIntervalo.inicio) {
            solapamientos++;
            // Fusionar intervalos
            intervaloActual = {
                inicio: intervaloActual.inicio,
                fin: new Date(Math.max(intervaloActual.fin, siguienteIntervalo.fin)),
                duracion: intervaloActual.duracion + siguienteIntervalo.duracion
            };
        } else {
            // No hay solapamiento, guardar el actual y pasar al siguiente
            intervalosConsolidados.push(intervaloActual);
            intervaloActual = siguienteIntervalo;
        }
    }
    
    // Agregar el último intervalo
    intervalosConsolidados.push(intervaloActual);

    // Calcular tiempo efectivo (suma de intervalos consolidados)
    const tiempoEfectivoMinutos = intervalosConsolidados.reduce((total, intervalo) => {
        const duracionMinutos = (intervalo.fin - intervalo.inicio) / (1000 * 60);
        return total + duracionMinutos;
    }, 0);

    // Tiempo de rango (desde primera hora hasta última hora)
    const horaInicio = intervalosConsolidados[0].inicio;
    const horaFin = intervalosConsolidados[intervalosConsolidados.length - 1].fin;
    const tiempoRangoMinutos = (horaFin - horaInicio) / (1000 * 60);

    return {
        horaInicio,
        horaFin,
        tiempoEfectivoMinutos: Math.round(tiempoEfectivoMinutos),
        tiempoRangoMinutos: Math.round(tiempoRangoMinutos),
        solapamientos
    };
}

module.exports = {
    calcularTiempoEfectivo
};
