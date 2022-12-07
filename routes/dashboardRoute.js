const mongoose = require('mongoose');
const router = require('express').Router();
const tutor = require('../models/tutorModel');
const datosClasificacion = require('../models/datosclasificacionModel');
const segmentoContenidoModel = require('../models/segmentoContenidoModel');
const visitaNoPermitidaModel = require('../models/visitaNoPermitidaModel');
const { DateTime } = require('luxon');

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

const getIncidencia = async (idDatosClasificados) => {
    try {
        const datos = await segmentoContenidoModel.find({
            idDatosClasificados: idDatosClasificados,
        });

        let a1 = 0;
        let a2 = 0;
        let a3 = 0;
        datos.forEach((e) => {
            a1 += e.resultadoClasificacion.vulgar;
            a2 += e.resultadoClasificacion.agresivo;
            a3 += e.resultadoClasificacion.ofensivo;
        });

        return [a1, a2, a3];
    } catch (err) {
        console.error(err);
    }
};

const getNoPermitidaByTutor = async (idTutor, date) => {
    try {
        let a = new Date(date);

        let actual = DateTime.fromObject({
            year: a.getFullYear(),
            month: a.getDate(),
            day: a.getMonth() + 1,
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

const frequencyDistribution = (tabla) => {
    const map = {};
    for (let i = 0; i < tabla.length; i++) {
        map[tabla[i].dominio] = (map[tabla[i].dominio] || 0) + 1;
    }

    return map;
};

//  Enpoints para el dashboard
router.get(
    '/getIncidenciasByWeek/:tutorId/:fecha_inicial/:fecha_final',
    async (req, res) => {
        try {
            let inicial = req.params.fecha_inicial;
            let final = req.params.fecha_final;

            const datos = await datosClasificacion.find({
                idTutor: req.params.tutorId,
                fechaHora: {
                    $gte: new Date(inicial),
                    $lte: new Date(final),
                },
            });

            res.status(200).json(setSumByWeek(inicial, final, datos));
        } catch (err) {
            res.json({ message: err });
        }
    }
);

// Obtener las incidencias solo por un dia
router.get(
    '/getTiposIncidencias/:tutorId/:fecha_inicial/:fecha_final',
    async (req, res) => {
        try {
            let inicial = req.params.fecha_inicial;
            let final = req.params.fecha_final;

            const datos = await datosClasificacion.find({
                idTutor: req.params.tutorId,
                fechaHora: {
                    $gte: new Date(inicial),
                    $lte: new Date(final),
                },
            });

            const posts = [];
            for (const username of datos) {
                const userPosts = await getIncidencia(username._id);
                posts.push(userPosts);
            }

            res.status(200).json(posts[0]);
        } catch (err) {
            res.json({ message: err });
        }
    }
);

// Obtener las paginas nos permitidas
router.get('/getNoPermitidas/:tutorId/:fecha_inicial/:fecha_final', async (req, res) => {
    try {
        let inicial = req.params.fecha_inicial;
        let final = req.params.fecha_final;

        let a = new Date(inicial);
        let actual = DateTime.fromObject({
            year: a.getFullYear(),
            month: a.getMonth() + 1,
            day: a.getDate(),
        });

        const tabla = [];
        for (let i = 0; i < 1; ++i) {
            const aux = await getNoPermitidaByTutor(
                req.params.tutorId,
                actual.toLocaleString()
            );
            tabla.push(frequencyDistribution(aux));
            actual = actual.plus({ day: 1 });
        }

        res.status(200).json(tabla);
    } catch (err) {
        res.status(404).json({ message: 'Datos no encontrados' });
    }
});


router.get(
    '/getTiposIncidenciasByWeek/:tutorId/:fecha_inicial/:fecha_final',
    async (req, res) => {
        try {
            let inicial = req.params.fecha_inicial;
            let final = req.params.fecha_final;

            const datos = await datosClasificacion.find({
                idTutor: req.params.tutorId,
                fechaHora: {
                    $gte: new Date(inicial),
                    $lte: new Date(final),
                },
            });

            // const posts = [];
            // for (const username of datos) {
            //     const userPosts = await getIncidencia(username._id);
            //     posts.push(userPosts);
            // }

            console.log(datos);
            // res.status(200).json(posts[0]);
            res.status(200).json({});
        } catch (err) {
            res.json({ message: err });
        }
    }
);

module.exports = router;
