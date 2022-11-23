const mongoose = require('mongoose');

const visitaNoPermitidaSchema = new mongoose.Schema({
    idTutor: {
        type: String,
        required: true,
    },
    idPagina: {
        type: String,
        required: true,
    },
    dominio: {
        type: String,
        required: true,
    },
    fechaHora: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('visitaNoPermitida', visitaNoPermitidaSchema);
