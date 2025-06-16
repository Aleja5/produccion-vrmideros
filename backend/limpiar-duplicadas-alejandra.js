require('dotenv').config();
const mongoose = require('mongoose');
const Jornada = require('./src/models/Jornada');
const Produccion = require('./src/models/Produccion');
const Operario = require('./src/models/Operario');

async function limpiarJornadasDuplicadasAlejandra() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a la base de datos');    // Buscar Alejandra directamente por ID (del script anterior)
    const alejandraId = '681cebe0ef109ebe9e4f87de';
    const alejandra = await Operario.findById(alejandraId);
    if (!alejandra) {
      console.log('❌ No se encontró operario Alejandra con ID:', alejandraId);
      mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Operario Alejandra encontrado: ${alejandra._id}`);
    
    // Buscar todas las jornadas de Alejandra
    const jornadas = await Jornada.find({ operario: alejandra._id }).sort({ fecha: 1 });
    console.log(`Total jornadas encontradas: ${jornadas.length}`);
    
    // Agrupar por fecha (día)
    const fechasAgrupadas = {};
    
    for (const jornada of jornadas) {
      const fechaStr = new Date(jornada.fecha).toDateString();
      if (!fechasAgrupadas[fechaStr]) {
        fechasAgrupadas[fechaStr] = [];
      }
      fechasAgrupadas[fechaStr].push(jornada);
    }
    
    // Procesar duplicaciones
    for (const [fecha, jornadasDelDia] of Object.entries(fechasAgrupadas)) {
      if (jornadasDelDia.length > 1) {
        console.log(`\n🔧 PROCESANDO DUPLICACIÓN en ${fecha}: ${jornadasDelDia.length} jornadas`);
        
        // Recopilar todos los registros únicos
        const todosLosRegistros = new Set();
        
        for (const jornada of jornadasDelDia) {
          console.log(`   - Jornada ${jornada._id}: ${jornada.registros ? jornada.registros.length : 0} registros`);
          if (jornada.registros) {
            for (const regId of jornada.registros) {
              todosLosRegistros.add(regId.toString());
            }
          }
        }
        
        console.log(`   Total registros únicos encontrados: ${todosLosRegistros.size}`);
        
        // Mantener la jornada con fecha más normalizada (medianoche)
        let jornadaPrincipal = jornadasDelDia[0];
        for (const jornada of jornadasDelDia) {
          const hora = new Date(jornada.fecha).getHours();
          if (hora === 0) { // Preferir la que está a medianoche
            jornadaPrincipal = jornada;
            break;
          }
        }
        
        console.log(`   Jornada principal elegida: ${jornadaPrincipal._id} (fecha: ${jornadaPrincipal.fecha})`);
        
        // Actualizar la jornada principal con todos los registros únicos
        const registrosArray = Array.from(todosLosRegistros);
        jornadaPrincipal.registros = registrosArray;
        
        // Normalizar fecha a medianoche
        const fechaNormalizada = new Date(jornadaPrincipal.fecha);
        fechaNormalizada.setHours(0, 0, 0, 0);
        jornadaPrincipal.fecha = fechaNormalizada;
        
        await jornadaPrincipal.save();
        console.log(`   ✅ Jornada principal actualizada con ${registrosArray.length} registros`);
        
        // Eliminar las jornadas duplicadas
        for (const jornada of jornadasDelDia) {
          if (jornada._id.toString() !== jornadaPrincipal._id.toString()) {
            console.log(`   🗑️ Eliminando jornada duplicada: ${jornada._id}`);
            await Jornada.findByIdAndDelete(jornada._id);
          }
        }
        
        // Verificar que todas las actividades de esta fecha apunten a la jornada principal
        const fechaInicio = new Date(fechaNormalizada);
        const fechaFin = new Date(fechaNormalizada);
        fechaFin.setHours(23, 59, 59, 999);
        
        const actividades = await Produccion.find({
          operario: alejandra._id,
          fecha: {
            $gte: fechaInicio,
            $lte: fechaFin
          }
        });
        
        console.log(`   🔍 Actividades encontradas para esta fecha: ${actividades.length}`);
        
        for (const actividad of actividades) {
          if (actividad.jornada && actividad.jornada.toString() !== jornadaPrincipal._id.toString()) {
            console.log(`   🔄 Actualizando actividad ${actividad._id} para apuntar a jornada principal`);
            actividad.jornada = jornadaPrincipal._id;
            await actividad.save();
          }
        }
        
        console.log(`   ✅ Duplicación resuelta para ${fecha}`);
      }
    }
    
    console.log('\n=== VERIFICACIÓN FINAL ===');
    
    // Verificar que no queden duplicaciones
    const jornadasFinales = await Jornada.find({ operario: alejandra._id }).sort({ fecha: 1 });
    console.log(`Jornadas finales: ${jornadasFinales.length}`);
    
    const fechasFinales = {};
    for (const jornada of jornadasFinales) {
      const fechaStr = new Date(jornada.fecha).toDateString();
      if (!fechasFinales[fechaStr]) {
        fechasFinales[fechaStr] = [];
      }
      fechasFinales[fechaStr].push(jornada);
    }
    
    let duplicacionesRestantes = 0;
    for (const [fecha, jornadasDelDia] of Object.entries(fechasFinales)) {
      if (jornadasDelDia.length > 1) {
        duplicacionesRestantes++;
        console.log(`❌ Aún hay duplicación en ${fecha}: ${jornadasDelDia.length} jornadas`);
      } else {
        console.log(`✅ ${fecha}: 1 jornada única`);
      }
    }
    
    if (duplicacionesRestantes === 0) {
      console.log('\n🎉 ¡Todas las duplicaciones han sido resueltas!');
    } else {
      console.log(`\n⚠️ Aún quedan ${duplicacionesRestantes} duplicaciones por resolver`);
    }
    
    mongoose.disconnect();
    console.log('✅ Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
    mongoose.disconnect();
  }
}

limpiarJornadasDuplicadasAlejandra();
