/**
 * Utilidad para calcular tiempo efectivo eliminando solapamientos
 * Esta función combina intervalos de tiempo solapados para obtener el tiempo real trabajado
 */

/**
 * Calcula el tiempo efectivo a partir de una lista de actividades
 * @param {Array} actividades - Array de objetos con horaInicio, horaFin y tiempo
 * @returns {Object} - Objeto completo con información de tiempo
 */
function calcularTiempoEfectivo(actividades) {
    console.log('🔍 calcularTiempoEfectivo - Actividades recibidas:', actividades.length);
    console.log('📋 Detalle de actividades:', actividades.map(a => ({
        _id: a._id,
        tiempo: a.tiempo,
        horaInicio: a.horaInicio,
        horaFin: a.horaFin,
        tipoTiempo: a.tipoTiempo
    })));
    
    if (!actividades || actividades.length === 0) {
        return {
            tiempoEfectivoMinutos: 0,
            tiempoRangoMinutos: 0,
            tiempoSumadoMinutos: 0,
            horaInicio: null,
            horaFin: null,
            solapamientos: false,
            intervalos: [],
            estadisticas: {
                totalActividades: 0,
                actividadesConHorario: 0,
                intervalosUnificados: 0,
                diferenciaSolapamiento: 0
            }
        };
    }    // Filtrar actividades que tienen horarios válidos
    const actividadesConHorario = actividades.filter(actividad => {
        const tieneHorarios = actividad.horaInicio && actividad.horaFin;
        const inicio = tieneHorarios ? new Date(actividad.horaInicio) : null;
        const fin = tieneHorarios ? new Date(actividad.horaFin) : null;
        
        // Verificar si es válido - permitir actividades que cruzan medianoche
        let esValido = false;
        if (inicio && fin) {
            if (inicio < fin) {
                // Actividad normal (mismo día)
                esValido = true;
            } else if (inicio > fin) {
                // Posible actividad que cruza medianoche
                // Verificar que la diferencia de tiempo sea razonable (menos de 24 horas)
                const diferencia = fin.getTime() - inicio.getTime() + (24 * 60 * 60 * 1000); // Agregar 24 horas
                const horasDiferencia = diferencia / (1000 * 60 * 60);
                if (horasDiferencia > 0 && horasDiferencia <= 24) {
                    esValido = true;
                    console.log('🌙 Actividad que cruza medianoche detectada:', {
                        horaInicio: actividad.horaInicio,
                        horaFin: actividad.horaFin,
                        horasDiferencia: horasDiferencia.toFixed(2)
                    });
                }
            }
        }
        
        if (!esValido && tieneHorarios) {
            console.log('⚠️ Actividad con horario inválido:', {
                horaInicio: actividad.horaInicio,
                horaFin: actividad.horaFin,
                tiempo: actividad.tiempo,
                inicioDate: inicio,
                finDate: fin
            });
        }
        
        return esValido;
    });

    console.log(`📊 Actividades con horario válido: ${actividadesConHorario.length}/${actividades.length}`);

    // Calcular tiempo sumado (suma simple de todos los tiempos)
    const tiempoSumadoMinutos = actividades.reduce((total, actividad) => {
        console.log(`➕ Sumando tiempo: ${actividad.tiempo} min (Total actual: ${total})`);
        return total + (actividad.tiempo || 0);
    }, 0);

    console.log(`🧮 Tiempo total sumado: ${tiempoSumadoMinutos} minutos (${Math.floor(tiempoSumadoMinutos / 60)}h ${tiempoSumadoMinutos % 60}m)`);

    if (actividadesConHorario.length === 0) {
        return {
            tiempoEfectivoMinutos: 0,
            tiempoRangoMinutos: 0,
            tiempoSumadoMinutos,
            horaInicio: null,
            horaFin: null,
            solapamientos: false,
            intervalos: [],
            estadisticas: {
                totalActividades: actividades.length,
                actividadesConHorario: 0,
                intervalosUnificados: 0,
                diferenciaSolapamiento: tiempoSumadoMinutos
            }
        };
    }    // Convertir actividades a intervalos de tiempo
    const intervalos = actividadesConHorario.map(actividad => {
        const inicio = new Date(actividad.horaInicio);
        const fin = new Date(actividad.horaFin);
        
        let duracionCalculada;
        let finAjustado = fin.getTime();
        
        // Manejar actividades que cruzan medianoche
        if (fin.getTime() < inicio.getTime()) {
            // La actividad cruza medianoche, agregar 24 horas al fin
            finAjustado = fin.getTime() + (24 * 60 * 60 * 1000);
            duracionCalculada = Math.round((finAjustado - inicio.getTime()) / (1000 * 60));
            console.log(`🌙 Actividad que cruza medianoche ${actividad._id}: ${inicio.toLocaleTimeString()} - ${fin.toLocaleTimeString()} (+1 día), Duración calculada: ${duracionCalculada}min, Tiempo registrado: ${actividad.tiempo}min`);
        } else {
            duracionCalculada = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60));
            console.log(`⏱️ Actividad ${actividad._id}: ${inicio.toLocaleTimeString()} - ${fin.toLocaleTimeString()}, Duración calculada: ${duracionCalculada}min, Tiempo registrado: ${actividad.tiempo}min`);
        }
        
        return {
            inicio: inicio.getTime(),
            fin: finAjustado,
            duracion: actividad.tiempo || 0,
            actividad: actividad,
            cruzaMedianoche: fin.getTime() < inicio.getTime()
        };
    });

    // Ordenar intervalos por hora de inicio
    intervalos.sort((a, b) => a.inicio - b.inicio);

    // Encontrar hora de inicio y fin general
    const horaInicio = new Date(intervalos[0].inicio);
    const horaFin = new Date(intervalos[intervalos.length - 1].fin);

    // Calcular tiempo de rango (desde primera hora hasta última hora)
    const tiempoRangoMinutos = Math.round((horaFin.getTime() - horaInicio.getTime()) / (1000 * 60));

    console.log(`📅 Rango total: ${horaInicio.toLocaleTimeString()} - ${horaFin.toLocaleTimeString()} = ${tiempoRangoMinutos} minutos (${Math.floor(tiempoRangoMinutos / 60)}h ${tiempoRangoMinutos % 60}m)`);

    // Combinar intervalos solapados
    const intervalosCombinados = [];
    let intervaloActual = { ...intervalos[0] };

    for (let i = 1; i < intervalos.length; i++) {
        const siguienteIntervalo = intervalos[i];
        
        // Si hay solapamiento (el siguiente empieza antes de que termine el actual)
        if (siguienteIntervalo.inicio <= intervaloActual.fin) {
            console.log('🔄 Solapamiento detectado:', {
                actual: { inicio: new Date(intervaloActual.inicio), fin: new Date(intervaloActual.fin) },
                siguiente: { inicio: new Date(siguienteIntervalo.inicio), fin: new Date(siguienteIntervalo.fin) }
            });
            // Combinar intervalos - extender el fin si es necesario
            intervaloActual.fin = Math.max(intervaloActual.fin, siguienteIntervalo.fin);
        } else {
            // No hay solapamiento, agregar el intervalo actual y continuar con el siguiente
            intervalosCombinados.push(intervaloActual);
            intervaloActual = { ...siguienteIntervalo };
        }
    }
    
    // Agregar el último intervalo
    intervalosCombinados.push(intervaloActual);

    // Calcular tiempo efectivo (suma de intervalos combinados)
    const tiempoEfectivoMinutos = intervalosCombinados.reduce((total, intervalo) => {
        const duracion = Math.round((intervalo.fin - intervalo.inicio) / (1000 * 60)); // Convertir ms a minutos
        console.log(`🔗 Intervalo combinado: ${new Date(intervalo.inicio).toLocaleTimeString()} - ${new Date(intervalo.fin).toLocaleTimeString()} = ${duracion} min`);
        return total + duracion;
    }, 0);

    // Determinar si hubo solapamientos
    const solapamientos = intervalosCombinados.length < intervalos.length || tiempoEfectivoMinutos < tiempoSumadoMinutos;
    const diferenciaSolapamiento = tiempoSumadoMinutos - tiempoEfectivoMinutos;

    console.log('📊 Resultado final del cálculo:', {
        tiempoEfectivoMinutos: `${tiempoEfectivoMinutos} min (${Math.floor(tiempoEfectivoMinutos / 60)}h ${tiempoEfectivoMinutos % 60}m)`,
        tiempoRangoMinutos: `${tiempoRangoMinutos} min (${Math.floor(tiempoRangoMinutos / 60)}h ${tiempoRangoMinutos % 60}m)`,
        tiempoSumadoMinutos: `${tiempoSumadoMinutos} min (${Math.floor(tiempoSumadoMinutos / 60)}h ${tiempoSumadoMinutos % 60}m)`,
        solapamientos,
        diferenciaSolapamiento: `${diferenciaSolapamiento} min`
    });

    return {
        tiempoEfectivoMinutos,
        tiempoRangoMinutos,
        tiempoSumadoMinutos,
        horaInicio,
        horaFin,
        solapamientos,
        intervalos: intervalosCombinados.map(intervalo => ({
            inicio: new Date(intervalo.inicio),
            fin: new Date(intervalo.fin),
            duracion: Math.round((intervalo.fin - intervalo.inicio) / (1000 * 60))
        })),
        estadisticas: {
            totalActividades: actividades.length,
            actividadesConHorario: actividadesConHorario.length,
            intervalosUnificados: intervalosCombinados.length,
            diferenciaSolapamiento
        }
    };
}

