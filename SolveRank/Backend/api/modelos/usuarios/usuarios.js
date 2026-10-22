const router = require('express').Router();
const db = require('../../config/db/conexion')
const bcrypt = require('bcrypt');
const verificarToken = require('../../middleware/authMiddleware');
const perfilController = require('../../controladores/perfilController');

router.get('/buscar', perfilController.buscarCompetidores);
router.get('/mi-perfil', verificarToken, perfilController.obtenerMiPerfil);
router.put('/mi-perfil', verificarToken, perfilController.actualizarMiPerfil);
router.get('/perfil/:idUsuario', perfilController.obtenerPerfilPublico);


//endpoint para obtener todos los usuarios
router.get('/', (req, res) => {
  res.send('Lista de usuarios');
});





module.exports = router;
