const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const tutor = require('../models/tutorModel');
const passwordReset = require('../models/passwordReset');
const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');
const cron = require('node-cron');
const datosclasificacionModel = require('../models/datosclasificacionModel');
const visitaNoPermitidaModel = require('../models/visitaNoPermitidaModel');
const tiempoDeConexionModel = require('../models/tiempoDeConexionModel');
const {
    makePresentacionHtml,
    makeTablaInciendiasHtml,
    makeTablaNoPermitidosHtml,
    makeTablaTiempoDeConexionHtml,
    makeFinalHtml,
} = require('./mail/ReporteSemanal');

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
        console.log('Listo para los mensajes');
    }
});

const addHours = (h) => {
    let aux = new Date();
    aux.setTime(aux.getTime() + h * 60 * 60 * 1000);
    return aux;
};

const getWeekBeginAndEnd = () => {
    let curr = addHours(-6); // get current date
    let first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
    let last = first + 6; // last day is the first day + 6
    let firstday = new Date(curr.setDate(first)).toUTCString();
    let lastday = new Date(curr.setDate(last)).toUTCString();

    return { firstday, lastday };
};

const addDays = (actual, days) => {
    let aux = new Date(actual);
    aux.setDate(aux.getDate() + days);
    return aux;
};

const getDaysBeteenTwoDate = (date1, date2) => {
    return new Date(date2).getDate() - new Date(date1).getDate();
};

const checkTheSameDate = (date1, date2) => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

const separateByDays = (inicial, final, datos) => {
    let daysOfWeek = [];
    let actual = new Date(inicial);

    let limit = getDaysBeteenTwoDate(inicial, final);

    for (let i = 0; i <= limit; ++i) {
        let aux = datos.filter((e) => checkTheSameDate(e.fechaHora, actual));
        daysOfWeek.push(aux);
        actual = addDays(actual, 1);
    }

    return daysOfWeek;
};

const setSumByWeek = (inicial, final, datos) => {
    let daysOfWeek = [];
    let sumOfDaysOfWeek = [];

    daysOfWeek = separateByDays(inicial, final, datos);

    daysOfWeek.forEach((e) => {
        let aux = 0;
        e.forEach((f) => {
            aux += f.noIncidencias;
        });
        sumOfDaysOfWeek.push(aux);
    });

    return sumOfDaysOfWeek;
};

const getIncidenciasByWeek = async (tutorId, inicial, final) => {
    try {
        const datos = await datosclasificacionModel.find({
            idTutor: tutorId,
            fechaHora: {
                $gte: new Date(inicial),
                $lte: new Date(final),
            },
        });

        return setSumByWeek(inicial, final, datos);
    } catch (err) {
        console.error(err);
    }
};

const frequencyDistribution = (tabla) => {
    const map = {};
    for (let i = 0; i < tabla.length; i++) {
        map[tabla[i].dominio] = (map[tabla[i].dominio] || 0) + 1;
    }

    return map;
};

const onlyDate = (a) => {
    let aux2 = a.getMonth() + 1 < 10 ? `0${a.getMonth() + 1}` : a.getMonth() + 1;
    let aux3 = a.getDate() < 10 ? `0${a.getDate()}` : a.getDate();
    return `${a.getFullYear()}-${aux2}-${aux3}`;
};

const distribuirTiempo = (tabla, actual) => {
    const map = {};
    for (let i = 0; i < 7; i++) {
        actual = actual.plus({ days: 1 });
        map[onlyDate(new Date(actual))] = 0;
    }

    for (let i = 0; i < tabla.length; i++) {
        let aux = onlyDate(tabla[i].fecha);
        map[aux] = (map[aux] || 0) + tabla[i].tiempo;
    }

    return map;
};

