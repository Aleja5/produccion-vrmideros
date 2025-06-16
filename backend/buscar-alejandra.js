const mongoose = require('mongoose');
const { normalizarFecha, fechaAString } = require('./src/utils/manejoFechas');

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/gestion_produccion')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

const Jornada = require('./src/models/Jornada');
const Produccion = require('./src/models/Produccion');
const Oti = require('./src/models/Oti');
const Operario = require('./src/models/Operario');

async function buscarActividadAlejandra() {
    try {
        console.log('=== BUSCANDO ACTIVIDADES DE ALEJANDRA ===\n');

        // Buscar el operario Alejandra
        const alejandra = await Operario.findOne({ name: /Alejandra/i });
        if (!alejandra) {
            console.log('❌ No se encontró operario Alejandra');
            return;
        }
        
        console.log(`✅ Encontrado operario: ${alejandra.name} (ID: ${alejandra._id})`);

        // Buscar TODAS las actividades de Alejandra ordenadas por fecha de creación
        console.log('\n🔍 Buscando todas las actividades de Alejandra...');
        const actividades = await Produccion.find({ operario: alejandra._id })
            .sort({ _id: -1 }) // Más recientes primero
            .populate('oti', 'numeroOti');

        console.log(`\n📊 Total de actividades encontradas: ${actividades.length}`);
        
        if (actividades.length === 0) {
            console.log('No hay actividades para este operario');
            return;
        }

        console.log('\n📋 DETALLE DE TODAS LAS ACTIVIDADES:');
        actividades.forEach((actividad, index) => {
            const fechaCreacion = actividad._id.getTimestamp();
            const minutosHace = Math.floor((new Date() - fechaCreacion) / (1000 * 60));
            
            console.log(`\n${index + 1}. OTI: ${actividad.oti?.numeroOti || 'N/A'}`);
            console.log(`   ID: ${actividad._id}`);
            console.log(`   Fecha guardada: ${fechaAString(actividad.fecha)}`);
            console.log(`   Fecha/hora completa: ${actividad.fecha}`);
            console.log(`   Creada hace: ${minutosHace} minutos (${fechaCreacion})`);
            console.log(`   Hora inicio: ${actividad.horaInicio}`);
            console.log(`   Hora fin: ${actividad.horaFin}`);
        });

        // Analizar las actividades más recientes
        console.log('\n🔍 ANÁLISIS DE ACTIVIDADES RECIENTES:');
        const ahora = new Date();
        const ultimosMinutos = actividades.filter(act => {
            const fechaCreacion = act._id.getTimestamp();
            const minutos = (ahora - fechaCreacion) / (1000 * 60);
            return minutos <= 10; // Últimos 10 minutos
        });

        console.log(`Actividades creadas en los últimos 10 minutos: ${ultimosMinutos.length}`);
        
        ultimosMinutos.forEach(act => {
            const fechaAct = fechaAString(act.fecha);
            const hoy = fechaAString(normalizarFecha(new Date()));
            const ayer = fechaAString(new Date(new Date().setDate(new Date().getDate() - 1)));
            
            console.log(`\n🕐 Actividad reciente:`);
            console.log(`   OTI: ${act.oti?.numeroOti || 'N/A'}`);
            console.log(`   Fecha guardada: ${fechaAct}`);
            console.log(`   ¿Es hoy (${hoy})? ${fechaAct === hoy ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   ¿Es ayer (${ayer})? ${fechaAct === ayer ? '⚠️ SÍ - PROBLEMA!' : '✅ NO'}`);
        });

        // Buscar jornadas de Alejandra
        console.log('\n📅 JORNADAS DE ALEJANDRA:');
        const jornadas = await Jornada.find({ operario: alejandra._id })
            .sort({ fecha: -1 });

        jornadas.forEach((jornada, index) => {
            console.log(`${index + 1}. Fecha: ${fechaAString(jornada.fecha)}, Registros: ${jornada.registros.length}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

buscarActividadAlejandra();
