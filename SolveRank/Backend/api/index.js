require('dotenv').config();
const express = require('express');
const { PORT } = process.env;

const app = express();

app.get('/', (req, res) => {
  res.send('¡Hola mundo con Express!');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});