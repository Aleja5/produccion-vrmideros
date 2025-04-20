const mongoose = require('mongoose');
require('dotenv').config();
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado:', conn.connection.host);
  } catch (error) {
    console.error('Error de conexión a MongoDB:', error);
    process.exit(1);
  }
};


module.exports = connectDB;