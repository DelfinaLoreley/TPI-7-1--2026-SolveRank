const express = require('express');

const { registro, login, miusuario, completarRegistroGoogle, setPassword, logout } = require('../controladores/authController');
const verificarToken = require('../middleware/authMiddleware');

const {
    iniciarGoogle,
    callbackGoogle
} = require('../controladores/googleController');

const router = express.Router();

router.post('/registro', registro);
router.post('/login', login);
router.post('/logout', verificarToken, logout);
router.post('/setPassword', verificarToken, setPassword);
router.get('/miusuario', verificarToken, miusuario);
router.patch('/completar-registro-google', verificarToken, completarRegistroGoogle);
router.get('/google', iniciarGoogle);
router.get('/google/callback', callbackGoogle);

module.exports = router;