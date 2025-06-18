require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/db/db');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const operatorRoutes = require('./src/routes/operatorRoutes');
const productionRoutes = require('./src/routes/productionRoutes');
const buscarRoutes = require("./src/routes/buscarRoutes");
const crearRoutes = require("./src/routes/crearRoutes");
const adminRoutes = require('./src/routes/adminRoutes');
const maquinasRoutes = require('./src/routes/maquinasRoutes');
const insumosRoutes = require('./src/routes/insumosRoutes');
const procesosRoutes = require('./src/routes/procesosRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const areaRoutes = require('./src/routes/areaRoutes');
const jornadaRoutes = require('./src/routes/jornadaRoutes');

// Validar variables de entorno críticas
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
// EMAIL vars son opcionales para despliegue inicial
const optionalVars = ['EMAIL_USER', 'EMAIL_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    console.error('💡 Verifica tu archivo .env');
    process.exit(1);
}

// Advertir sobre variables opcionales
const missingOptional = optionalVars.filter(varName => !process.env[varName]);
if (missingOptional.length > 0) {
    console.warn('⚠️ Variables opcionales faltantes:', missingOptional.join(', '));
    console.warn('📧 Funciones de email pueden no funcionar');
}

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS mejorada para seguridad
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
          const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(url => url.trim())
            : ['http://localhost:5173', 'http://localhost:3000'];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS: Origen no permitido: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware de seguridad
// Configurar Helmet para headers de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false // Deshabilitado para compatibilidad
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de Rate Limiting para seguridad
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos de login por IP cada 15 minutos
    message: {
        error: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // máximo 500 requests por IP cada 15 minutos (aumentado para desarrollo)
    message: {
        error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiting general a todas las rutas API
app.use('/api/', generalLimiter);

// Aplicar rate limiting específico para autenticación
app.use('/api/auth/', authLimiter);

// Headers de seguridad
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/operarios', operatorRoutes);
app.use('/api/produccion', productionRoutes);
app.use("/api", buscarRoutes);
app.use("/api", crearRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maquinas', maquinasRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/procesos', procesosRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/jornadas', jornadaRoutes);


app.use((req, res, next) => {
  console.error(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Ruta no encontrada", path: req.originalUrl });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
    console.error('🐛 Error global capturado:', err.message);
    
    // No exponer stack trace en producción
    const errorResponse = {
        error: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message
    };
    
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
    }
    
    res.status(err.status || 500).json(errorResponse);
});

//conectar a MongoDB
connectDB();

// Iniciar el servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS habilitado para: ${process.env.CORS_ORIGIN || 'localhost'}`);
  console.log(`📅 Iniciado: ${new Date().toLocaleString()}`);
});

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido. Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT recibido. Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado.');
        process.exit(0);
    });
});

// Exportar para poder usar en otros archivos
module.exports = app;
