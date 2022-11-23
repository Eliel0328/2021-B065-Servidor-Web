const mongoose = require('mongoose');

const paginaSchema = new mongoose.Schema({
    idTutor: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    permitido: {
        type: Boolean,
        required: true,
    },
    justificacion: {
        type: String,
        required: true,
    },
    dominio: {
        type: String,
        required: true,
    },
    contenido: {
        type: Object,
        required: false,
    },
    fechaHora: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('pagina', paginaSchema);
