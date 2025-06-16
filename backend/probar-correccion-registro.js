const mongoose = require('mongoose');
const { normalizarFecha, fechaAString } = require('./src/utils/manejoFechas');

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/gestion_produccion')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

const Jornada = require('./src/models/Jornada');
const Produccion = require('./src/models/Produccion');

async function pruebaRegistroActividad() {
    try {
        console.log('=== PRUEBA DE REGISTRO DE ACTIVIDAD NUEVA ===\n');

        // Simular datos que enviaría el frontend para hoy (14 de junio)
        const fechaFrontend = new Date().toISOString().split('T')[0];
        console.log('📅 Fecha que enviaría el frontend:', fechaFrontend);

        // Simular normalización que ahora hace el backend corregido
        const fechaNormalizada = normalizarFecha(fechaFrontend);
        console.log('🔄 Fecha normalizada en backend:', fechaAString(fechaNormalizada));

        // Buscar operario de Alejandra
        const operarioAlejandra = '673c1234567890abcdef0002'; // ID de Alejandra de scripts anteriores

        // Crear datos de prueba simulando lo que llegaría del frontend
        const datosJornada = {
            operario: operarioAlejandra,
            fecha: fechaFrontend, // Esto es lo que llega del frontend
            horaInicio: `${fechaFrontend}T13:00:00.000Z`, // 8:00 AM Colombia
            horaFin: `${fechaFrontend}T22:00:00.000Z`,    // 5:00 PM Colombia
            actividades: [{
                oti: 'OTI-PRUEBA-14JUNIO',
                areaProduccion: '673c1234567890abcdef5678',
                maquina: '673c1234567890abcdef9012',
                procesos: ['673c1234567890abcdef3456'],
                insumos: [],
                tipoTiempo: 'Productivo',
                horaInicio: `${fechaFrontend}T14:00:00.000Z`, // 9:00 AM Colombia
                horaFin: `${fechaFrontend}T16:00:00.000Z`,    // 11:00 AM Colombia
                tiempo: 120,
                observaciones: 'Actividad de prueba para el 14 de junio'
            }]
        };

        console.log('📤 Simulando llamada al backend con datos:');
        console.log('- Fecha original:', datosJornada.fecha);
        console.log('- Hora inicio jornada:', datosJornada.horaInicio);
        console.log('- Hora inicio actividad:', datosJornada.actividades[0].horaInicio);

        // Simular lo que hace el backend corregido
        console.log('\n🔄 Procesamiento en backend:');
        const fechaBackendNormalizada = normalizarFecha(datosJornada.fecha);
        console.log('- Fecha que se guardará:', fechaAString(fechaBackendNormalizada));

        // Verificar si ya existe una jornada para hoy
        console.log('\n🔍 Verificando jornadas existentes para hoy...');
        const jornadasHoy = await Jornada.find({
            operario: operarioAlejandra,
            fecha: fechaBackendNormalizada
        });

        console.log(`📊 Jornadas encontradas para ${fechaAString(fechaBackendNormalizada)}: ${jornadasHoy.length}`);

        if (jornadasHoy.length > 0) {
            console.log('📋 Jornadas existentes:');
            for (const jornada of jornadasHoy) {
                console.log(`  - ID: ${jornada._id}, Fecha: ${fechaAString(jornada.fecha)}, Registros: ${jornada.registros.length}`);
            }
        }

        // Verificar actividades existentes para hoy
        console.log('\n🔍 Verificando actividades existentes para hoy...');
        const actividadesHoy = await Produccion.find({
            operario: operarioAlejandra,
            fecha: fechaBackendNormalizada
        });

        console.log(`📊 Actividades encontradas para ${fechaAString(fechaBackendNormalizada)}: ${actividadesHoy.length}`);

        if (actividadesHoy.length > 0) {
            console.log('📋 Actividades existentes:');
            for (const actividad of actividadesHoy) {
                console.log(`  - OTI: ${actividad.oti}, Fecha: ${fechaAString(actividad.fecha)}`);
            }
        }

        // Buscar actividades del día anterior para comparar
        const ayer = new Date(fechaBackendNormalizada);
        ayer.setDate(ayer.getDate() - 1);
        
        const actividadesAyer = await Produccion.find({
            operario: operarioAlejandra,
            fecha: ayer
        });

        console.log(`\n📊 Para comparación - Actividades del ${fechaAString(ayer)}: ${actividadesAyer.length}`);

        console.log('\n✅ Análisis completado');
        console.log('\n📝 CONCLUSIÓN:');
        console.log(`Si se registra una actividad ahora, se guardará con fecha: ${fechaAString(fechaBackendNormalizada)}`);
        console.log(`Esto corresponde al día correcto: ${fechaBackendNormalizada.toLocaleDateString()}`);

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    } finally {
        mongoose.connection.close();
    }
}

pruebaRegistroActividad();
