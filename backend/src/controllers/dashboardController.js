const Jornada = require('../models/Jornada');
const Produccion = require('../models/Produccion');
const Oti = require('../models/Oti');

// Controlador para obtener datos KPI para el dashboard
exports.getDashboardKpi = async (req, res) => {
    try {
        // Get current date components in local timezone
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed
        const day = now.getDate();

        // Construct today's date at UTC midnight
        const todayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

        // Construct tomorrow's date at UTC midnight
        const tomorrowUTC = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));        console.log('📅 Rango de fechas:', todayUTC, '->', tomorrowUTC);

        // Contar jornadas activas hoy (solo las que tienen actividades registradas)
        const jornadasHoy = await Jornada.countDocuments({
            fecha: { 
                $gte: todayUTC, 
                $lt: tomorrowUTC
            },
            registros: { $exists: true, $not: { $size: 0 } } // Solo jornadas con al menos un registro
        });

         console.log('✅ Jornadas activas hoy (con actividades):', jornadasHoy);

        // Obtener registros de producción de hoy
        const registrosHoy = await Produccion.find({
            fecha: { 
                $gte: todayUTC,
                $lt: tomorrowUTC
            }
        });

        console.log('✅ Producciones hoy:', registrosHoy.length);

        // Calcular minutos trabajados hoy
        const minutosHoy = registrosHoy.reduce((total, registro) => {
            return total + (registro.tiempo || 0);
        }, 0);

        console.log('⏱ Minutos trabajados:', minutosHoy);
    
        // Devolver los KPIs
        res.json({
            jornadasHoy,
            minutosHoy,
            registrosHoy: registrosHoy.length,
            
        });
    } catch (error) {
        console.error('Error al obtener KPIs del dashboard:', error);
        res.status(500).json({ mensaje: 'Error al obtener datos del dashboard' });
    }
};
