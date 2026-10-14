
const express = require('express');
const router = express.Router();
const db = require('../../config/db/conexion');

router.get('/', async (req, res) => {
    try {
        const [generos] = await db.execute(
            'SELECT id, genero FROM generos ORDER BY id'
        );

        return res.status(200).json({ generos });
    } catch (error) {
        console.error('Error al obtener géneros:', error.message);

        return res.status(500).json({
            mensaje: 'No se pudieron obtener los géneros'
        });
    }
});

module.exports = router;
