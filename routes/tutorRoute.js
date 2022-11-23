const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const tutor = require('../models/tutorModel');

//  Enpoints para el tutor
router.post('/registrarTutor', async (req, res) => {
    try {
        //  Verificar que los datos fueron enviados
        const { contraseña, nombre, apellidos, correo, extensionActiva, numIncidencias } =
            req.body;

        if (
            !contraseña ||
            !nombre ||
            !apellidos ||
            !correo ||
            !extensionActiva ||
            !numIncidencias
        ) {
            return res.status(400).json({ msg: 'DATOS_INCOMPLETOS' });
        }

        //  Verificar que el correo no exista
        const oldUser = await tutor.findOne({ correo });
        if (oldUser) {
            return res.status(400).json({ msg: 'CORREO_REGISTRADO' });
        }

        //  Cifrado de la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(contraseña, salt);

        //  Crear tutor
        const datos = new tutor({
            contraseña: passwordHashed,
            nombre: req.body.nombre,
            apellidos: req.body.apellidos,
            correo: req.body.correo,
            extensionActiva: req.body.extensionActiva,
            numIncidencias: req.body.numIncidencias,
        });

        //  Guardar los datos del tutor
        const savedData = await datos.save();

        //  Datos correctos
        const payload = { id: savedData._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(201).json({
            msg: 'TUTOR_CREADO',
            data: {
                data: savedData,
                token: token,
                user: {
                    email: savedData.correo,
                    id: savedData._id,
                },
            },
        });
    } catch (err) {
        res.json({ msg: Error });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        //  Verificar que los datos sean enviados
        if (email.length == 0 || password.length == 0) {
            return res.status(400).json({ msg: 'DATOS_VACIOS' });
        }

        //  Verificar existencia del tutor
        const tutorExiste = await tutor.findOne({ correo: email });
        if (!tutorExiste) {
            return res.status(400).json({ msg: 'TUTOR_NO_REGISTRADO' });
        }

        //  Verificar contraseña
        const match = await bcrypt.compare(password, tutorExiste.contraseña);
        if (!match) {
            return res.status(400).json({ msg: 'DATOS_ERRONEOS' });
        }

        //  Datos correctos
        const payload = { id: tutorExiste._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(200).json({
            token,
            user: {
                email: tutorExiste.correo,
                id: tutorExiste._id,
            },
        });
    } catch (error) {
        console.error(error);
    }
});

router.get('/getTutor/:tutorId', async (req, res) => {
    try {
        const actualTutor = await tutor.findById(req.params.tutorId);
        res.status(200).json(actualTutor);
    } catch (err) {
        res.status(404).json({ msg: 'TUTOR_NO_ENCONTRADO' });
    }
});

router.patch('/actualizarDatos/:tutorId', async (req, res) => {
    try {
        const updatedTutor = await tutor.updateOne(
            { _id: req.params.tutorId },
            {
                $set: {
                    usuario: req.body.usuario,
                    nombre: req.body.nombre,
                    apellidos: req.body.apellidos,
                    correo: req.body.correo,
                },
            }
        );
        res.json(updatedTutor);
    } catch (err) {
        res.json({ message: err });
    }
});

router.delete('/borrarTutor/:tutorId', async (req, res) => {
    try {
        const removedTutor = await tutor.deleteOne({ _id: req.params.tutorId });
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

router.get('/consultarDatos/:tutorId', async (req, res) => {
    try {
        const datos = await tutor.findById(req.params.tutorId);
        res.json(datos);
    } catch (err) {
        res.json({ message: err });
    }
});

router.patch('/actualizarIncidencias/:tutorId', async (req, res) => {
    try {
        const updatedTutor = await tutor.updateOne(
            { _id: req.params.tutorId },
            { $set: { numIncidencias: req.body.numIncidencias } }
        );
        res.status(200).json(updatedTutor);
    } catch (err) {
        res.status(400).json({ message: err });
    }
});

router.patch('/activarExtension/:tutorId', async (req, res) => {
    try {
        const updatedTutor = await tutor.updateOne(
            { _id: req.params.tutorId },
            { $set: { extensionActiva: req.body.extensionActiva } }
        );

        res.status(200).json(updatedTutor);
    } catch (err) {
        res.status(400).json({ message: err });
    }
});

router.get('/verificarCorreo/:correo', async (req, res) => {
    try {
        const datos = await tutor.find({ correo: req.params.correo });

        res.json(datos.length < 0 ? true : false);
    } catch (err) {
        res.json({ message: err });
    }
});

router.get('/verificarExtension/:tutorId', async (req, res) => {
    try {
        const datos = await tutor.findById(req.params.tutorId);
        res.json(datos.extensionActiva);
    } catch (err) {
        res.json({ message: err });
    }
});

router.get('/getIncidencias/:tutorId', async (req, res) => {
    try {
        const datos = await tutor.findById(req.params.tutorId);
        res.json(datos.numIncidencias);
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;
