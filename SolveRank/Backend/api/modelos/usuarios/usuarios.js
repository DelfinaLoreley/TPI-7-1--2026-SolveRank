const router = require('express').Router();








//endpoint para obtener todos los usuarios
router.get('/', (req, res) => {
  res.send('Lista de usuarios');
});





module.exports = router;