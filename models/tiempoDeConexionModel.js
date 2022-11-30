const mongoose = require('mongoose');

const tiempoDeConexionSchema = new mongoose.Schema({
    idTutor: {
        type: String,
        required: true,
    },
    idSocket: {
        type: String,
        required: true,
    },
    fecha: {
        type: Date,
        required: true,
    },
    tiempo: {
        type: Number,
        require: true
    }
});

module.exports = mongoose.model('tiempoDeConexion', tiempoDeConexionSchema);
