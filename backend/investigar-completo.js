const mongoose = require('mongoose');
const Jornada = require('./src/models/Jornada');
const Produccion = require('./src/models/Produccion');
const Operario = require('./src/models/Operario');

mongoose.connect('mongodb://localhost:27017/ProyectoFinal');

async function investigar() {
  try {
    console.log('=== INVESTIGANDO OPERARIOS ===');
    
    // Buscar todos los operarios
    const operarios = await Operario.find({});
    console.log('Operarios encontrados:');
    for (const operario of operarios) {
      console.log(`- ID: ${operario._id}, Nombre: ${operario.nombre || operario.name || 'Sin nombre'}`);
    }
    
    // Buscar actividades por operario
    const operarioAlejandra = operarios.find(o => 
      (o.nombre && o.nombre.includes('Alejandra')) || 
      (o.name && o.name.includes('Alejandra'))
    );
    
    if (!operarioAlejandra) {
      console.log('No se encontró operario Alejandra');
      mongoose.disconnect();
      return;
    }
    
    console.log(`\n=== INVESTIGANDO ACTIVIDADES DE ${operarioAlejandra.nombre || operarioAlejandra.name} ===`);
    
    const actividades = await Produccion.find({ operario: operarioAlejandra._id }).sort({ fecha: -1 }).limit(10);
    console.log(`Total actividades encontradas: ${actividades.length}`);
    
    for (const actividad of actividades) {
      console.log(`- Actividad ${actividad._id}: fecha ${actividad.fecha}`);
    }
    
    console.log(`\n=== INVESTIGANDO JORNADAS DE ${operarioAlejandra.nombre || operarioAlejandra.name} ===`);
    
    const jornadas = await Jornada.find({ operario: operarioAlejandra._id }).sort({ fecha: -1 });
    console.log(`Total jornadas encontradas: ${jornadas.length}`);
    
    for (const jornada of jornadas) {
      console.log(`\nJornada ID: ${jornada._id}`);
      console.log(`Fecha: ${jornada.fecha}`);
      console.log(`Actividades: ${jornada.actividades.length}`);
      
      // Verificar si hay actividades en esta jornada
      for (const actId of jornada.actividades) {
        const actividad = await Produccion.findById(actId);
        if (actividad) {
          console.log(`  - Actividad válida: ${actId}`);
        } else {
          console.log(`  - Actividad INVÁLIDA: ${actId}`);
        }
      }
    }
    
    // Verificar duplicaciones por fecha
    console.log('\n=== VERIFICANDO DUPLICACIONES ===');
    const fechasAgrupadas = {};
    
    for (const jornada of jornadas) {
      const fechaStr = jornada.fecha.toISOString().split('T')[0];
      if (!fechasAgrupadas[fechaStr]) {
        fechasAgrupadas[fechaStr] = [];
      }
      fechasAgrupadas[fechaStr].push(jornada);
    }
    
    for (const [fecha, jornadasDelDia] of Object.entries(fechasAgrupadas)) {
      if (jornadasDelDia.length > 1) {
        console.log(`DUPLICACIÓN en ${fecha}: ${jornadasDelDia.length} jornadas`);
        for (const jornada of jornadasDelDia) {
          console.log(`  - Jornada ${jornada._id}: ${jornada.actividades.length} actividades`);
        }
      }
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

investigar();
