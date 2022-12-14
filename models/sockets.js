var request = require('request');
const segmentoContenido = require('../models/segmentoContenidoModel');
const datosClasificacion = require('../models/datosclasificacionModel');
const pagina = require('../models/paginaModel');
const tutor = require('../models/tutorModel');
const visitaNoPermitida = require('../models/visitaNoPermitidaModel');
const tiempoDeConexion = require('./tiempoDeConexionModel');
const { DateTime, Interval } = require('luxon');

//  Arreglo de etiquetas para mostrar en el front
const setTags = (x1, x2, x3, tipo) => {
    let aux = [];
    if (tipo === 'TUTOR') {
        aux.push('No Calificado');
        return aux;
    }
    if (x1 !== 0) {
        aux.push('Vulgar');
    }
    if (x2 !== 0) {
        aux.push('Agresivo');
    }
    if (x3 !== 0) {
        aux.push('Ofensivo');
    }

    if (x1 === 0 && x2 === 0 && x3 === 0) {
        aux.push('No Ofensivo');
    }
    return aux;
};

//  Obtener pagina por el idTutor y dominio
const getPaginaByDominio = async (idTutor, dominio) => {
    try {
        const aux = await pagina.find({ idTutor: idTutor, dominio: dominio });
        return aux[0]._id;
    } catch (err) {
        console.error(err);
    }
};

//  Compobar si un dominio debe ser analizado, registrado o ignorado
const checkDomain = async (idTutor, dominio) => {
    try {
        if (dominio === 'vigilantt.tk') return 'NO_ANALIZAR';

        const aux = await pagina.find({ idTutor: idTutor, dominio: dominio });

        if (aux.length === 0) return 'ANALIZAR';

        return aux[0].permitido ? 'NO_ANALIZAR' : 'REGISTRAR';
    } catch (err) {
        console.error(err);
    }
};

//  Verfificar si la extension esta activa
const checkExtension = async (idTutor) => {
    try {
        const aux = await tutor.findById(idTutor);

        return aux.extensionActiva;
    } catch (err) {
        console.error(err);
    }
};

//  Obtener las incidencias designadas por el tutor
const getNumIncidencias = async (idTutor) => {
    try {
        const aux = await tutor.findById(idTutor);

        return aux.numIncidencias;
    } catch (err) {
        console.error(err);
    }
};

//  Registrar una visita a un sitio no permitido
const registrarVisita = async (data) => {
    try {
        let idPagina = await getPaginaByDominio(data.idTutor, data.dominio);
        // Registrar visita
        const visita = new visitaNoPermitida({
            idTutor: data.idTutor,
            idPagina: idPagina,
            dominio: data.dominio,
            fechaHora: data.fechaHora,
        }).save();
    } catch (error) {
        console.error(error);
    }
};

//  Organizar la respuesta del servidor de clasificacion para almacenarla
const organizeContent = (body, id) => {
    let segmentosDeContenido = [];
    let noIncidencias = 0;

    body.clasificacion.forEach((element) => {
        let aux = element[0] + element[1] + element[2];
        if (aux >= 1) {
            noIncidencias += aux;
            const datos = new segmentoContenido({
                idDatosClasificados: id,
                contenido: element[3],
                noIncidencias: element[0] + element[1] + element[2],
                resultadoClasificacion: {
                    vulgar: element[0],
                    agresivo: element[1],
                    ofensivo: element[2],
                },
                tagsClasificacion: setTags(
                    element[0],
                    element[1],
                    element[2],
                    'CLASIFICADOR'
                ),
                calificacionTutor: {
                    vulgar: 0,
                    agresivo: 0,
                    ofensivo: 0,
                },
                tagsTutor: setTags(0, 0, 0, 'TUTOR'),
                justificacionTutor: '',
            });
            segmentosDeContenido.push(datos);
        }
    });

    return { segmentosDeContenido, noIncidencias };
};

const saveIntialTime = async (idTutor, idSocket) => {
    try {
        const time = DateTime.now().minus({ hours: 6 });
        // const time = DateTime.now()
        const datos = new tiempoDeConexion({
            idTutor: idTutor,
            idSocket: idSocket,
            tiempo: 0,
            fecha: time,
        });

        const savedData = await datos.save();
    } catch (err) {
        console.error(err);
    }
};

