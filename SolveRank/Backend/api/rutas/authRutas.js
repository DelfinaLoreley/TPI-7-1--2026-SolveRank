const express = require('express');

const { registro, login, miusuario, setPassword } = require('../controladores/authController');
const verificarToken = require('../middleware/authMiddleware');

const {
    iniciarGoogle,
    callbackGoogle
} = require('../controladores/googleController');

const router = express.Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/miusuario', verificarToken, miusuario);
router.post('/setPassword', verificarToken, setPassword);
router.get('/google', iniciarGoogle);
router.get('/google/callback', callbackGoogle);

module.exports = router;
