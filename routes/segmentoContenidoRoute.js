const mongoose = require('mongoose');
const router = require('express').Router();
const segmentoContenido = require('../models/segmentoContenidoModel');

//  Enpoints para los segmentos de contenido
router.post('/registroSegmentoContenido/:idClasificados', async (req, res) => {
    const datos = new segmentoContenido({
        idDatosClasificados: req.params.idClasificados,
        contenido: req.body.contenido,
        noIncidencias: req.body.noIncidencias,
        resultadoClasificacion: req.body.resultadoClasificacion,
        calificacionTutor: req.body.calificacionTutor,
        justificacionTutor: req.body.justificacionTutor,
    });
    try {
        const savedData = await datos.save();
        res.json({ msg: 'datos guardados' });
    } catch (err) {
        res.json({ msg: Error });
    }
});

router.get('/consultarSegmentoContenido/:idSegmento', async (req, res) => {
    try {
        const datos = await segmentoContenido.findById(req.params.idSegmento);
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

router.get('/consultarSegmentosDeContenido/:idDatosClasificados', async (req, res) => {
    try {
        const datos = await segmentoContenido.find({
            idDatosClasificados: req.params.idDatosClasificados,
        });
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

router.patch('/actualizarSegmentoContenido/:idSegmento', async (req, res) => {
    try {
        const updatedSegmento = await segmentoContenido.updateOne(
            { _id: req.params.idSegmento },
            {
                $set: {
                    calificacionTutor: req.body.calificacionTutor,
                    tagsTutor: req.body.tagsTutor,
                    justificacionTutor: req.body.justificacionTutor
                },
            }
        );
        res.json(updatedTutor);
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;
