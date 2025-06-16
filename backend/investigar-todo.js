const mongoose = require('mongoose');
const Jornada = require('./src/models/Jornada');
const Produccion = require('./src/models/Produccion');
const Operario = require('./src/models/Operario');

mongoose.connect('mongodb://localhost:27017/ProyectoFinal');

async function investigarTodo() {
  try {
    console.log('=== INVESTIGANDO TODOS LOS OPERARIOS ===');
    
    const operarios = await Operario.find({});
    console.log(`Total operarios: ${operarios.length}`);
    
    for (const operario of operarios) {
      console.log(`- ID: ${operario._id}`);
      console.log(`  Nombre: ${operario.nombre || operario.name || 'Sin nombre'}`);
      console.log(`  Documento: ${operario.documento || 'Sin documento'}`);
      console.log(`  Email: ${operario.email || 'Sin email'}`);
      console.log('---');
    }
    
    console.log('\n=== INVESTIGANDO TODAS LAS ACTIVIDADES ===');
    
    const actividades = await Produccion.find({}).sort({ fecha: -1 }).limit(20);
    console.log(`Total actividades (últimas 20): ${actividades.length}`);
    
    for (const actividad of actividades) {
      console.log(`- Actividad ${actividad._id}: operario ${actividad.operario}, fecha ${actividad.fecha}`);
    }
    
    console.log('\n=== INVESTIGANDO TODAS LAS JORNADAS ===');
    
    const jornadas = await Jornada.find({}).sort({ fecha: -1 }).limit(10);
    console.log(`Total jornadas (últimas 10): ${jornadas.length}`);
    
    for (const jornada of jornadas) {
      console.log(`- Jornada ${jornada._id}: operario ${jornada.operario}, fecha ${jornada.fecha}, actividades: ${jornada.actividades.length}`);
    }
    
    // Verificar actividades huérfanas
    console.log('\n=== VERIFICANDO ACTIVIDADES HUÉRFANAS ===');
    let huerfanas = 0;
    
    for (const actividad of actividades) {
      const jornadaConActividad = await Jornada.findOne({ 
        actividades: actividad._id 
      });
      
      if (!jornadaConActividad) {
        huerfanas++;
        console.log(`HUÉRFANA: ${actividad._id} - fecha ${actividad.fecha}`);
      }
    }
    
    console.log(`Total actividades huérfanas encontradas: ${huerfanas}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

investigarTodo();
