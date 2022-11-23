const mongoose = require('mongoose');
const router = require('express').Router();
const datosClasificacion = require('../models/datosclasificacionModel');

//  Enpoints para los datos de clasificacion
router.post('/registroDatosClasificacion/:tutorId', async (req, res) => {
    const datos = new datosClasificacion({
        idTutor: req.params.tutorId,
        url: req.body.url,
        noIncidencias: req.body.noIncidencias,
        fechaHora: req.body.fechaHora
    });
    try {
        const savedData = await datos.save();
        res.json({ msg: 'datos guardados' });
    } catch(err) {
        res.json({msg: Error})
    }
});

router.get('/consultarDatosClasificacion/:tutorId', async (req,res) => {
    try{
        const datos = await datosClasificacion.find({idTutor: req.params.tutorId});
        res.json(datos);
    }catch (err){
        res.json({message: err});
    }
});

module.exports = router;