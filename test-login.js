const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔍 Probando conexión al backend...');
          const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@gmail.com',
            password: '123456'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login exitoso:', response.data);
    } catch (error) {
        console.error('❌ Error en login:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
    }
}

testLogin();
