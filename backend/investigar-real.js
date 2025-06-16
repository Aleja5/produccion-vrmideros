require('dotenv').config();
const mongoose = require('mongoose');
const Jornada = require('./src/models/Jornada');
const Produccion = require('./src/models/Produccion');
const Operario = require('./src/models/Operario');

async function investigarBaseDatos() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a la base de datos');
    
    console.log('\n=== INVESTIGANDO OPERARIOS ===');
    const operarios = await Operario.find({});
    console.log(`Total operarios: ${operarios.length}`);
    
    for (const operario of operarios) {
      console.log(`- ID: ${operario._id}`);
      console.log(`  Nombre: ${operario.nombre || operario.name || 'Sin nombre'}`);
      console.log(`  Documento: ${operario.documento || 'Sin documento'}`);
      console.log('---');
    }
    
    // Buscar el operario Alejandra
    const alejandra = operarios.find(o => 
      (o.nombre && o.nombre.toLowerCase().includes('alejandra')) || 
      (o.name && o.name.toLowerCase().includes('alejandra'))
    );
    
    if (!alejandra) {
      console.log('❌ No se encontró operario Alejandra');
      mongoose.disconnect();
      return;
    }
    
    console.log(`\n✅ Operario Alejandra encontrado: ${alejandra.nombre || alejandra.name} (${alejandra._id})`);
    
    console.log('\n=== INVESTIGANDO ACTIVIDADES DE ALEJANDRA ===');
    const actividades = await Produccion.find({ operario: alejandra._id }).sort({ fecha: -1 });
    console.log(`Total actividades: ${actividades.length}`);
    
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    
    console.log(`\nActividades de hoy (${hoy.toLocaleDateString()}):`);
    const actividadesHoy = actividades.filter(a => {
      const fechaActividad = new Date(a.fecha);
      return fechaActividad.toDateString() === hoy.toDateString();
    });
    
    console.log(`Total actividades de hoy: ${actividadesHoy.length}`);
    for (const act of actividadesHoy) {
      console.log(`  - ${act._id}: ${act.fecha} (proceso: ${act.procesos})`);
    }
    
    console.log(`\nActividades de ayer (${ayer.toLocaleDateString()}):`);
    const actividadesAyer = actividades.filter(a => {
      const fechaActividad = new Date(a.fecha);
      return fechaActividad.toDateString() === ayer.toDateString();
    });
    
    console.log(`Total actividades de ayer: ${actividadesAyer.length}`);
    for (const act of actividadesAyer) {
      console.log(`  - ${act._id}: ${act.fecha} (proceso: ${act.procesos})`);
    }
    
    console.log('\n=== INVESTIGANDO JORNADAS DE ALEJANDRA ===');
    const jornadas = await Jornada.find({ operario: alejandra._id }).sort({ fecha: -1 });
    console.log(`Total jornadas: ${jornadas.length}`);
    
    for (const jornada of jornadas) {
      const fechaJornada = new Date(jornada.fecha);
      console.log(`\n📅 Jornada ${jornada._id}:`);
      console.log(`   Fecha: ${fechaJornada.toLocaleDateString()} (${jornada.fecha})`);
      console.log(`   Actividades en jornada: ${jornada.actividades ? jornada.actividades.length : 0}`);
      console.log(`   Registros en jornada: ${jornada.registros ? jornada.registros.length : 0}`);
        // Verificar cada actividad
      if (jornada.actividades && jornada.actividades.length > 0) {
        for (const actId of jornada.actividades) {
          const actividad = await Produccion.findById(actId);
          if (actividad) {
            const fechaAct = new Date(actividad.fecha);
            const coincide = fechaAct.toDateString() === fechaJornada.toDateString();
            console.log(`     ✓ ${actId}: ${fechaAct.toLocaleDateString()} ${coincide ? '✅' : '❌ NO COINCIDE'}`);
          } else {
            console.log(`     ❌ ${actId}: ACTIVIDAD NO EXISTE`);
          }
        }
      } else {
        console.log(`     (Sin actividades en jornada.actividades)`);
      }
      
      // También verificar registros si existe el campo
      if (jornada.registros && jornada.registros.length > 0) {
        console.log(`   Registros en jornada: ${jornada.registros.length}`);
        for (const regId of jornada.registros) {
          const actividad = await Produccion.findById(regId);
          if (actividad) {
            const fechaAct = new Date(actividad.fecha);
            const coincide = fechaAct.toDateString() === fechaJornada.toDateString();
            console.log(`     📝 ${regId}: ${fechaAct.toLocaleDateString()} ${coincide ? '✅' : '❌ NO COINCIDE'}`);
          } else {
            console.log(`     ❌ ${regId}: REGISTRO NO EXISTE`);
          }
        }
      }
    }
    
    // Detectar duplicaciones
    console.log('\n=== DETECTANDO DUPLICACIONES ===');
    const fechasAgrupadas = {};
    
    for (const jornada of jornadas) {
      const fechaStr = new Date(jornada.fecha).toDateString();
      if (!fechasAgrupadas[fechaStr]) {
        fechasAgrupadas[fechaStr] = [];
      }
      fechasAgrupadas[fechaStr].push(jornada);
    }
    
    for (const [fecha, jornadasDelDia] of Object.entries(fechasAgrupadas)) {
      if (jornadasDelDia.length > 1) {
        console.log(`🚨 DUPLICACIÓN en ${fecha}: ${jornadasDelDia.length} jornadas`);
        for (const jornada of jornadasDelDia) {
          console.log(`   - Jornada ${jornada._id}: ${jornada.actividades.length} actividades`);
        }
      }
    }
    
    // Buscar actividades huérfanas
    console.log('\n=== BUSCANDO ACTIVIDADES HUÉRFANAS ===');
    let huerfanas = 0;
    
    for (const actividad of actividades) {
      const jornadaConActividad = await Jornada.findOne({ 
        operario: alejandra._id,
        actividades: actividad._id 
      });
      
      if (!jornadaConActividad) {
        huerfanas++;
        console.log(`🚨 HUÉRFANA: ${actividad._id} - fecha ${actividad.fecha}`);
      }
    }
    
    console.log(`\nTotal actividades huérfanas: ${huerfanas}`);
    
    mongoose.disconnect();
    console.log('\n✅ Investigación completada');
    
  } catch (error) {
    console.error('❌ Error en la investigación:', error);
    mongoose.disconnect();
  }
}

investigarBaseDatos();
