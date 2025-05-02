require('dotenv').config();
const express = require('express');
const connectDB = require('./src/db/db');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const operatorRoutes = require('./src/routes/operatorRoutes');
const productionRoutes = require('./src/routes/productionRoutes');
const buscarRoutes = require("./src/routes/buscarRoutes");
const crearRoutes = require("./src/routes/crearRoutes");
const adminRoutes = require('./src/routes/adminRoutes');
const maquinasRoutes = require('./src/routes/maquinasRoutes');

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/produccion', productionRoutes);
app.use("/api", buscarRoutes);
app.use("/api", crearRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maquinas', maquinasRoutes);


app.use((req, res, next) => {
  console.error(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Ruta no encontrada", path: req.originalUrl });
});


//conectar a MongoDB
connectDB();

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

});
  