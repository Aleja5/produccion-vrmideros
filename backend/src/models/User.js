const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Esquema del usuario
const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido'],
    },    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    role: {
      type: String,
      enum: ['admin', 'production'],
      default: 'production',
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

// Encriptar contraseña antes de guardar (solo si fue modificada)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    console.log('Contraseña no modificada, se salta hash.');
    return next();
  }

  console.log('Contraseña antes de hash:', this.password);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Contraseña después de hash:', this.password);

  next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (password) {
  try {
    console.log('Iniciando comparación de contraseñas...');
    if (!password || !this.password) {
      console.error('ERROR: Contraseña o hash faltante');
      return false;
    }

    // Comparar directamente usando bcrypt
    const isMatch = await bcrypt.compare(password, this.password);
    console.log('Resultado de bcrypt.compare:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error en la comparación de contraseñas:', error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
