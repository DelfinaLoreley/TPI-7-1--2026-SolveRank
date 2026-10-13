const { guardarToken, borrarToken } = require('../config/auth-cookie');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db/conexion');


function logout(req, res) {
    borrarToken(res);

    return res.json({
        mensaje: 'Sesión cerrada correctamente'
    });
}


async function registro(req, res) {
    try {
        const {
            nombre,
            apellido,
            email,
            password,
            idPais,
            fechaNacimiento
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !apellido || !email || !password || !idPais) {
            return res.status(400).json({
                mensaje: 'Completá todos los campos obligatorios'
            });
        }

        // Validar longitudes de nombre y apellido
        if (nombre.trim().length > 50 || apellido.trim().length > 50) {
            return res.status(400).json({
                mensaje: 'El nombre y el apellido admiten hasta 50 caracteres'
            });
        }

        // Validar correo
        const correo = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
            correo.length > 100) {
            return res.status(400).json({
                mensaje: 'El correo electrónico no es válido'
            });
        }

        // Validar contraseña
        if (typeof password !== 'string' ||
            password.length < 8 ||
            Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 8 caracteres y como máximo 72 bytes'
            });
        }

        // Validar país
        const paisId = Number(idPais);

        if (!Number.isSafeInteger(paisId) || paisId <= 0) {
            return res.status(400).json({
                mensaje: 'El país seleccionado no es válido'
            });
        }

        // Validar fecha opcional
        let fecha = null;

        if (fechaNacimiento) {
            if (typeof fechaNacimiento !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
                return res.status(400).json({
                    mensaje: 'La fecha debe tener el formato AAAA-MM-DD'
                });
            }

            const date = new Date(`${fechaNacimiento}T00:00:00Z`);

            if (Number.isNaN(date.getTime()) ||
                date.toISOString().slice(0, 10) !== fechaNacimiento) {
                return res.status(400).json({
                    mensaje: 'La fecha de nacimiento no es válida'
                });
            }

            if (fechaNacimiento > new Date().toISOString().slice(0, 10)) {
                return res.status(400).json({
                    mensaje: 'La fecha de nacimiento no puede ser futura'
                });
            }

            fecha = fechaNacimiento;
        }

        // Obtener el tipo de usuario configurado en el servidor
        const tipoUsuarioId = Number(process.env.DEFAULT_USER_TYPE_ID);

        if (!Number.isSafeInteger(tipoUsuarioId) || tipoUsuarioId <= 0) {
            console.error('DEFAULT_USER_TYPE_ID no está configurado correctamente');

            return res.status(500).json({
                mensaje: 'Error de configuración del servidor'
            });
        }

        // Comprobar que exista el país
        const [paises] = await db.execute(
            'SELECT idPais FROM paises WHERE idPais = ?',
            [paisId]
        );

        if (paises.length === 0) {
            return res.status(400).json({
                mensaje: 'El país seleccionado no existe'
            });
        }

        // Comprobar que exista el tipo de usuario
        const [tipos] = await db.execute(
            'SELECT idTipoUsuario FROM tipos_usuarios WHERE idTipoUsuario = ?',
            [tipoUsuarioId]
        );

        if (tipos.length === 0) {
            console.error('No existe el tipo de usuario configurado');

            return res.status(500).json({
                mensaje: 'Error de configuración del servidor'
            });
        }

        // Comprobar si el correo ya está registrado
        const [usuarios] = await db.execute(
            'SELECT idUsuario FROM usuarios WHERE email = ?',
            [correo]
        );

        if (usuarios.length > 0) {
            return res.status(409).json({
                mensaje: 'No se pudo registrar la cuenta con ese correo'
            });
        }

        // Generar el hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Crear el usuario
        const [resultado] = await db.execute(
            `INSERT INTO usuarios
                (idTipoUsuario, idPais, Nombre, apellido,
                 fecha_Nacimiento, email, password_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                tipoUsuarioId,
                paisId,
                nombre.trim(),
                apellido.trim(),
                fecha,
                correo,
                passwordHash
            ]
        );

        // Generar el JWT de acceso
        const token = jwt.sign(
            { idUsuario: resultado.insertId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // Guardar el token en la cookie
        guardarToken(res, token);

        return res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            //token,
            usuario: {
                idUsuario: resultado.insertId,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: correo,
                idPais: paisId
            }
        });

    } catch (error) {
        // La restricción UNIQUE también protege contra registros simultáneos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'No se pudo registrar la cuenta con ese correo'
            });
        }

        console.error('Error en el registro:', error.message);

        return res.status(500).json({
            mensaje: 'Ocurrió un error al registrar el usuario'
        });
    }
}


async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validar los datos recibidos
        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                mensaje: 'Ingresá el correo y la contraseña'
            });
        }

        const correo = email.trim().toLowerCase();

        // Buscar el usuario por correo
        const [usuarios] = await db.execute(
            `SELECT idUsuario, Nombre, apellido, email,
                    idPais, password_hash
             FROM usuarios
             WHERE email = ?`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = usuarios[0];

        // Si no tiene contraseña, puede ser una cuenta exclusiva de Google
        if (!usuario.password_hash) {
            return res.status(401).json({
                mensaje: 'Esta cuenta no tiene contraseña configurada'
            });
        }

        // Comparar la contraseña con el hash almacenado
        const coincide = await bcrypt.compare(
            password,
            usuario.password_hash
        );

        if (!coincide) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        // Comprobar que el secreto esté configurado
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET no está configurado');

            return res.status(500).json({
                mensaje: 'Error de configuración del servidor'
            });
        }

        // Crear el JWT
        const token = jwt.sign(
            { idUsuario: usuario.idUsuario },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // Guardar el token en la cookie
        guardarToken(res, token);

        // Devolver los datos públicos del usuario
        return res.json({
            mensaje: 'Inicio de sesión correcto',
            //token,
            usuario: {
                idUsuario: usuario.idUsuario,
                nombre: usuario.Nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                idPais: usuario.idPais
            }
        });

    } catch (error) {
        console.error('Error en el login:', error.message);

        return res.status(500).json({
            mensaje: 'Ocurrió un error al iniciar sesión'
        });
    }
}


async function miusuario(req, res) {
    try {
        const [usuarios] = await db.execute(
            `SELECT
                idUsuario,
                idTipoUsuario,
                idPais,
                Nombre,
                apellido,
                fecha_Nacimiento,
                email,
                avatar_url
            FROM usuarios
            WHERE idUsuario = ?;`,
            [req.usuario.idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: 'El usuario ya no existe'
            });
        }

        const usuario = usuarios[0];

        return res.json({
        usuario: {
            idUsuario: usuario.idUsuario,
            idTipoUsuario: usuario.idTipoUsuario,
            idPais: usuario.idPais,
            nombre: usuario.Nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            fecha_Nacimiento: usuario.fecha_Nacimiento,
            avatar_url: usuario.avatar_url
        }
        });
    } catch (error) {
        console.error('Error al consultar el usuario:', error.message);

        return res.status(500).json({
            mensaje: 'No se pudo consultar el usuario'
        });
    }
}


async function setPassword(req, res) {
    try {
        const { password } = req.body;

        if (
            typeof password !== 'string' ||
            password.length < 8 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 8 caracteres y como máximo 72 bytes'
            });
        }

        // Buscar la cuenta autenticada
        const [usuarios] = await db.execute(
            `SELECT idUsuario, password_hash
             FROM usuarios
             WHERE idUsuario = ?`,
            [req.usuario.idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        // No reemplazar una contraseña que ya existe
        if (usuarios[0].password_hash) {
            return res.status(409).json({
                mensaje: 'La cuenta ya tiene una contraseña configurada'
            });
        }

        // Generar el hash
        const passwordHash = await bcrypt.hash(password, 12);

        // Guardar la contraseña sin modificar el vínculo con Google
        const [resultado] = await db.execute(
            `UPDATE usuarios
             SET password_hash = ?
             WHERE idUsuario = ?
               AND password_hash IS NULL`,
            [passwordHash, req.usuario.idUsuario]
        );

        if (resultado.affectedRows !== 1) {
            return res.status(409).json({
                mensaje: 'No se pudo configurar la contraseña. Volvé a intentarlo.'
            });
        }

        return res.json({
            mensaje: 'Contraseña configurada correctamente'
        });

    } catch (error) {
        console.error('Error al configurar contraseña:', error.message);

        return res.status(500).json({
            mensaje: 'No se pudo configurar la contraseña'
        });
    }
}


module.exports = { registro, login, miusuario, setPassword, logout };
