
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../config/db/conexion');

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

function crearToken(idUsuario) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado');
    }

    return jwt.sign(
        { idUsuario },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
}

function iniciarGoogle(req, res) {
    const idPais = req.query.idPais || '0';

    if (!/^\d+$/.test(String(idPais))) {
        return res.status(400).json({
            mensaje: 'El país seleccionado no es válido'
        });
    }

    const state = `${crypto.randomBytes(32).toString('hex')}:${idPais}`;

    res.cookie('google_oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
        path: '/api/auth/google'
    });

    const url = googleClient.generateAuthUrl({
        scope: ['openid', 'email', 'profile'],
        state
    });

    return res.redirect(url);
}

async function callbackGoogle(req, res) {
    try {
        const { code, state, error } = req.query;
        const estadoGuardado = req.cookies.google_oauth_state;

        res.clearCookie('google_oauth_state', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/api/auth/google'
        });

        if (error) {
            return res.status(401).json({
                mensaje: 'Se canceló o rechazó el acceso con Google'
            });
        }

        if (
            !code ||
            typeof code !== 'string' ||
            !state ||
            typeof state !== 'string' ||
            !estadoGuardado ||
            state !== estadoGuardado
        ) {
            return res.status(400).json({
                mensaje: 'La solicitud de autenticación no es válida'
            });
        }

        const idPaisTexto = state.split(':').pop();
        const idPais = Number(idPaisTexto);

        if (!Number.isSafeInteger(idPais) || idPais < 0) {
            return res.status(400).json({
                mensaje: 'El país seleccionado no es válido'
            });
        }

        // Intercambiar el código por los tokens de Google
        const { tokens } = await googleClient.getToken(code);

        if (!tokens.id_token) {
            return res.status(401).json({
                mensaje: 'Google no devolvió un token de identidad'
            });
        }

        // Verificar el token de identidad
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const perfil = ticket.getPayload();

        if (!perfil || !perfil.sub || !perfil.email ||
            perfil.email_verified !== true) {
            return res.status(401).json({
                mensaje: 'No se pudo verificar la identidad de Google'
            });
        }

        const googleId = perfil.sub;
        const email = perfil.email.trim().toLowerCase();

        // Buscar primero por el identificador estable de Google
        const [cuentasGoogle] = await db.execute(
            `SELECT idUsuario, Nombre, apellido, email, idPais
             FROM usuarios
             WHERE google_id = ?`,
            [googleId]
        );

        if (cuentasGoogle.length > 0) {
            const usuario = cuentasGoogle[0];

            const token = crearToken(usuario.idUsuario);

            return res.json({
                mensaje: 'Inicio de sesión con Google correcto',
                token,
                usuario: {
                    idUsuario: usuario.idUsuario,
                    nombre: usuario.Nombre,
                    apellido: usuario.apellido,
                    email: usuario.email,
                    idPais: usuario.idPais
                }
            });
        }

        // Buscar una cuenta existente por correo verificado
        const [usuarios] = await db.execute(
            `SELECT idUsuario, Nombre, apellido, email,
                    idPais, google_id
             FROM usuarios
             WHERE email = ?`,
            [email]
        );

        if (usuarios.length > 0) {
            const usuario = usuarios[0];

            // No reemplazar la identidad de otra cuenta de Google
            if (usuario.google_id) {
                return res.status(409).json({
                    mensaje: 'Este correo ya está vinculado a otra cuenta de Google'
                });
            }

            // Vincular Google a la cuenta existente
            await db.execute(
                `UPDATE usuarios
                 SET google_id = ?, avatar_url = ?
                 WHERE idUsuario = ? AND google_id IS NULL`,
                [googleId, perfil.picture || null, usuario.idUsuario]
            );

            // Verificar que el vínculo haya quedado establecido
            const [vinculos] = await db.execute(
                'SELECT google_id FROM usuarios WHERE idUsuario = ?',
                [usuario.idUsuario]
            );

            if (!vinculos.length || vinculos[0].google_id !== googleId) {
                return res.status(409).json({
                    mensaje: 'No se pudo vincular la cuenta de Google'
                });
            }

            const token = crearToken(usuario.idUsuario);

            return res.json({
                mensaje: 'Cuenta de Google vinculada correctamente',
                token,
                usuario: {
                    idUsuario: usuario.idUsuario,
                    nombre: usuario.Nombre,
                    apellido: usuario.apellido,
                    email: usuario.email,
                    idPais: usuario.idPais
                }
            });
        }

        // Si es un usuario nuevo, necesitamos el país
        if (idPais === 0) {
            return res.status(400).json({
                mensaje: 'Seleccioná tu país y volvé a iniciar el registro con Google'
            });
        }

        // Validar el país
        const [paises] = await db.execute(
            'SELECT idPais FROM paises WHERE idPais = ?',
            [idPais]
        );

        if (paises.length === 0) {
            return res.status(400).json({
                mensaje: 'El país seleccionado no existe'
            });
        }

        // Obtener el tipo de usuario predeterminado
        const tipoUsuarioId = Number(process.env.DEFAULT_USER_TYPE_ID);

        if (!Number.isSafeInteger(tipoUsuarioId) || tipoUsuarioId <= 0) {
            throw new Error('DEFAULT_USER_TYPE_ID no está configurado');
        }

        const [tipos] = await db.execute(
            'SELECT idTipoUsuario FROM tipos_usuarios WHERE idTipoUsuario = ?',
            [tipoUsuarioId]
        );

        if (tipos.length === 0) {
            throw new Error('El tipo de usuario predeterminado no existe');
        }

        // Obtener nombre y apellido de Google
        const nombre = (perfil.given_name || '').trim();
        const apellido = (perfil.family_name || '').trim();

        if (
            !nombre ||
            !apellido ||
            nombre.length > 50 ||
            apellido.length > 50 ||
            email.length > 100
        ) {
            return res.status(400).json({
                mensaje: 'Completá un nombre y apellido válidos para crear tu cuenta'
            });
        }

        // Crear la cuenta sin contraseña
        const [resultado] = await db.execute(
            `INSERT INTO usuarios
                (idTipoUsuario, idPais, Nombre, apellido,
                 email, password_hash, google_id, avatar_url)
             VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
            [
                tipoUsuarioId,
                idPais,
                nombre,
                apellido,
                email,
                googleId,
                perfil.picture || null
            ]
        );

        const token = crearToken(resultado.insertId);

        return res.status(201).json({
            mensaje: 'Usuario registrado con Google correctamente',
            token,
            usuario: {
                idUsuario: resultado.insertId,
                nombre,
                apellido,
                email,
                idPais
            }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'La cuenta ya existe o está vinculada a otra identidad'
            });
        }

        console.error('Error en autenticación Google:', error.message);

        return res.status(500).json({
            mensaje: 'Ocurrió un error al autenticar con Google'
        });
    }
}

module.exports = {
    iniciarGoogle,
    callbackGoogle
};
