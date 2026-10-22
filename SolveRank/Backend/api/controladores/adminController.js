const bcrypt = require('bcrypt');
const db = require('../config/db/conexion');

async function listarUsuarios(req, res) {
    try {
        const buscar = typeof req.query.buscar === 'string' ? req.query.buscar.trim() : '';
        if (buscar.length > 100) return res.status(400).json({ mensaje: 'La búsqueda es demasiado larga' });
        const parametros = [];
        let filtro = '';
        if (buscar) {
            filtro = "WHERE CONCAT_WS(' ', u.Nombre, u.apellido, u.email) LIKE ?";
            parametros.push(`%${buscar}%`);
        }
        const [usuarios] = await db.execute(
            `SELECT u.idUsuario, u.Nombre AS nombre, u.apellido, u.email,
                    u.idPais, u.idTipoUsuario, t.Nombre AS rol, u.wcaid
             FROM usuarios u
             INNER JOIN tipos_usuarios t ON t.idTipoUsuario = u.idTipoUsuario
             ${filtro}
             ORDER BY u.apellido, u.Nombre
             LIMIT 30`, parametros);
        return res.json({ usuarios });
    } catch (error) {
        console.error('Error al listar usuarios:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener los usuarios' });
    }
}

async function listarRoles(req, res) {
    try {
        const [roles] = await db.execute(
            'SELECT idTipoUsuario, Nombre AS nombre FROM tipos_usuarios ORDER BY idTipoUsuario'
        );
        return res.json({ roles });
    } catch (error) {
        console.error('Error al listar roles:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener los roles' });
    }
}

async function cambiarRol(req, res) {
    const idUsuario = Number(req.params.idUsuario);
    const { idTipoUsuario } = req.body || {};
    const tipoId = Number(idTipoUsuario);
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0 ||
        !Number.isSafeInteger(tipoId) || tipoId <= 0) {
        return res.status(400).json({ mensaje: 'El usuario o rol indicado no es válido' });
    }
    if (idUsuario === Number(req.usuario.idUsuario)) {
        return res.status(400).json({ mensaje: 'No podés cambiar tu propio rol' });
    }
    try {
        const [tipos] = await db.execute(
            'SELECT idTipoUsuario, Nombre FROM tipos_usuarios WHERE idTipoUsuario = ?', [tipoId]);
        if (!tipos.length) return res.status(400).json({ mensaje: 'El rol indicado no existe' });
        const [resultado] = await db.execute(
            'UPDATE usuarios SET idTipoUsuario = ? WHERE idUsuario = ?', [tipoId, idUsuario]);
        if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        return res.json({ mensaje: 'Rol actualizado correctamente', rol: tipos[0].Nombre });
    } catch (error) {
        console.error('Error al cambiar rol:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo cambiar el rol' });
    }
}

async function crearUsuario(req, res) {
    const { nombre, apellido, email, password, idPais, idGenero, wcaid, fechaNacimiento, idTipoUsuario } = req.body || {};
    const tipoId = Number(idTipoUsuario);
    const paisId = Number(idPais);
    const generoId = Number(idGenero || 1);
    const correo = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 50 ||
        typeof apellido !== 'string' || !apellido.trim() || apellido.trim().length > 50 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 100 ||
        typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 ||
        !Number.isSafeInteger(paisId) || paisId <= 0 ||
        !Number.isSafeInteger(generoId) || generoId <= 0 ||
        !Number.isSafeInteger(tipoId) || tipoId <= 0) {
        return res.status(400).json({ mensaje: 'Revisá los datos obligatorios del usuario' });
    }
    try {
        const [referencias] = await db.execute(
            `SELECT
                (SELECT COUNT(*) FROM tipos_usuarios WHERE idTipoUsuario = ?) AS rol,
                (SELECT COUNT(*) FROM paises WHERE idPais = ?) AS pais,
                (SELECT COUNT(*) FROM generos WHERE id = ?) AS genero`,
            [tipoId, paisId, generoId]);
        if (!referencias[0].rol || !referencias[0].pais || !referencias[0].genero) {
            return res.status(400).json({ mensaje: 'El rol, país o género indicado no existe' });
        }
        const hash = await bcrypt.hash(password, 12);
        const [resultado] = await db.execute(
            `INSERT INTO usuarios
                (idTipoUsuario, idPais, idGenero, wcaid, Nombre, apellido,
                 fecha_Nacimiento, email, password_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tipoId, paisId, generoId, wcaid || null, nombre.trim(), apellido.trim(), fechaNacimiento || null, correo, hash]);
        return res.status(201).json({ mensaje: 'Usuario creado correctamente', idUsuario: resultado.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo o WCA ID' });
        console.error('Error al crear usuario:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo crear el usuario' });
    }
}

module.exports = { listarUsuarios, listarRoles, cambiarRol, crearUsuario };
