require('dotenv').config();
const express = require('express');
const { PORT } = process.env;

const app = express();

const rutas = require('./rutas');



//endpoint para saber si el server esta corriendo
app.get('/salud', (req, res) => {
  res.send('¡Hola mundo con Express!');
});

app.use('/api', rutas);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});