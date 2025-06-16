// Script de prueba para verificar que el cambio de fecha de actividades funciona correctamente
const axios = require('axios');

const baseURL = 'http://localhost:3001/api'; // Ajusta la URL según tu configuración

async function testFechaCambio() {
    try {
        console.log('🧪 Iniciando prueba de cambio de fecha de actividades...\n');

        // 1. Primero obtener un operario existente
        console.log('1️⃣ Obteniendo operarios disponibles...');
        const operariosResponse = await axios.get(`${baseURL}/operarios`);
        
        if (!operariosResponse.data || operariosResponse.data.length === 0) {
            console.log('❌ No hay operarios disponibles para la prueba');
            return;
        }

        const operario = operariosResponse.data[0];
        console.log(`✅ Usando operario: ${operario.name} (ID: ${operario._id})\n`);

        // 2. Obtener jornadas del operario antes de la prueba
        console.log('2️⃣ Obteniendo jornadas existentes...');
        const jornadasAntes = await axios.get(`${baseURL}/jornadas/operario/${operario._id}`);
        console.log(`📊 Jornadas encontradas antes: ${jornadasAntes.data.length}`);
        
        // Mostrar actividades por fecha
        const actividadesPorFecha = {};
        jornadasAntes.data.forEach(jornada => {
            const fecha = new Date(jornada.fecha).toISOString().split('T')[0];
            actividadesPorFecha[fecha] = jornada.registros ? jornada.registros.length : 0;
        });
        
        console.log('📅 Distribución de actividades por fecha (ANTES):');
        Object.entries(actividadesPorFecha).forEach(([fecha, count]) => {
            console.log(`   ${fecha}: ${count} actividades`);
        });
        console.log();

        // 3. Crear una actividad de prueba para hoy
        const hoy = new Date().toISOString().split('T')[0];
        const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        console.log('3️⃣ Verificando si existe alguna actividad para modificar...');
        
        let actividadParaModificar = null;
        
        // Buscar una actividad existente en las jornadas de hoy
        const jornadaHoy = jornadasAntes.data.find(j => {
            const fechaJornada = new Date(j.fecha).toISOString().split('T')[0];
            return fechaJornada === hoy && j.registros && j.registros.length > 0;
        });

        if (jornadaHoy && jornadaHoy.registros.length > 0) {
            actividadParaModificar = jornadaHoy.registros[0];
            console.log(`✅ Encontrada actividad para modificar: ${actividadParaModificar._id}`);
        } else {
            console.log('ℹ️ No se encontró ninguna actividad de hoy para modificar');
            console.log('   Para probar esta funcionalidad, necesitas:');
            console.log('   1. Crear una actividad para hoy');
            console.log('   2. Luego editarla y cambiar su fecha a ayer');
            console.log('   3. Verificar que aparezca solo en la fecha correcta');
            return;
        }

        // 4. Simular cambio de fecha de la actividad
        console.log(`\n4️⃣ Simulando cambio de fecha de actividad ${actividadParaModificar._id}...`);
        console.log(`   Cambiando fecha de ${hoy} a ${ayer}`);

        const datosActualizados = {
            _id: actividadParaModificar._id,
            operario: actividadParaModificar.operario._id || actividadParaModificar.operario,
            oti: actividadParaModificar.oti ? 
                 (actividadParaModificar.oti.numeroOti || actividadParaModificar.oti) : 
                 'TEST-001',
            procesos: actividadParaModificar.procesos ? 
                     actividadParaModificar.procesos.map(p => p._id || p) : 
                     [],
            areaProduccion: actividadParaModificar.areaProduccion._id || actividadParaModificar.areaProduccion,
            maquina: actividadParaModificar.maquina._id || actividadParaModificar.maquina,
            insumos: actividadParaModificar.insumos ? 
                    actividadParaModificar.insumos.map(i => i._id || i) : 
                    [],
            fecha: ayer, // ⭐ CAMBIO DE FECHA
            tiempo: actividadParaModificar.tiempo || 60,
            horaInicio: actividadParaModificar.horaInicio,
            horaFin: actividadParaModificar.horaFin,
            tipoTiempo: actividadParaModificar.tipoTiempo || 'Operación',
            observaciones: actividadParaModificar.observaciones || 'Prueba de cambio de fecha'
        };

        try {
            const updateResponse = await axios.put(
                `${baseURL}/produccion/actualizar/${actividadParaModificar._id}`, 
                datosActualizados
            );
            console.log('✅ Actividad actualizada exitosamente');
        } catch (updateError) {
            console.log('❌ Error al actualizar actividad:', updateError.response?.data || updateError.message);
            return;
        }

        // 5. Verificar que las jornadas se actualizaron correctamente
        console.log('\n5️⃣ Verificando actualización de jornadas...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar un poco

        const jornadasDespues = await axios.get(`${baseURL}/jornadas/operario/${operario._id}`);
        
        // Mostrar nueva distribución
        const nuevaDistribucion = {};
        jornadasDespues.data.forEach(jornada => {
            const fecha = new Date(jornada.fecha).toISOString().split('T')[0];
            nuevaDistribucion[fecha] = jornada.registros ? jornada.registros.length : 0;
        });
        
        console.log('📅 Distribución de actividades por fecha (DESPUÉS):');
        Object.entries(nuevaDistribucion).forEach(([fecha, count]) => {
            console.log(`   ${fecha}: ${count} actividades`);
        });

        // 6. Verificar que la actividad NO aparece duplicada
        console.log('\n6️⃣ Verificando que no hay duplicación...');
        
        let actividadEnHoy = false;
        let actividadEnAyer = false;
        
        jornadasDespues.data.forEach(jornada => {
            const fechaJornada = new Date(jornada.fecha).toISOString().split('T')[0];
            const actividades = jornada.registros || [];
            
            actividades.forEach(actividad => {
                if (actividad._id === actividadParaModificar._id) {
                    if (fechaJornada === hoy) {
                        actividadEnHoy = true;
                    }
                    if (fechaJornada === ayer) {
                        actividadEnAyer = true;
                    }
                }
            });
        });

        console.log(`🔍 Actividad ${actividadParaModificar._id}:`);
        console.log(`   ¿Aparece en ${hoy}? ${actividadEnHoy ? '❌ SÍ (PROBLEMA)' : '✅ NO'}`);
        console.log(`   ¿Aparece en ${ayer}? ${actividadEnAyer ? '✅ SÍ' : '❌ NO (PROBLEMA)'}`);

        if (!actividadEnHoy && actividadEnAyer) {
            console.log('\n🎉 ¡PRUEBA EXITOSA! La actividad se movió correctamente sin duplicarse.');
        } else if (actividadEnHoy && actividadEnAyer) {
            console.log('\n⚠️ PROBLEMA DETECTADO: La actividad aparece duplicada en ambas fechas.');
        } else if (actividadEnHoy && !actividadEnAyer) {
            console.log('\n⚠️ PROBLEMA DETECTADO: La actividad no se movió a la nueva fecha.');
        } else {
            console.log('\n❌ PROBLEMA GRAVE: La actividad desapareció completamente.');
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.data);
        }
    }
}

// Ejecutar la prueba
if (require.main === module) {
    testFechaCambio();
}

module.exports = { testFechaCambio };
