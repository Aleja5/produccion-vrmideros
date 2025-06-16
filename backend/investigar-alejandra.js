const mongoose = require('mongoose');
require('dotenv').config();

async function investigarProblemaEdicion() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        const Produccion = require('./src/models/Produccion');
        const Jornada = require('./src/models/Jornada');
        const Operario = require('./src/models/Operario');
        
        // Buscar el operario Alejandra Castellanos
        const alejandra = await Operario.findOne({ name: /Alejandra.*Castellanos/i });
        
        if (!alejandra) {
            console.log('❌ No se encontró el operario Alejandra Castellanos');
            mongoose.disconnect();
            return;
        }
        
        console.log(`✅ Operario encontrado: ${alejandra.name} (ID: ${alejandra._id})`);
        
        // Buscar TODAS las actividades del operario
        const actividades = await Produccion.find({
            operario: alejandra._id
        }).sort({ fecha: 1 });
        
        console.log(`\n=== ACTIVIDADES DE ${alejandra.name} ===`);
        actividades.forEach((act, i) => {
            console.log(`${i+1}. ID: ${act._id}`);
            console.log(`   Fecha: ${new Date(act.fecha).toLocaleDateString('es-ES')}`);
            console.log(`   Fecha completa: ${act.fecha}`);
            console.log(`   Tiempo: ${act.tiempo} min`);
            console.log(`   OTI: ${act.oti || 'Sin OTI'}`);
            console.log('---');
        });
        
        // Buscar jornadas del operario
        const jornadas = await Jornada.find({ 
            operario: alejandra._id 
        }).sort({ fecha: 1 });
        
        console.log(`\n=== JORNADAS DE ${alejandra.name} ===`);
        jornadas.forEach((jornada, i) => {
            console.log(`${i+1}. Fecha: ${new Date(jornada.fecha).toLocaleDateString('es-ES')}`);
            console.log(`   Fecha completa: ${jornada.fecha}`);
            console.log(`   Registros: ${jornada.registros?.length || 0}`);
            console.log(`   IDs de actividades: [${jornada.registros?.join(', ') || 'ninguno'}]`);
            console.log('---');
        });
        
        // Verificar inconsistencias
        console.log('\n=== VERIFICACIÓN DE CONSISTENCIA ===');
        
        for (const jornada of jornadas) {
            const fechaJornada = new Date(jornada.fecha).toLocaleDateString('es-ES');
            console.log(`\n🗓️ Jornada del ${fechaJornada}:`);
            
            if (jornada.registros && jornada.registros.length > 0) {
                for (const registroId of jornada.registros) {
                    const actividad = actividades.find(a => a._id.toString() === registroId.toString());
                    if (actividad) {
                        const fechaActividad = new Date(actividad.fecha).toLocaleDateString('es-ES');
                        if (fechaActividad !== fechaJornada) {
                            console.log(`   ❌ PROBLEMA: Actividad ${actividad._id} tiene fecha ${fechaActividad} pero está en jornada ${fechaJornada}`);
                        } else {
                            console.log(`   ✅ OK: Actividad ${actividad._id} está en la jornada correcta (${fechaActividad})`);
                        }
                    } else {
                        console.log(`   ⚠️ ADVERTENCIA: Registro ${registroId} en jornada pero no encontrado en actividades`);
                    }
                }
            } else {
                console.log(`   📭 Jornada vacía`);
            }
        }
        
        // Buscar actividades que podrían estar "huérfanas" (no en ninguna jornada)
        console.log('\n=== VERIFICACIÓN DE ACTIVIDADES HUÉRFANAS ===');
        for (const actividad of actividades) {
            let encontrada = false;
            for (const jornada of jornadas) {
                if (jornada.registros && jornada.registros.includes(actividad._id)) {
                    encontrada = true;
                    break;
                }
            }
            if (!encontrada) {
                console.log(`⚠️ ACTIVIDAD HUÉRFANA: ${actividad._id} (${new Date(actividad.fecha).toLocaleDateString('es-ES')}) no está en ninguna jornada`);
            }
        }
        
        mongoose.disconnect();
        console.log('\n🔍 Investigación completada');
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
    }
}

investigarProblemaEdicion();
