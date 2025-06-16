require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function probarRegistroHoy() {
  try {
    console.log('🔧 PROBANDO REGISTRO DE PRODUCCIÓN PARA HOY (14 de junio)');
    
    const baseURL = 'http://localhost:5000/api';
    const alejandraId = '681cebe0ef109ebe9e4f87de';
    
    // Simular datos que podrían venir del frontend
    const nuevaActividad = {
      operario: alejandraId,
      oti: 'TEST-001',
      procesos: ['6810e56a214405012831b334'],
      areaProduccion: '6810e536214405012831b329',
      maquina: '6810e568214405012831b333',
      insumos: ['6810e585214405012831b33b'],
      fecha: '2025-06-14', // Fecha de hoy como string simple
      tiempo: 180,
      horaInicio: '2025-06-14T08:00:00',
      horaFin: '2025-06-14T11:00:00',
      tipoTiempo: 'Operación',
      observaciones: 'Test para verificar fecha correcta'
    };
    
    console.log('📤 Enviando actividad con fecha:', nuevaActividad.fecha);
    
    try {
      const response = await axios.post(`${baseURL}/production`, nuevaActividad);
      console.log('✅ Actividad registrada exitosamente');
      console.log('📋 ID actividad creada:', response.data.produccion?._id);
      
      // Esperar un momento para que se procese
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar en qué jornada quedó
      console.log('\n🔍 Verificando jornadas de Alejandra...');
      const jornadasResponse = await axios.get(`${baseURL}/jornadas/operario/${alejandraId}`);
      
      console.log(`📅 Total jornadas: ${jornadasResponse.data.length}`);
      
      for (const jornada of jornadasResponse.data) {
        const fechaJornada = new Date(jornada.fecha);
        console.log(`\n📅 Jornada: ${fechaJornada.toLocaleDateString('es-CO')}`);
        console.log(`   Registros: ${jornada.registros ? jornada.registros.length : 0}`);
        
        // Verificar si nuestra actividad está en esta jornada
        if (jornada.registros && response.data.produccion?._id) {
          const tieneNuestraActividad = jornada.registros.some(reg => 
            (typeof reg === 'string' ? reg : reg._id) === response.data.produccion._id
          );
          
          if (tieneNuestraActividad) {
            console.log('   🎯 ¡ESTA JORNADA CONTIENE NUESTRA ACTIVIDAD!');
            
            if (fechaJornada.toDateString() === new Date('2025-06-14').toDateString()) {
              console.log('   ✅ CORRECTO: La actividad está en la jornada del 14 de junio');
            } else {
              console.log('   ❌ ERROR: La actividad NO está en la jornada correcta');
            }
          }
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Error del servidor:', error.response.status);
        console.log('📝 Mensaje:', error.response.data?.msg || error.response.data);
      } else {
        console.log('❌ Error de conexión:', error.message);
      }
    }
    
    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

probarRegistroHoy();
