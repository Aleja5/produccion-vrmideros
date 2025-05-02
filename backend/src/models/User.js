const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Esquema del usuario
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
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
  console.log('Comparando contraseña ingresada:', password);
  const isMatch = await bcrypt.compare(password, this.password);
  console.log('¿Las contraseñas coinciden?', isMatch);
  return isMatch;
};

module.exports = mongoose.model('User', userSchema);
