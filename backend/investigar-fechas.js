const mongoose = require('mongoose');
require('dotenv').config();

// Importar los modelos
const Produccion = require('./src/models/Produccion');
const Jornada = require('./src/models/Jornada');

async function investigarProblemaFechas() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔍 Conectado a MongoDB para investigar el problema de fechas\n');

        // 1. Buscar una actividad específica del problema mencionado
        console.log('=== INVESTIGACIÓN DETALLADA ===\n');
        
        const actividadProblema = await Produccion.findById('6848821ce6758ad03b6cabf0');
        
        if (actividadProblema) {
            console.log('📋 ACTIVIDAD PROBLEMÁTICA:');
            console.log(`   ID: ${actividadProblema._id}`);
            console.log(`   Fecha cruda: ${actividadProblema.fecha}`);
            console.log(`   Fecha ISO: ${actividadProblema.fecha.toISOString()}`);
            console.log(`   Fecha local: ${actividadProblema.fecha.toLocaleDateString()}`);
            console.log(`   UTC vs Local: UTC=${actividadProblema.fecha.getUTCDate()}/${actividadProblema.fecha.getUTCMonth()+1}, Local=${actividadProblema.fecha.getDate()}/${actividadProblema.fecha.getMonth()+1}`);
            console.log(`   Timezone offset: ${actividadProblema.fecha.getTimezoneOffset()} minutos\n`);
        } else {
            console.log('❌ No se encontró la actividad específica\n');
        }

        // 2. Buscar la jornada del 8/6/2025
        const fechaJornada = new Date('2025-06-08');
        fechaJornada.setUTCHours(0, 0, 0, 0);
        
        const jornada8Junio = await Jornada.findOne({ fecha: fechaJornada });
        
        if (jornada8Junio) {
            console.log('📅 JORNADA DEL 8 DE JUNIO:');
            console.log(`   ID: ${jornada8Junio._id}`);
            console.log(`   Fecha cruda: ${jornada8Junio.fecha}`);
            console.log(`   Fecha ISO: ${jornada8Junio.fecha.toISOString()}`);
            console.log(`   Fecha local: ${jornada8Junio.fecha.toLocaleDateString()}`);
            console.log(`   Número de registros: ${jornada8Junio.registros.length}\n`);
            
            // Verificar fechas de todas las actividades en esta jornada
            console.log('🔍 FECHAS DE ACTIVIDADES EN ESTA JORNADA:');
            for (let i = 0; i < Math.min(5, jornada8Junio.registros.length); i++) {
                const actividadId = jornada8Junio.registros[i];
                const actividad = await Produccion.findById(actividadId);
                if (actividad) {
                    console.log(`   Actividad ${actividadId}:`);
                    console.log(`     - Fecha actividad: ${actividad.fecha.toLocaleDateString()}`);
                    console.log(`     - Fecha jornada: ${jornada8Junio.fecha.toLocaleDateString()}`);
                    console.log(`     - ¿Coinciden? ${actividad.fecha.toLocaleDateString() === jornada8Junio.fecha.toLocaleDateString() ? '✅' : '❌'}`);
                }
            }
        }

        // 3. Analizar patrón general
        console.log('\n=== ANÁLISIS DE PATRÓN GENERAL ===');
        
        const todasJornadas = await Jornada.find().sort({ fecha: 1 }).limit(10);
        
        for (const jornada of todasJornadas) {
            const fechaJornada = jornada.fecha.toLocaleDateString();
            let problemasEncontrados = 0;
            
            // Revisar las primeras 3 actividades de cada jornada
            for (let i = 0; i < Math.min(3, jornada.registros.length); i++) {
                const actividad = await Produccion.findById(jornada.registros[i]);
                if (actividad) {
                    const fechaActividad = actividad.fecha.toLocaleDateString();
                    if (fechaActividad !== fechaJornada) {
                        problemasEncontrados++;
                    }
                }
            }
            
            console.log(`📅 Jornada ${fechaJornada}: ${problemasEncontrados > 0 ? '❌' : '✅'} (${problemasEncontrados} problemas de ${Math.min(3, jornada.registros.length)} actividades revisadas)`);
        }

        // 4. Verificar cómo se están creando las fechas
        console.log('\n=== ANÁLISIS DE CREACIÓN DE FECHAS ===');
        
        const fechaTest = new Date('2025-06-09');
        console.log(`Fecha test '2025-06-09':`);
        console.log(`  - toString(): ${fechaTest.toString()}`);
        console.log(`  - toISOString(): ${fechaTest.toISOString()}`);
        console.log(`  - toLocaleDateString(): ${fechaTest.toLocaleDateString()}`);
        console.log(`  - getDate(): ${fechaTest.getDate()}`);
        console.log(`  - getUTCDate(): ${fechaTest.getUTCDate()}`);
        
        const fechaTestUTC = new Date('2025-06-09T00:00:00.000Z');
        console.log(`\nFecha test UTC '2025-06-09T00:00:00.000Z':`);
        console.log(`  - toString(): ${fechaTestUTC.toString()}`);
        console.log(`  - toISOString(): ${fechaTestUTC.toISOString()}`);
        console.log(`  - toLocaleDateString(): ${fechaTestUTC.toLocaleDateString()}`);
        console.log(`  - getDate(): ${fechaTestUTC.getDate()}`);
        console.log(`  - getUTCDate(): ${fechaTestUTC.getUTCDate()}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

investigarProblemaFechas();
