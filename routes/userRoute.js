const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userSchema = require('../models/userModel');

router.post('/registrarUser', async (req, res) => {
    try {
        //verificamos que tengamos todos los datos
        const { user, email, password } = req.body;
        if (!user || !email || !password) {
            return res.status(400).json({ msg: 'Llena todos los campos' });
        }
        //verificamos que el usuario no exista en la base de datos
        const oldUser = await userSchema.findOne({ email });
        if (oldUser) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }
        //encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(password, salt);
        //creamos el usuario
        const newUser = new userSchema({
            user,
            email,
            password: passwordHashed,
        });

        newUser.save();
        res.json(newUser);
    } catch (error) {}
});

router.post('/loginUser', async (req, res) => {
    const { email, password } = req.body;

    if (email.length == 0 || password.length == 0) {
        return res.status(400).json({ msg: 'Llena los campos' });
    }

    //verificamos que el usuario no exista en la base de datos
    const usuarioExiste = await userSchema.findOne({ email });
    if (!usuarioExiste) {
        return res.status(400).json({ msg: 'El usuario no existe' });
    }
    const match = await bcrypt.compare(password, usuarioExiste.password);

    if (!match) {
        return res.status(400).json({ msg: 'Contraseña incorrecta' });
    }

    //token login exitoso
    const payload = { id: usuarioExiste._id, user: usuarioExiste.user };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
    //regresamos usuario y token
    res.json({
        token,
        user: {
            user: usuarioExiste.user,
            email: usuarioExiste.email,
            id: usuarioExiste._id,
        },
    });
});

module.exports = router;
