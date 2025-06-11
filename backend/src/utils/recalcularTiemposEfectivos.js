/**
 * Script para recalcular tiempos efectivos en jornadas existentes
 * Ejecutar este script después de aplicar los cambios al modelo de Jornada
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a la base de datos
const connectDB = require('../db/db');

// Modelos
const Jornada = require('../models/Jornada');
const Produccion = require('../models/Produccion');

async function recalcularTiemposJornadas() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await connectDB();
        
        console.log('📊 Obteniendo todas las jornadas...');
        const jornadas = await Jornada.find({}).populate('registros');
        
        console.log(`✅ Encontradas ${jornadas.length} jornadas para procesar`);
        
        let jornadasActualizadas = 0;
        let errores = 0;
        
        for (const jornada of jornadas) {
            try {
                console.log(`⚙️ Procesando jornada ${jornada._id} (${jornada.registros.length} registros)...`);
                
                // Guardar la jornada para activar el pre-save hook
                await jornada.save();
                
                jornadasActualizadas++;
                console.log(`✅ Jornada ${jornada._id} actualizada`);
                
                // Mostrar información del resultado
                if (jornada.totalTiempoActividades) {
                    const tiempo = jornada.totalTiempoActividades;
                    console.log(`   📈 Tiempo efectivo: ${tiempo.tiempoEfectivo || 0}min`);
                    console.log(`   📊 Tiempo sumado: ${tiempo.tiempoSumado || 0}min`);
                    console.log(`   ⚠️ Solapamientos: ${tiempo.solapamientos ? 'Sí' : 'No'}`);
                    if (tiempo.solapamientos && tiempo.tiempoSumado && tiempo.tiempoEfectivo) {
                        const diferencia = tiempo.tiempoSumado - tiempo.tiempoEfectivo;
                        console.log(`   🔄 Tiempo solapado: ${diferencia}min`);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Error procesando jornada ${jornada._id}:`, error.message);
                errores++;
            }
        }
        
        console.log('\n📋 Resumen del proceso:');
        console.log(`✅ Jornadas actualizadas: ${jornadasActualizadas}`);
        console.log(`❌ Errores: ${errores}`);
        console.log(`📊 Total procesadas: ${jornadas.length}`);
        
        // Mostrar estadísticas generales
        console.log('\n📊 Estadísticas de solapamientos:');
        const jornadasConSolapamientos = await Jornada.find({
            'totalTiempoActividades.solapamientos': true
        });
        
        console.log(`⚠️ Jornadas con solapamientos: ${jornadasConSolapamientos.length}/${jornadas.length}`);
        
        if (jornadasConSolapamientos.length > 0) {
            let tiempoTotalSolapado = 0;
            for (const jornada of jornadasConSolapamientos) {
                if (jornada.totalTiempoActividades?.tiempoSumado && jornada.totalTiempoActividades?.tiempoEfectivo) {
                    tiempoTotalSolapado += jornada.totalTiempoActividades.tiempoSumado - jornada.totalTiempoActividades.tiempoEfectivo;
                }
            }
            console.log(`🔄 Tiempo total solapado recuperado: ${tiempoTotalSolapado} minutos (${Math.floor(tiempoTotalSolapado / 60)}h ${tiempoTotalSolapado % 60}m)`);
        }
        
        console.log('\n🎉 Proceso completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error fatal durante el proceso:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Conexión a base de datos cerrada');
    }
}

// Ejecutar el script solo si es llamado directamente
if (require.main === module) {
    console.log('🚀 Iniciando recálculo de tiempos efectivos en jornadas...');
    recalcularTiemposJornadas();
}

module.exports = { recalcularTiemposJornadas };
