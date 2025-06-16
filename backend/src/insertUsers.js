const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://Admin:Thomas130817@cluster0.vhx5w.mongodb.net/localproduccion';

// Conexión con Mongoose
mongoose.connect(uri)
  .then(() => // REMOVED: console.log('✅ MongoDB Atlas conectado con Mongoose'))
  .catch(err => console.error('❌ Error de conexión:', err));

// Definir esquema y modelo
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: String,
});

const User = mongoose.model('User', userSchema);

// Insertar usuario
async function insertUser(email, password, role) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword, role });
  await user.save();
  // REMOVED: console.log(`✅ Usuario ${email} insertado correctamente.`);
}

// Verificar contraseña
async function verificarPassword(email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    // REMOVED: console.log('❌ Usuario no encontrado.');
    return;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  // REMOVED: console.log(`🔐 ¿La contraseña coincide? → ${isMatch}`);
}

// Ejecución
(async () => {
  await insertUser('usuario@gmail.com', '123456', 'production');
  await verificarPassword('usuario@gmail.com', '123456');
})();
