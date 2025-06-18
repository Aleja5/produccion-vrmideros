// Prueba simple de conexión frontend -> backend
const testConnection = async () => {
    try {
        console.log('🔍 Probando conexión desde frontend...');
        
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@gmail.com',
                password: '123456'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Conexión exitosa:', data);
        } else {
            console.error('❌ Error en respuesta:', response.status, response.statusText);
            const errorData = await response.text();
            console.error('Error data:', errorData);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
};

// Ejecutar la prueba cuando se cargue la página
window.addEventListener('load', testConnection);
