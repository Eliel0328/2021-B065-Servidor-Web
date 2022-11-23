const mongoose = require('mongoose');
const router = require('express').Router();
const tutor = require('../models/tutorModel');
const datosClasificacion = require('../models/datosclasificacionModel');

const addDays = (actual, days) => {
    let aux = new Date(actual);
    aux.setDate(aux.getDate() + days);
    return aux;
};

const getDaysBeteenTwoDate = (date1, date2) => {
    return new Date(date2).getDate() - new Date(date1).getDate();
};

const checkTheSameDate = (date1, date2) => {
    // console.log(date1, date2);
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
    console.log(limit);

    for (let i = 0; i <= limit; ++i) {
        console.log(actual);
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

//  Enpoints para el dashboard
router.get('/getIncidenciasByWeek/:tutorId', async (req, res) => {
    try {
        let inicial = req.body.fecha_inicial;
        let final = req.body.fecha_final;

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
});


const getVisitaNoPermitida = async (idTutor, dominio, date) => {
    try {
        let auxDate = new Date(date);
        let stringDate = `${auxDate.getFullYear()}-${
            auxDate.getMonth() + 1
        }-${auxDate.getDate()}`;
        let stringDateFinal = `${auxDate.getFullYear()}-${auxDate.getMonth() + 1}-${
            (auxDate.getDate() + 1) % 31
        }`;

        const aux = await visitaNoPermitida.find({
            idTutor: idTutor,
            dominio: dominio,
            // fechaHora: new Date(stringDate),
            fechaHora: {
                $gte: new Date(stringDate),
                $lte: new Date(stringDateFinal),
            },
        });

        return aux.length;
    } catch (err) {
        console.error(err);
    }
};

module.exports = router;
