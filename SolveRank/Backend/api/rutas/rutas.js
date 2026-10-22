const router = require('express').Router();

const usuariosRouter = require('../modelos/usuarios/usuarios');
const torneosRouter = require('../modelos/torneos/torneos');
const generosRouter = require('../modelos/generos/generos');
const paisesRouter = require('../modelos/paises/paises');
const mezclasRouter = require('../modelos/mezclas/mezclas');
const adminController = require('../controladores/adminController');
const verificarToken = require('../middleware/authMiddleware');
const { ROLES, permitirRoles } = require('../middleware/autorizacion');

//ruta para usuarios
router.use('/usuarios', usuariosRouter);
//ruta para torneos
router.use('/torneos', torneosRouter);
//ruta para generos
router.use('/generos', generosRouter);
//ruta para paises
router.use('/paises', paisesRouter);
router.use('/mezclas', mezclasRouter);

// Gestión administrativa: todas las operaciones requieren una sesión de administrador.
const adminRouter = require('express').Router();
adminRouter.use(verificarToken, permitirRoles(ROLES.ADMINISTRADOR));
adminRouter.get('/usuarios', adminController.listarUsuarios);
adminRouter.get('/roles', adminController.listarRoles);
adminRouter.put('/usuarios/:idUsuario/rol', adminController.cambiarRol);
adminRouter.post('/usuarios', adminController.crearUsuario);
router.use('/admin', adminRouter);

module.exports = router;
