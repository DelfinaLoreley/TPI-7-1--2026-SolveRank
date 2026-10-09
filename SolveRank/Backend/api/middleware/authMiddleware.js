
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const encabezado = req.headers.authorization;

    // Preferir la cookie para el navegador.
    // Aceptar Bearer para clientes como Postman.
    const token = req.cookies?.solverank_token ||
        (encabezado?.startsWith('Bearer ')
            ? encabezado.substring(7)
            : null);

    if (!token) {
        return res.status(401).json({
            mensaje: 'No hay una sesión autenticada'
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET no está configurado');

        return res.status(500).json({
            mensaje: 'Error de configuración del servidor'
        });
    }

    try {
        const datos = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = datos;

        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: 'La sesión es inválida o ha vencido'
        });
    }
}

module.exports = verificarToken;

