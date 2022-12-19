const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
    contraseña: {
        type: String,
        required: true,
    },
    nombre: {
        type: String,
        required: true,
    },
    apellidos: {
        type: String,
        required: true,
    },
    correo: {
        type: String,
        required: true,
    },
    extensionActiva: {
        type: Boolean,
        required: true,
    },
    numIncidencias: {
        type: Number,
        required: true,
    },
    equipos: {
        type: Array,
        required: true,
    },
});

module.exports = mongoose.model('tutor', tutorSchema);
