require('dotenv').config();
const mongoose = require('mongoose');
const { normalizarFecha } = require('./src/utils/manejoFechas');

async function probarNormalizacionFechas() {
  try {
    console.log('🔍 PROBANDO NORMALIZACIÓN DE FECHAS PARA HOY (14 de junio)');
    
    // Simular diferentes formatos de fecha que podrían llegar del frontend
    const fechasTest = [
      '2025-06-14',
      '2025-06-14T00:00:00.000Z',
      '2025-06-14T05:00:00.000Z', // UTC que equivale a medianoche Colombia
      '2025-06-14T23:59:59.000Z',
      new Date('2025-06-14'),
      new Date('2025-06-14T00:00:00'),
      new Date() // Fecha actual
    ];
    
    console.log('\n=== RESULTADOS DE NORMALIZACIÓN ===');
    
    for (let i = 0; i < fechasTest.length; i++) {
      const fechaOriginal = fechasTest[i];
      try {
        const fechaNormalizada = normalizarFecha(fechaOriginal);
        
        console.log(`\n${i + 1}. Fecha original: ${fechaOriginal}`);
        console.log(`   Tipo: ${typeof fechaOriginal}`);
        console.log(`   Normalizada: ${fechaNormalizada}`);
        console.log(`   Día: ${fechaNormalizada.getDate()}`);
        console.log(`   Mes: ${fechaNormalizada.getMonth() + 1}`);
        console.log(`   Año: ${fechaNormalizada.getFullYear()}`);
        console.log(`   toDateString(): ${fechaNormalizada.toDateString()}`);
        console.log(`   toLocaleDateString(): ${fechaNormalizada.toLocaleDateString('es-CO')}`);
        
        // Verificar que sea medianoche
        const esMedianoche = fechaNormalizada.getHours() === 0 && 
                            fechaNormalizada.getMinutes() === 0 && 
                            fechaNormalizada.getSeconds() === 0;
        console.log(`   ¿Es medianoche? ${esMedianoche ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Probar búsqueda por rango
    console.log('\n=== PRUEBA DE BÚSQUEDA POR RANGO ===');
    const fechaHoy = normalizarFecha('2025-06-14');
    const inicioDia = new Date(fechaHoy);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fechaHoy);
    finDia.setHours(23, 59, 59, 999);
    
    console.log(`Fecha normalizada: ${fechaHoy}`);
    console.log(`Inicio del día: ${inicioDia}`);
    console.log(`Fin del día: ${finDia}`);
    
    // Verificar que diferentes horas del mismo día estén en el rango
    const horasTest = [
      new Date('2025-06-14T00:00:00'),
      new Date('2025-06-14T08:30:00'),
      new Date('2025-06-14T15:45:00'),
      new Date('2025-06-14T23:59:59')
    ];
    
    console.log('\n--- Verificación de rango ---');
    for (const hora of horasTest) {
      const enRango = hora >= inicioDia && hora <= finDia;
      console.log(`${hora.toLocaleString('es-CO')} - ${enRango ? '✅ En rango' : '❌ Fuera de rango'}`);
    }
    
    console.log('\n✅ Pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

probarNormalizacionFechas();
