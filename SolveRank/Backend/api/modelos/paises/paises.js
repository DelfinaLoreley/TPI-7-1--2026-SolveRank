
const express = require('express');
const router = express.Router();
const db = require('../../config/db/conexion');

router.get('/', async (req, res) => {
    try {
        const [paises] = await db.execute(
            'SELECT idPais, pais FROM paises ORDER BY pais'
        );

        return res.status(200).json({ paises });
    } catch (error) {
        console.error('Error al obtener países:', error.message);

        return res.status(500).json({
            mensaje: 'No se pudieron obtener los países'
        });
    }
});

module.exports = router;
