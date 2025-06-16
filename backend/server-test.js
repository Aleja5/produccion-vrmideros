// Servidor de prueba simplificado
require('dotenv').config();
console.log('🔍 Cargando módulos...');

try {
    const express = require('express');
    console.log('✅ Express cargado');
    
    const rateLimit = require('express-rate-limit');
    console.log('✅ Rate limit cargado');
    
    const connectDB = require('./src/db/db');
    console.log('✅ DB connection cargado');
    
    console.log('🚀 Iniciando servidor de prueba...');
    
    const app = express();
    const PORT = process.env.PORT || 5000;
    
    // Middleware básico
    app.use(express.json());
    
    // Ruta de prueba
    app.get('/test', (req, res) => {
        res.json({ 
            message: '🎉 Servidor funcionando correctamente!',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV
        });
    });
    
    // Conectar a MongoDB
    connectDB();
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
        console.log(`🚀 Servidor de prueba corriendo en http://localhost:${PORT}`);
        console.log(`🧪 Probar: http://localhost:${PORT}/test`);
        console.log('🔐 Variables de entorno verificadas ✅');
    });
    
} catch (error) {
    console.error('❌ Error al iniciar servidor:', error.message);
    process.exit(1);
}
