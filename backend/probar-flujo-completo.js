const mongoose = require('mongoose');
const { normalizarFecha, fechaAString, obtenerRangoDia } = require('./src/utils/manejoFechas');

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/gestion_produccion')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

const Jornada = require('./src/models/Jornada');
const Produccion = require('./src/models/Produccion');
const Oti = require('./src/models/Oti');

async function probarFlujoCRUDCompleto() {
    try {
        console.log('=== PRUEBA COMPLETA DE FLUJO FRONTEND-BACKEND ===\n');

        const operarioAlejandra = '673c1234567890abcdef0002'; // ID de Alejandra

        // 1. SIMULAR REGISTRO DESDE FRONTEND (como si fuera hoy 14 de junio)
        console.log('📱 1. SIMULANDO REGISTRO DESDE FRONTEND');
        const fechaFrontend = new Date().toISOString().split('T')[0];
        console.log('   Fecha que envía el frontend:', fechaFrontend);

        // Crear actividad de prueba
        const datosJornada = {
            operario: operarioAlejandra,
            fecha: fechaFrontend,
            horaInicio: `${fechaFrontend}T13:00:00.000Z`,
            horaFin: `${fechaFrontend}T22:00:00.000Z`,
            actividades: [{
                oti: 'OTI-PRUEBA-FINAL',
                areaProduccion: '673c1234567890abcdef5678',
                maquina: '673c1234567890abcdef9012',
                procesos: ['673c1234567890abcdef3456'],
                insumos: [],
                tipoTiempo: 'Operación',
                horaInicio: `${fechaFrontend}T14:00:00.000Z`,
                horaFin: `${fechaFrontend}T16:00:00.000Z`,
                tiempo: 120,
                observaciones: 'Prueba final del flujo corregido'
            }]
        };

        // 2. SIMULAR PROCESAMIENTO EN BACKEND CORREGIDO
        console.log('\n🖥️ 2. PROCESANDO EN BACKEND (CON CORRECCIONES)');
        const fechaNormalizada = normalizarFecha(datosJornada.fecha);
        console.log('   Fecha normalizada:', fechaAString(fechaNormalizada));

        // Verificar si ya existe OTI
        let oti = await Oti.findOne({ numeroOti: datosJornada.actividades[0].oti });
        if (!oti) {
            oti = new Oti({ numeroOti: datosJornada.actividades[0].oti });
            await oti.save();
            console.log('   OTI creado:', oti.numeroOti);
        }

        // Buscar o crear jornada
        let jornada = await Jornada.findOne({ 
            operario: operarioAlejandra, 
            fecha: fechaNormalizada 
        });

        if (!jornada) {
            jornada = new Jornada({
                operario: operarioAlejandra,
                fecha: fechaNormalizada,
                horaInicio: datosJornada.horaInicio,
                horaFin: datosJornada.horaFin,
                registros: []
            });
            console.log('   Nueva jornada creada');
        } else {
            console.log('   Jornada existente encontrada');
        }

        // Crear actividad
        const nuevaActividad = new Produccion({
            operario: jornada.operario,
            fecha: jornada.fecha, // Usar la fecha de la jornada (normalizada)
            oti: oti._id,
            procesos: datosJornada.actividades[0].procesos,
            areaProduccion: datosJornada.actividades[0].areaProduccion,
            maquina: datosJornada.actividades[0].maquina,
            insumos: datosJornada.actividades[0].insumos,
            tipoTiempo: datosJornada.actividades[0].tipoTiempo,
            horaInicio: datosJornada.actividades[0].horaInicio,
            horaFin: datosJornada.actividades[0].horaFin,
            tiempo: datosJornada.actividades[0].tiempo,
            observaciones: datosJornada.actividades[0].observaciones,
            jornada: jornada._id
        });

        await nuevaActividad.save();
        jornada.registros.push(nuevaActividad._id);
        await jornada.save();

        console.log('   ✅ Actividad registrada con ID:', nuevaActividad._id);
        console.log('   ✅ Fecha de actividad guardada:', fechaAString(nuevaActividad.fecha));

        // 3. SIMULAR CONSULTAS DESDE DIFERENTES VISTAS
        console.log('\n🔍 3. SIMULANDO CONSULTAS DESDE FRONTEND');

        // 3.1 Dashboard - buscar actividades de hoy
        console.log('\n   🎛️ DASHBOARD - Actividades de hoy:');
        const rango = obtenerRangoDia(new Date());
        const actividadesDashboard = await Produccion.find({
            fecha: { $gte: rango.inicio, $lte: rango.fin }
        });
        console.log(`     Actividades encontradas: ${actividadesDashboard.length}`);
        actividadesDashboard.forEach(act => {
            console.log(`     - OTI: ${act.oti}, Fecha: ${fechaAString(act.fecha)}`);
        });

        // 3.2 MiJornada - buscar jornada de hoy
        console.log('\n   👤 MI JORNADA - Jornada de hoy:');
        const jornadaHoy = await Jornada.findOne({
            operario: operarioAlejandra,
            fecha: { $gte: rango.inicio, $lte: rango.fin }
        }).populate('registros');
        
        if (jornadaHoy) {
            console.log(`     ✅ Jornada encontrada: ${fechaAString(jornadaHoy.fecha)}`);
            console.log(`     Actividades: ${jornadaHoy.registros.length}`);
        } else {
            console.log('     ❌ No se encontró jornada para hoy');
        }

        // 3.3 Historial - buscar por fecha específica
        console.log('\n   📜 HISTORIAL - Búsqueda por fecha específica:');
        const fechaBusqueda = fechaAString(fechaNormalizada);
        const rangoHistorial = obtenerRangoDia(fechaBusqueda);
        const jornadaHistorial = await Jornada.find({
            operario: operarioAlejandra,
            fecha: { $gte: rangoHistorial.inicio, $lte: rangoHistorial.fin }
        }).populate('registros');

        console.log(`     Búsqueda para fecha: ${fechaBusqueda}`);
        console.log(`     Jornadas encontradas: ${jornadaHistorial.length}`);

        // 3.4 RegistroProduccion - Resumen para fecha
        console.log('\n   ✏️ REGISTRO PRODUCCIÓN - Resumen para fecha:');
        const actividadesResumen = await Produccion.find({
            operario: operarioAlejandra,
            fecha: { $gte: rangoHistorial.inicio, $lte: rangoHistorial.fin }
        });
        console.log(`     Actividades en resumen: ${actividadesResumen.length}`);

        // 4. VERIFICACIÓN FINAL
        console.log('\n✅ 4. VERIFICACIÓN FINAL');
        console.log(`   Fecha enviada por frontend: ${fechaFrontend}`);
        console.log(`   Fecha normalizada en backend: ${fechaAString(fechaNormalizada)}`);
        console.log(`   Fecha guardada en actividad: ${fechaAString(nuevaActividad.fecha)}`);
        console.log(`   ¿Las fechas coinciden? ${fechaFrontend === fechaAString(fechaNormalizada) ? '✅ SÍ' : '❌ NO'}`);

        console.log('\n🎯 RESUMEN FINAL:');
        console.log(`   - Dashboard encontró: ${actividadesDashboard.length} actividades`);
        console.log(`   - MiJornada encontró: ${jornadaHoy ? '1 jornada' : '0 jornadas'}`);
        console.log(`   - Historial encontró: ${jornadaHistorial.length} jornadas`);
        console.log(`   - Resumen encontró: ${actividadesResumen.length} actividades`);

        if (actividadesDashboard.length > 0 && jornadaHoy && jornadaHistorial.length > 0 && actividadesResumen.length > 0) {
            console.log('\n🎉 ¡TODAS LAS VISTAS ENCUENTRAN LA ACTIVIDAD CORRECTAMENTE!');
        } else {
            console.log('\n⚠️ Algunas vistas no están encontrando la actividad');
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    } finally {
        mongoose.connection.close();
    }
}

probarFlujoCRUDCompleto();
