
const jwt = require('jsonwebtoken');
const db = require('../config/db/conexion');

async function verificarToken(req, res, next) {
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

        if (!Number.isSafeInteger(Number(datos.idUsuario))) {
            return res.status(401).json({ mensaje: 'La sesión no identifica a un usuario válido' });
        }

        const [usuarios] = await db.execute(
            `SELECT u.idUsuario, u.idTipoUsuario, t.Nombre AS rol
             FROM usuarios u
             INNER JOIN tipos_usuarios t ON t.idTipoUsuario = u.idTipoUsuario
             WHERE u.idUsuario = ?`,
            [datos.idUsuario]
        );
        if (!usuarios.length) return res.status(401).json({ mensaje: 'El usuario ya no existe' });

        req.usuario = usuarios[0];
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'La sesión es inválida o ha vencido' });
        }
        console.error('Error al autenticar la solicitud:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo validar la sesión' });
    }
}

module.exports = verificarToken;

