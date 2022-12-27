const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const tutor = require('../models/tutorModel');
const passwordReset = require('../models/passwordReset');
const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Listo para los mensajes', success);
    }
});

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

router.patch('/actualizarPassword/:tutorId', async (req, res) => {
    try {
        const { contraseña, nueva_contraseña, confirmar_contraseña } = req.body;

        if (!contraseña || !nueva_contraseña || !confirmar_contraseña) {
            return res.status(404).json({ msg: 'DATOS_INCOMPLETOS' });
        }

        const tutorExiste = await tutor.findById(req.params.tutorId);
        if (!tutorExiste) {
            return res.status(404).json({ msg: 'TUTOR_NO_REGISTRADO' });
        }

        if (nueva_contraseña !== confirmar_contraseña) {
            return res.status(404).json({ msg: 'DATOS_ERRONEOS_1' });
        }

        const match = await bcrypt.compare(contraseña, tutorExiste.contraseña);
        if (!match) {
            return res.status(401).json({ msg: 'DATOS_ERRONEOS' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(nueva_contraseña, salt);

        const updatedTutor = await tutor.updateOne(
            { _id: req.params.tutorId },
            { $set: { contraseña: passwordHashed } }
        );
        res.status(200).json(updatedTutor);
    } catch (err) {
        res.status(400).json({ message: err });
    }
});

router.post('/requestPasswordReset', async (req, res) => {
    try {
        const { email, redirectUrl } = req.body;

        if (email.length == 0 || redirectUrl.length == 0) {
            return res.status(400).json({ msg: 'DATOS_VACIOS' });
        }

        const tutorExiste = await tutor.findOne({ correo: email });
        if (!tutorExiste) {
            return res.status(400).json({ msg: 'TUTOR_NO_REGISTRADO' });
        }

        let aux = await sendResetEmail(tutorExiste, redirectUrl, res);

        res.status(200).json(aux);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 'Error',
            msg: error,
        });
    }
});

const sendResetEmail = async ({ _id, correo }, redirectUrl, res) => {
    try {
        const resetString = uuidv4() + _id;

        let aux = await passwordReset.deleteMany({ tutorId: _id });
        console.log(aux);

        let url = redirectUrl + '/' + _id + '/' + resetString;
        console.log(url);
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: correo,
            subject: 'Reestablecer Contraseña',
            html: `<div>
            <p>Perdiste tu contraseña</p>
            <p>No te preocupes, usa el siguiente link</p>
            <br>
            <p>Este enlace <b>expira en 60 minutos</b></p>
            <p>Presione <a href=${url}>aqui</a> para continuar</p>
        
            <p>Si no selecciono la opcion, ignore este correo</p>
        </div>`,
        };

        const salt = await bcrypt.genSalt(10);
        const stringHashed = await bcrypt.hash(resetString, salt);

        let timeNow = DateTime.now().minus({ hours: 6 });

        const saveData = new passwordReset({
            tutorId: _id,
            uniqueString: stringHashed,
            createdAt: timeNow,
            expiredAt: timeNow.plus({ minutes: 60 }),
        }).save();

        await transporter.sendMail(mailOptions);

        return {
            status: 'Pendiente',
            msg: 'Se envio el correo para reiniciar la contraseña',
        };
    } catch (error) {
        console.log(error);
        return {
            status: 'Error',
            msg: error,
        };
    }
};

router.post('/passwordReset', async (req, res) => {
    try {
        let { tutorId, resetString, newPassword } = req.body;

        const datos = await passwordReset.findOne({ tutorId });

        if (datos) {
            const { expiredAt, uniqueString } = datos;

            if (expiredAt < DateTime.now()) {
                const match = await bcrypt.compare(resetString, uniqueString);
                if (!match) {
                    return res.status(401).json({ msg: 'DATOS_ERRONEOS' });
                }

                const salt = await bcrypt.genSalt(10);
                const passwordHashed = await bcrypt.hash(newPassword, salt);

                const updatedTutor = await tutor.updateOne(
                    { _id: tutorId },
                    { $set: { contraseña: passwordHashed } }
                );

                await passwordReset.deleteOne({ tutorId });
                res.status(200).json({ msg: 'PASS_UPDATE' });
            } else {
                await passwordReset.deleteOne({ tutorId });
                res.status(400).json({ msg: 'ERROR_EXPIRE_LINK' });
            }
        } else {
            res.status(400).json({ msg: 'ERROR_PASS_NOT_FOUND' });
        }
    } catch (error) {
        console.error(error);
        res.status(404).json({ msg: 'DATOS_NO_ENCONTRADOS' });
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
