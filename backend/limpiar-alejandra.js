const mongoose = require('mongoose');
require('dotenv').config();

async function limpiarInconsistenciasAlejandra() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🧹 Conectado a MongoDB para limpiar inconsistencias');
        
        const Produccion = require('./src/models/Produccion');
        const Jornada = require('./src/models/Jornada');
        const Operario = require('./src/models/Operario');
        const { normalizarFecha } = require('./src/utils/manejoFechas');
        
        // Buscar el operario Alejandra Castellanos
        const alejandra = await Operario.findOne({ name: /Alejandra.*Castellanos/i });
        
        if (!alejandra) {
            console.log('❌ No se encontró el operario Alejandra Castellanos');
            mongoose.disconnect();
            return;
        }
        
        console.log(`✅ Operario encontrado: ${alejandra.name} (ID: ${alejandra._id})`);
        
        // 1. ELIMINAR jornadas vacías
        console.log('\n=== PASO 1: ELIMINANDO JORNADAS VACÍAS ===');
        const jornadasVacias = await Jornada.find({
            operario: alejandra._id,
            $or: [
                { registros: { $size: 0 } },
                { registros: { $exists: false } },
                { registros: null }
            ]
        });
        
        for (const jornada of jornadasVacias) {
            console.log(`🗑️ Eliminando jornada vacía: ${new Date(jornada.fecha).toLocaleDateString('es-ES')} (${jornada.fecha})`);
            await Jornada.findByIdAndDelete(jornada._id);
        }
        
        // 2. CONSOLIDAR jornadas duplicadas del mismo día
        console.log('\n=== PASO 2: CONSOLIDANDO JORNADAS DUPLICADAS ===');
        
        // Obtener todas las jornadas restantes de Alejandra
        const jornadas = await Jornada.find({ operario: alejandra._id });
        
        // Agrupar por fecha normalizada
        const jornadasPorFecha = {};
        
        for (const jornada of jornadas) {
            const fechaNormalizada = normalizarFecha(jornada.fecha);
            const claveDate = fechaNormalizada.toDateString();
            
            if (!jornadasPorFecha[claveDate]) {
                jornadasPorFecha[claveDate] = [];
            }
            jornadasPorFecha[claveDate].push(jornada);
        }
        
        // Procesar cada grupo de jornadas del mismo día
        for (const [fechaStr, jornadasDelDia] of Object.entries(jornadasPorFecha)) {
            if (jornadasDelDia.length > 1) {
                console.log(`📅 Consolidando ${jornadasDelDia.length} jornadas del ${new Date(fechaStr).toLocaleDateString('es-ES')}`);
                
                // Combinar todos los registros únicos
                const registrosCombinados = new Set();
                const fechaNormalizada = normalizarFecha(jornadasDelDia[0].fecha);
                
                for (const jornada of jornadasDelDia) {
                    if (jornada.registros) {
                        jornada.registros.forEach(registro => registrosCombinados.add(registro.toString()));
                    }
                }
                
                // Eliminar todas las jornadas existentes de este día
                for (const jornada of jornadasDelDia) {
                    console.log(`   🗑️ Eliminando jornada duplicada: ${jornada.fecha}`);
                    await Jornada.findByIdAndDelete(jornada._id);
                }
                
                // Crear una nueva jornada consolidada con fecha normalizada
                const nuevaJornada = new Jornada({
                    operario: alejandra._id,
                    fecha: fechaNormalizada,
                    registros: Array.from(registrosCombinados),
                    totalTiempoActividades: { horas: 0, minutos: 0 }
                });
                
                await nuevaJornada.save();
                console.log(`   ✅ Jornada consolidada creada con ${registrosCombinados.size} actividades`);
            } else {
                // Si solo hay una jornada, asegurar que tenga fecha normalizada
                const jornada = jornadasDelDia[0];
                const fechaNormalizada = normalizarFecha(jornada.fecha);
                
                if (jornada.fecha.getTime() !== fechaNormalizada.getTime()) {
                    console.log(`🔧 Normalizando fecha de jornada: ${jornada.fecha} -> ${fechaNormalizada}`);
                    jornada.fecha = fechaNormalizada;
                    await jornada.save();
                }
            }
        }
        
        // 3. VERIFICACIÓN FINAL
        console.log('\n=== PASO 3: VERIFICACIÓN FINAL ===');
        
        const jornadasFinales = await Jornada.find({ operario: alejandra._id }).sort({ fecha: 1 });
        const actividades = await Produccion.find({ operario: alejandra._id }).sort({ fecha: 1 });
        
        console.log(`📊 Resultado:`);
        console.log(`   • ${actividades.length} actividades`);
        console.log(`   • ${jornadasFinales.length} jornadas`);
        
        // Verificar consistencia
        let problemasEncontrados = 0;
        for (const jornada of jornadasFinales) {
            const fechaJornada = new Date(jornada.fecha).toLocaleDateString('es-ES');
            console.log(`\n🗓️ Jornada del ${fechaJornada} (${jornada.registros?.length || 0} actividades):`);
            
            if (jornada.registros) {
                for (const registroId of jornada.registros) {
                    const actividad = actividades.find(a => a._id.toString() === registroId.toString());
                    if (actividad) {
                        const fechaActividad = new Date(actividad.fecha).toLocaleDateString('es-ES');
                        if (fechaActividad !== fechaJornada) {
                            console.log(`   ❌ PROBLEMA: Actividad ${actividad._id} tiene fecha ${fechaActividad} pero está en jornada ${fechaJornada}`);
                            problemasEncontrados++;
                        } else {
                            console.log(`   ✅ OK: Actividad ${actividad._id} (${fechaActividad})`);
                        }
                    } else {
                        console.log(`   ⚠️ Actividad ${registroId} no encontrada`);
                        problemasEncontrados++;
                    }
                }
            }
        }
        
        console.log(`\n🎯 RESULTADO FINAL: ${problemasEncontrados === 0 ? '✅ TODO CORRECTO' : `❌ ${problemasEncontrados} problemas encontrados`}`);
        
        mongoose.disconnect();
        console.log('🔍 Limpieza completada');
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
    }
}

limpiarInconsistenciasAlejandra();
