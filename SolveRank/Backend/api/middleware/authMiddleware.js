
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const encabezado = req.headers.authorization;

    if (!encabezado || !encabezado.startsWith('Bearer ')) {
        return res.status(401).json({
            mensaje: 'No se proporcionó un token de autenticación'
        });
    }

    const token = encabezado.substring(7);

    try {
        const datos = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = datos;

        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: 'Token inválido o vencido'
        });
    }
}

module.exports = verificarToken;
