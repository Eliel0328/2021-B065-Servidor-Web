var request = require('request');
const segmentoContenido = require('../models/segmentoContenidoModel');
const datosClasificacion = require('../models/datosclasificacionModel');
const pagina = require('../models/paginaModel');
const tutor = require('../models/tutorModel');
const visitaNoPermitida = require('../models/visitaNoPermitidaModel');
const tiempoDeConexion = require('./tiempoDeConexionModel');

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
        if (dominio === 'localhost') return 'NO_ANALIZAR';

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
        if (aux >= 2) {
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
        const datos = new tiempoDeConexion({
            idTutor: idTutor,
            idSocket: idSocket,
            tiempo: 0,
            fecha: new Date(),
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

        let aux = Math.abs(new Date().getTime() - datos[0].fecha.getTime()) / 1000;

        const updateDatos = await tiempoDeConexion.updateOne(
            { _id: datos[0]._id },
            {
                $set: {
                    tiempo: aux,
                },
            }
        );
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
                await saveIntialTime(data.user.id, socket.id);
            });

            // Mensaje que recibe todo el contenido enviado por la extension
            socket.on('mensaje-cliente', async (data) => {
                console.log('Envio de informacion: ', data.idTutor, data.fechaHora);
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
                                console.log('Guardado', data.fechaHora);
                                datosClasi.noIncidencias = noIncidencias;

                                const savedDataDatosClasificacion =
                                    await datosClasi.save();
                                segmentosDeContenido.forEach(async (e) => {
                                    const savedData = await e.save();
                                });
                            } else {
                                console.log('No guardado', data.fechaHora);
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