const getNoPermitidaByTutor = async (idTutor, date) => {
    try {
        let a = new Date(date);

        let actual = DateTime.fromObject({
            year: a.getFullYear(),
            month: a.getMonth() + 1,
            day: a.getDate(),
        });
        let last = actual.plus({ days: 1 });

        const aux = await visitaNoPermitidaModel.find({
            idTutor: idTutor,
            fechaHora: {
                $gte: actual.minus({ hours: 6 }),
                $lte: last.minus({ hours: 6 }),
            },
        });

        return aux;
    } catch (err) {
        console.error(err);
    }
};

const getNoPermitidasByWeek = async (tutorId, date) => {
    try {
        let a = new Date(date);
        let actual = DateTime.fromObject({
            year: a.getFullYear(),
            month: a.getMonth() + 1,
            day: a.getDate(),
        });
        const tabla = [];
        for (let i = 0; i < 7; ++i) {
            const aux = await getNoPermitidaByTutor(tutorId, actual);
            tabla.push(frequencyDistribution(aux));
            actual = actual.plus({ day: 1 });
        }

        return tabla;
    } catch (err) {
        console.error(err);
    }
};

const getTiempoDeConexionByWeek = async (tutorId, inicial, final) => {
    try {
        let a = new Date(inicial);
        let actual = DateTime.fromObject({
            year: a.getFullYear(),
            month: a.getMonth() + 1,
            day: a.getDate(),
        });

        let b = new Date(final);
        let last = DateTime.fromObject({
            year: b.getFullYear(),
            month: b.getMonth() + 1,
            day: b.getDate(),
        });

        const datos = await tiempoDeConexionModel.find({
            idTutor: tutorId,
            fecha: {
                $gte: actual.minus({ hours: 6 }),
                $lte: last.minus({ hours: 6 }),
            },
        });

        return distribuirTiempo(datos, actual);
    } catch (err) {
        console.error(err);
    }
};

const setDays = (date) => {
    let a = new Date(date);
    const tabla = [];

    let actual = DateTime.fromObject({
        year: a.getFullYear(),
        month: a.getMonth() + 1,
        day: a.getDate(),
    });

    for (let i = 0; i < 7; ++i) {
        tabla.push(onlyDate(new Date(actual)));
        actual = actual.plus({ day: 1 });
    }

    return tabla;
};

const envioCorreoSemanal = async () => {
    try {
        const datos = await tutor.find({});

        let { firstday, lastday } = getWeekBeginAndEnd();

        const datosPorTutor = [];
        for (const e of datos) {
            const incidencias = await getIncidenciasByWeek(e._id, firstday, lastday);
            const noPermitidas = await getNoPermitidasByWeek(e._id, firstday);
            const tiempoConexion = await getTiempoDeConexionByWeek(
                e._id,
                firstday,
                lastday
            );

            datosPorTutor.push({
                id: e._id,
                email: e.correo,
                nombre: e.nombre + ' ' + e.apellidos,
                incidencias,
                noPermitidas,
                tiempoConexion,
            });
        }

        const days = setDays(firstday);

        for (const e of datosPorTutor) {
            let presetacion = makePresentacionHtml(e.nombre, firstday, lastday);
            let tablaIncidenciasHtml = makeTablaInciendiasHtml(days, e.incidencias);
            let tablaNoPermitidosHtml = makeTablaNoPermitidosHtml(
                e.noPermitidas,
                days,
                firstday,
                lastday
            );
            let tablaTiempoDeConexionHtml = makeTablaTiempoDeConexionHtml(
                e.tiempoConexion,
                firstday,
                lastday
            );
            let finalHtml = makeFinalHtml();
            let reporteHTML =
                presetacion +
                tablaIncidenciasHtml +
                tablaNoPermitidosHtml +
                tablaTiempoDeConexionHtml +
                finalHtml;

            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: e.email,
                subject: 'Reporte Semanal',
                html: reporteHTML,
            };
            await transporter.sendMail(mailOptions);
        }
    } catch (error) {
        console.error(error);
    }
};

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

cron.schedule('0 9 * * MON', () => {
    console.log('Prueba');
    envioCorreoSemanal();
});

module.exports = router;
