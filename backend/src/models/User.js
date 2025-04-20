const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'El correo electrónico es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    role: {
        type: String,
        enum: ['admin', 'production'], // Roles permitidos
        default: 'production',
    },
},
{ collection: 'user' }
);

module.exports = mongoose.model('User', userSchema, 'users');
