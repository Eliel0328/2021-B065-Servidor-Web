const mongoose = require('mongoose');
const router = require('express').Router();
const pagina = require('../models/paginaModel');

//  Enpoints para las paginas
router.post('/registroPagina/:tutorId', async (req, res) => {
    const datos = new pagina({
        idTutor: req.params.tutorId,
        url: req.body.url,
        permitido: req.body.permitido,
        justificacion: req.body.justificacion,
        dominio: req.body.dominio,
        contenido: req.body.contenido,
        fechaHora: req.body.fechaHora
    });

    try {
        const aux = await pagina.find({
            idTutor: req.params.tutorId,
            dominio: req.body.dominio,
        });
        console.log(req.params.tutorId,aux, aux.length, aux.length === true, aux.length !== 0);

        if (aux.length !== 0) {
            if (aux[0].permitido) {
                res.json({ msg: 'PERMITIDO_EXISTE', data: aux[0] });
            } else {
                res.json({ msg: 'NO_PERMITIDO_EXISTE', data: aux[0] });
            }
        } else {
            const savedData = await datos.save();
            res.json({ msg: 'NUEVO_CREADO', data: savedData });
        }
    } catch (err) {
        res.json({ message: err });
    }
});

router.delete('/borrarPagina/:paginaId', async (req, res) => {
    try {
        const removedTpagina = await pagina.deleteOne({ _id: req.params.paginaId });
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

router.get('/consultarPaginas/:tutorId', async (req, res) => {
    try {
        const datos = await pagina.find({ idTutor: req.params.tutorId });
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

router.get('/getPaginasPermitidas/:tutorId', async (req, res) => {
    try {
        const datos = await pagina.find({ idTutor: req.params.tutorId, permitido: true });
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

router.get('/getPaginasNoPermitidas/:tutorId', async (req, res) => {
    try {
        const datos = await pagina.find({
            idTutor: req.params.tutorId,
            permitido: false,
        });
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;
