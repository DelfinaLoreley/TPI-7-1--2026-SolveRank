const router = require('express').Router();
const db = require('../../config/db/conexion')
const bcrypt = require('bcrypt');


//endpoint para obtener todos los usuarios
router.get('/', (req, res) => {
  res.send('Lista de usuarios');
});





module.exports = router;