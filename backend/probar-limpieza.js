const axios = require('axios');

async function probarLimpiezaInconsistencias() {
    try {
        console.log('🧪 Probando función de limpieza de inconsistencias...');
        
        const response = await axios.post('http://localhost:5000/api/produccion/limpiar-inconsistencias');
        
        console.log('✅ Respuesta del servidor:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error al probar limpieza:', error.response?.data || error.message);
    }
}

// Ejecutar en 5 segundos para dar tiempo al servidor
setTimeout(probarLimpiezaInconsistencias, 5000);