/**
 * Función auxiliar para formatear tiempo en formato legible
 * @param {number} minutos - Tiempo en minutos
 * @returns {string} - Tiempo formateado (ej: "5h 30m")
 */
function formatearTiempo(minutos) {
    if (!minutos || minutos === 0) return "0m";
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas === 0) return `${mins}m`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
}

/**
 * Detecta intervalos específicos que se solapan
 * @param {Array} actividades - Array de actividades
 * @returns {Array} - Array de objetos describiendo los solapamientos
 */
function detectarSolapamientos(actividades) {
    const solapamientos = [];
    
    for (let i = 0; i < actividades.length; i++) {
        for (let j = i + 1; j < actividades.length; j++) {
            const act1 = actividades[i];
            const act2 = actividades[j];
            
            const inicio1 = new Date(act1.horaInicio).getTime();
            const fin1 = new Date(act1.horaFin).getTime();
            const inicio2 = new Date(act2.horaInicio).getTime();
            const fin2 = new Date(act2.horaFin).getTime();
            
            // Verificar si hay solapamiento
            if (inicio1 < fin2 && inicio2 < fin1) {
                const inicioSolapamiento = Math.max(inicio1, inicio2);
                const finSolapamiento = Math.min(fin1, fin2);
                const duracionSolapamiento = Math.round((finSolapamiento - inicioSolapamiento) / (1000 * 60));
                
                solapamientos.push({
                    actividad1: {
                        inicio: new Date(inicio1),
                        fin: new Date(fin1),
                        tiempo: act1.tiempo
                    },
                    actividad2: {
                        inicio: new Date(inicio2),
                        fin: new Date(fin2),
                        tiempo: act2.tiempo
                    },
                    solapamiento: {
                        inicio: new Date(inicioSolapamiento),
                        fin: new Date(finSolapamiento),
                        duracion: duracionSolapamiento
                    }
                });
            }
        }
    }
    
    return solapamientos;
}

module.exports = {
    calcularTiempoEfectivo,
    formatearTiempo,
    detectarSolapamientos
};
