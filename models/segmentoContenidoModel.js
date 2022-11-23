const mongoose = require('mongoose');

const segmentoContenidoSchema = new mongoose.Schema({
    idDatosClasificados: {
        type: String,
        required: true,
    },
    contenido: {
        type: String,
        required: true,
    },
    noIncidencias: {
        type: Number,
        required: true,
    },
    resultadoClasificacion: {
        type: Object,
        required: true,
    },
    tagsClasificacion: {
        type: Array,
        required: false,
    },
    calificacionTutor: {
        type: Object,
        required: true,
    },
    tagsTutor: {
        type: Array,
        required: false,
    },
    justificacionTutor: {
        type: String,
        required: false,
    },
});

module.exports = mongoose.model('segmentoContenido', segmentoContenidoSchema);
