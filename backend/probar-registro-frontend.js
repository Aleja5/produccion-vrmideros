const { normalizarFecha, fechaAString } = require('./src/utils/manejoFechas');

// Simular cómo el frontend calcula la fecha
function simularFrontendFecha() {
    // Esto es lo que hace el frontend: new Date().toISOString().split('T')[0]
    const fechaFrontend = new Date().toISOString().split('T')[0];
    console.log('🌐 Fecha calculada por frontend:', fechaFrontend);
    return fechaFrontend;
}

function simularCombinarFechaYHora(fecha, hora) {
    // Simular la función combinarFechaYHora del frontend
    if (!hora || typeof hora !== 'string' || !hora.match(/^\d{2}:\d{2}$/)) return null;

    const [hh, mm] = hora.split(":");
    const [yyyy, mmFecha, dd] = fecha.split('-');

    const date = new Date(Number(yyyy), Number(mmFecha) - 1, Number(dd), Number(hh), Number(mm), 0);

    return isNaN(date.getTime()) ? null : date.toISOString();
}

console.log('=== SIMULACIÓN DE REGISTRO DESDE FRONTEND ===\n');

// 1. Fecha que enviaría el frontend
const fechaFrontend = simularFrontendFecha();

// 2. Normalización en el backend
console.log('🔄 Normalizando fecha en backend...');
const fechaNormalizada = normalizarFecha(fechaFrontend);
console.log('✅ Fecha normalizada:', fechaAString(fechaNormalizada));

// 3. Simular datos de jornada que llegarían al backend
const simulacionDatos = {
    fecha: fechaFrontend,
    operario: '673c1234567890abcdef1234',
    horaInicio: simularCombinarFechaYHora(fechaFrontend, '08:00'),
    horaFin: simularCombinarFechaYHora(fechaFrontend, '17:00'),
    actividades: [{
        oti: 'OTI-TEST-001',
        areaProduccion: '673c1234567890abcdef5678',
        maquina: '673c1234567890abcdef9012',
        procesos: ['673c1234567890abcdef3456'],
        insumos: [],
        tipoTiempo: 'Productivo',
        horaInicio: simularCombinarFechaYHora(fechaFrontend, '09:00'),
        horaFin: simularCombinarFechaYHora(fechaFrontend, '11:00'),
        tiempo: 120,
        observaciones: 'Actividad de prueba'
    }]
};

console.log('\n📤 Datos que enviaría el frontend:');
console.log('- Fecha:', simulacionDatos.fecha);
console.log('- Hora inicio jornada:', simulacionDatos.horaInicio);
console.log('- Hora fin jornada:', simulacionDatos.horaFin);
console.log('- Hora inicio actividad:', simulacionDatos.actividades[0].horaInicio);
console.log('- Hora fin actividad:', simulacionDatos.actividades[0].horaFin);

console.log('\n📥 Como lo procesaría el backend:');
const fechaProcesada = normalizarFecha(simulacionDatos.fecha);
console.log('- Fecha procesada:', fechaAString(fechaProcesada));

// Verificar si hay diferencia
if (fechaFrontend !== fechaAString(fechaProcesada)) {
    console.log('\n⚠️  DESFASE DETECTADO:');
    console.log('Frontend envía:', fechaFrontend);
    console.log('Backend procesa:', fechaAString(fechaProcesada));
} else {
    console.log('\n✅ No hay desfase de fechas');
}

// Verificar zona horaria actual
console.log('\n🕐 Información de zona horaria:');
console.log('Zona horaria del sistema:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Offset actual (minutos):', new Date().getTimezoneOffset());

// Probemos con una fecha específica para hoy
console.log('\n=== PRUEBA ESPECÍFICA PARA HOY (14 JUNIO) ===');
const hoy = new Date();
console.log('Fecha actual del sistema:', hoy.toString());
console.log('ISO actual:', hoy.toISOString());
console.log('Split ISO:', hoy.toISOString().split('T')[0]);

// Simulemos exactamente lo que pasaría si registramos ahora
const fechaParaRegistro = hoy.toISOString().split('T')[0];
const fechaNormalizadaRegistro = normalizarFecha(fechaParaRegistro);
console.log('Fecha que se registraría:', fechaAString(fechaNormalizadaRegistro));
