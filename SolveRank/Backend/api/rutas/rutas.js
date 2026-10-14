const router = require('express').Router();

const usuariosRouter = require('../modelos/usuarios/usuarios');
const torneosRouter = require('../modelos/torneos/torneos');
const generosRouter = require('../modelos/generos/generos');
const paisesRouter = require('../modelos/paises/paises');

//ruta para usuarios
router.use('/usuarios', usuariosRouter);
//ruta para torneos
router.use('/torneos', torneosRouter);
//ruta para generos
router.use('/generos', generosRouter);
//ruta para paises
router.use('/paises', paisesRouter);

module.exports = router;