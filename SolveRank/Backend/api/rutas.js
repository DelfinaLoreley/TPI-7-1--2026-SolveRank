const router = require('express').Router();

const usuariosRouter = require('./modelos/usuarios/usuarios');
const torneosRouter = require('./modelos/torneos/torneos');

//ruta para usuarios
router.use('/usuarios', usuariosRouter);
//ruta para torneos
router.use('/torneos', torneosRouter);

module.exports = router;