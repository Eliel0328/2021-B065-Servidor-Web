//  Configuracion de SocketIO con Express
//  Servidor de Express
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const Sockets = require('./sockets');
const cors = require('cors');
const mongoose = require('mongoose');
const tutorModel = require('./tutorModel');
const UserRoute = require(path.resolve(__dirname, '../routes/userRoute'));
const tutorRoute = require(path.resolve(__dirname, '../routes/tutorRoute'));
const paginaRoute = require(path.resolve(__dirname, '../routes/paginaRoute'));
const datosclasificacionRoute = require(path.resolve(__dirname, '../routes/datosclasificacionRoute'));
const segmentoContenidoRoute = require(path.resolve(__dirname, '../routes/segmentoContenidoRoute'));
const dashboardRoute = require(path.resolve(__dirname, '../routes/dashboardRoute'));

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 4000;

        // HTTP Server
        //  Servidor de sockets
        this.server = http.createServer(this.app);

        //  Configuracion de socket server
        this.io = socketIO(this.server, {
            /* Configuraciones */
        });
    }

    //  Desplegar el directorio publico
    middleware() {
        this.app.use(express.static(path.resolve(__dirname, '../public')));

        // Configurar CORS
        this.app.use(cors());
    }

    //  Configurar sockets
    configureSockets() {
        new Sockets(this.io);
    }

    inicioMongo() {
        //Conexion base de datos

        mongoose.connect(
            process.env.MONGO_URI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            },
            (err) => {
                if (err) throw err;
                console.log('MongoDB: Conexión establecida');
            }
        );
    }

    //  Iniciar server
    execute() {
        // Iniciar middleware
        this.middleware();

        //  Iniciar sockets
        this.configureSockets();
        //  Iniciar base de datos
        this.inicioMongo();
        //  Rutas
        this.app.use(express.json());
        this.app.use('/', UserRoute);
        this.app.use('/', tutorRoute);
        this.app.use('/', paginaRoute);
        this.app.use('/', datosclasificacionRoute);
        this.app.use('/', segmentoContenidoRoute);
        this.app.use('/', dashboardRoute);
        //  Puerto en el que corre el servidor
        this.server.listen(this.port, () => {
            console.log('Server Puerto: ', this.port);
        });
    }
}

module.exports = Server;
