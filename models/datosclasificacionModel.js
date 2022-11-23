const mongoose = require('mongoose');

const datosclasificacionSchema = new mongoose.Schema({
    idTutor: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    dominio: {
        type: String,
        required: true,
    },
    noIncidencias: {
        type: Number,
        required: true,
    },
    fechaHora: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('datosClasificacion', datosclasificacionSchema);
