require('dotenv').config();

const db = require('./config/db/conexion');
const express = require('express');
const { PORT } = process.env;
const cookieParser = require('cookie-parser');
const app = express();
app.use(express.json());
app.use(cookieParser());


const authRoutes = require('./rutas/authRutas');
const rutas = require('./rutas/rutas');



//endpoint para saber si el server esta corriendo
app.get('/salud', (req, res) => {
  res.send('¡Hola mundo con Express!');
});

app.get('/saluddb', async (req, res) => {
    try {
        await db.query('SELECT 1');

        res.json({
            mensaje: 'Conexión a MySQL correcta'
        });
    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);

        res.status(500).json({
            mensaje: 'No se pudo conectar con la base de datos'
        });
    }
});

app.use('/api', rutas);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});