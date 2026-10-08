const router = require('express').Router();




const usuariosRouter = require('./modelos/usuarios/usuarios');


//ruta para usuarios
router.use('/usuarios', usuariosRouter);

module.exports = router;