const findAndUpdate = async (idSocket) => {
    try {
        const datos = await tiempoDeConexion.find({
            idSocket: idSocket,
        });

        if (datos.length !== 0) {
            // Reajustar horario
            let a = new Date(datos[0].fecha);
            const aux1 = DateTime.fromObject({
                year: a.getFullYear(),
                month: a.getMonth() + 1,
                day: a.getDate(),
                hour: (a.getHours() + 6) % 24,
                minute: a.getMinutes(),
                second: a.getSeconds(),
            });
            const aux2 = DateTime.now();
            const diff = aux1.diff(aux2, ['seconds']);
            let aux = Math.abs(diff.toObject().seconds);

            const updateDatos = await tiempoDeConexion.updateOne(
                { _id: datos[0]._id },
                {
                    $set: {
                        tiempo: aux,
                    },
                }
            );
        } else {
            console.log('No se encontro registro de conexion del socket desconectado');
        }
    } catch (err) {
        console.error(err);
    }
};

class Sockets {
    constructor(io) {
        this.io = io;
        this.socketEvents();
    }

    socketEvents() {
        //  Manejar conexiones de clientes
        //  Un dispositivo se ha conectado a nuestra aplicacion
        this.io.on('connection', (socket) => {
            console.log('Cliente Conectado: ', socket.id);

            //  Para registrar el inicio de la conexion de la extension por dia
            socket.on('mensaje-bienvenida', async (data) => {
                console.log('Registro de conexion - Cliente Conectado: ', socket.id);
                await saveIntialTime(data.user.id, socket.id);
            });

            // Mensaje que recibe todo el contenido enviado por la extension
            socket.on('mensaje-cliente', async (data) => {
                data.fechaHora = DateTime.now().minus({ hours: 6 });
                // data.fechaHora = DateTime.now()
                const time = DateTime.now();
                const stringDate = `${time.year}-${time.month}-${time.day}  ${time.hour}:${time.minute}:${time.second}`;
                console.log('Envio de informacion: ', data.idTutor, stringDate);
                // Socket emite solo al socket que tiene referenciado

                if (!(await checkExtension(data.idTutor))) {
                    console.log('EXTENSION_APAGADA');
                    return null;
                }

                // Revisar que el dominio este registrado en la lista de paginas
                let dominioPermitido = await checkDomain(data.idTutor, data.dominio);

                if (dominioPermitido === 'NO_ANALIZAR') {
                    console.log('NO_ANALIZAR');
                    return null;
                } else if (dominioPermitido === 'REGISTRAR') {
                    console.log('REGISTRAR');
                    await registrarVisita(data);

                    return null;
                } else if (dominioPermitido === 'ANALIZAR') {
                    console.log('ANALIZAR');
                }

                const datosClasi = new datosClasificacion({
                    idTutor: data.idTutor,
                    url: data.url,
                    noIncidencias: 0,
                    fechaHora: data.fechaHora,
                    dominio: data.dominio,
                });

                let incidencias = await getNumIncidencias(data.idTutor);

                // Enviar al servidor de clasificador
                request.post(
                    // 'https://20.172.186.55:8000/clasificar',
                    'http://127.0.0.1:8000/clasificar',
                    { json: { data } },
                    async (error, response, body) => {
                        if (!error && response.statusCode == 200) {
                            let { segmentosDeContenido, noIncidencias } = organizeContent(
                                body,
                                datosClasi.id
                            );

                            if (incidencias <= segmentosDeContenido.length) {
                                console.log('Guardado', stringDate);
                                datosClasi.noIncidencias = noIncidencias;

                                const savedDataDatosClasificacion =
                                    await datosClasi.save();
                                segmentosDeContenido.forEach(async (e) => {
                                    const savedData = await e.save();
                                });
                            } else {
                                console.log('No guardado', stringDate);
                            }
                        }
                    }
                );

                // IO es para hacer referencia a todos los clientes
                // Conectadas al namespace
                this.io.emit('mensaje-server', data);
            });

            //  Para registrar el tiempo de conexion de la extension por dia
            socket.on('disconnect', (reason) => {
                console.log('Cliente desconectado: ', socket.id);
                findAndUpdate(socket.id);
            });
        });
    }
}

module.exports = Sockets;
