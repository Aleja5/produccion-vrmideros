// Script de prueba de conexión
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧪 Probando configuración...');
console.log('🔗 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 PORT:', process.env.PORT);
console.log('🔗 JWT_SECRET length:', process.env.JWT_SECRET?.length || 'undefined');
console.log('🔗 MONGO_URI configured:', !!process.env.MONGO_URI);

// Probar conexión a MongoDB
const testConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conexión a MongoDB exitosa');
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
};

testConnection();
