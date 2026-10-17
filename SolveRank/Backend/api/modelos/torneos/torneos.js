const router = require('express').Router();
const db = require('../../config/db/conexion');
const verificarToken = require('../../middleware/authMiddleware');
const { ROLES, permitirRoles } = require('../../middleware/autorizacion');

const camposTorneo = [
    'idPais', 'idProvicncia', 'idCiudad', 'fecha_Inicio', 'fecha_fin',
    'Fecha_Inicio_Inscripcion', 'Fecha_fin_Inscripcion', 'nombre',
    'Contacto_Organizador', 'descripcion', 'Lugar_Venue',
    'limite_participantes', 'direccion', 'pathImagen'
];

function normalizarIds(ids) {
    if (!Array.isArray(ids)) return null;
    const normalizados = ids.map(Number);
    if (normalizados.some((id) => !Number.isSafeInteger(id) || id <= 0)) return null;
    return [...new Set(normalizados)];
}

async function usuariosConRol(connection, ids, rol) {
    if (!ids.length) return true;
    const marcadores = ids.map(() => '?').join(',');
    const [usuarios] = await connection.execute(
        `SELECT u.idUsuario
         FROM usuarios u
         INNER JOIN tipos_usuarios t ON t.idTipoUsuario = u.idTipoUsuario
         WHERE u.idUsuario IN (${marcadores}) AND LOWER(t.Nombre) = LOWER(?)`,
        [...ids, rol]
    );
    return usuarios.length === ids.length;
}

// Listado público de torneos.
router.get('/', async (req, res) => {
    try {
        const [torneos] = await db.execute(
            `SELECT t.idTorneo, t.nombre, t.descripcion, t.fecha_Inicio,
                    t.fecha_fin, t.Fecha_Inicio_Inscripcion,
                    t.Fecha_fin_Inscripcion, t.limite_participantes,
                    t.pathImagen, t.Lugar_Venue, t.direccion,
                    p.pais, pr.provincia, c.ciudad,
                    COUNT(DISTINCT ux.idUsuario) AS inscriptos
             FROM torneos t
             LEFT JOIN paises p ON p.idPais = t.idPais
             LEFT JOIN provincias pr ON pr.idProvincia = t.idProvicncia
             LEFT JOIN ciudades c ON c.idCiudad = t.idCiudad
             LEFT JOIN usuarios_x_torneo ux ON ux.idTorneo = t.idTorneo
             GROUP BY t.idTorneo
             ORDER BY t.fecha_Inicio`
        );
        return res.json({ torneos });
    } catch (error) {
        console.error('Error al listar torneos:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener los torneos' });
    }
});

// Datos del panel, limitados a los torneos creados por el Organizador actual.
router.get('/mis-torneos', verificarToken, permitirRoles(ROLES.ORGANIZADOR), async (req, res) => {
    try {
        const [torneos] = await db.execute(
            `SELECT t.idTorneo, t.nombre, t.fecha_Inicio, t.fecha_fin,
                    t.Fecha_Inicio_Inscripcion, t.Fecha_fin_Inscripcion,
                    t.limite_participantes, t.pathImagen, t.Lugar_Venue,
                    p.pais, pr.provincia, c.ciudad,
                    COUNT(DISTINCT ux.idUsuario) AS inscriptos
             FROM torneos t
             LEFT JOIN paises p ON p.idPais = t.idPais
             LEFT JOIN provincias pr ON pr.idProvincia = t.idProvicncia
             LEFT JOIN ciudades c ON c.idCiudad = t.idCiudad
             LEFT JOIN usuarios_x_torneo ux ON ux.idTorneo = t.idTorneo
             WHERE t.idUsuario = ?
             GROUP BY t.idTorneo
             ORDER BY t.fecha_Inicio`,
            [req.usuario.idUsuario]
        );
        return res.json({ torneos });
    } catch (error) {
        console.error('Error al listar los torneos del organizador:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener tus torneos' });
    }
});

router.post('/:idTorneo/inscripcion', verificarToken, permitirRoles(ROLES.COMPETIDOR), async (req, res) => {
    const idTorneo = Number(req.params.idTorneo);
    if (!Number.isSafeInteger(idTorneo) || idTorneo <= 0) {
        return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [torneos] = await connection.execute(
            `SELECT idTorneo, limite_participantes,
                    Fecha_Inicio_Inscripcion <= CURDATE()
                    AND Fecha_fin_Inscripcion >= CURDATE() AS inscripcionAbierta
             FROM torneos
             WHERE idTorneo = ?
             FOR UPDATE`,
            [idTorneo]
        );
        if (!torneos.length) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'No se encontró el torneo' });
        }

        const torneo = torneos[0];
        if (!torneo.inscripcionAbierta) {
            await connection.rollback();
            return res.status(400).json({ mensaje: 'La inscripción a este torneo no está abierta' });
        }

        const [inscripcionesPrevias] = await connection.execute(
            'SELECT 1 FROM usuarios_x_torneo WHERE idTorneo = ? AND idUsuario = ?',
            [idTorneo, req.usuario.idUsuario]
        );
        if (inscripcionesPrevias.length) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Ya estás inscripto en este torneo' });
        }

        const [conteos] = await connection.execute(
            'SELECT COUNT(*) AS inscriptos FROM usuarios_x_torneo WHERE idTorneo = ?',
            [idTorneo]
        );
        if (Number(conteos[0].inscriptos) >= Number(torneo.limite_participantes)) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'El torneo ya alcanzó su límite de participantes' });
        }

        await connection.execute(
            'INSERT INTO usuarios_x_torneo (idTorneo, idUsuario) VALUES (?, ?)',
            [idTorneo, req.usuario.idUsuario]
        );
        await connection.commit();
        return res.status(201).json({ mensaje: 'La inscripción se confirmó correctamente' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al confirmar la inscripción al torneo:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya estás inscripto en este torneo' });
        }
        return res.status(500).json({ mensaje: 'No se pudo confirmar la inscripción' });
    } finally {
        connection?.release();
    }
});

router.delete('/:idTorneo/inscripcion', verificarToken, permitirRoles(ROLES.COMPETIDOR), async (req, res) => {
    const idTorneo = Number(req.params.idTorneo);
    if (!Number.isSafeInteger(idTorneo) || idTorneo <= 0) {
        return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    }

    try {
        const [resultado] = await db.execute(
            'DELETE FROM usuarios_x_torneo WHERE idTorneo = ? AND idUsuario = ?',
            [idTorneo, req.usuario.idUsuario]
        );
        if (!resultado.affectedRows) {
            return res.status(404).json({ mensaje: 'No tenés una inscripción para cancelar en este torneo' });
        }
        return res.json({ mensaje: 'La inscripción se canceló correctamente' });
    } catch (error) {
        console.error('Error al cancelar la inscripción al torneo:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo cancelar la inscripción' });
    }
});

// Solo Organizador puede crear torneos y designar sus jueces/delegados.
router.post('/', verificarToken, permitirRoles(ROLES.ORGANIZADOR), async (req, res) => {
    const body = req.body || {};
    const jueces = normalizarIds(body.jueces ?? []);
    const delegados = normalizarIds(body.delegados ?? []);
    if (!jueces || !delegados) {
        return res.status(400).json({ mensaje: 'Las listas de jueces y delegados deben contener IDs válidos' });
    }
    if (jueces.includes(Number(req.usuario.idUsuario)) || delegados.includes(Number(req.usuario.idUsuario))) {
        return res.status(400).json({ mensaje: 'El organizador no puede designarse como juez o delegado' });
    }

    const obligatorios = [
        'idPais', 'idProvicncia', 'idCiudad', 'fecha_Inicio', 'fecha_fin',
        'Fecha_Inicio_Inscripcion', 'Fecha_fin_Inscripcion', 'nombre',
        'Contacto_Organizador', 'limite_participantes', 'direccion'
    ];
    if (obligatorios.some((campo) => body[campo] === undefined || body[campo] === null || body[campo] === '')) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios del torneo' });
    }
    if (typeof body.nombre !== 'string' || body.nombre.trim().length > 100 ||
        typeof body.Contacto_Organizador !== 'string' || body.Contacto_Organizador.trim().length > 250 ||
        typeof body.direccion !== 'string' || body.direccion.trim().length > 150 ||
        !Number.isSafeInteger(Number(body.limite_participantes)) || Number(body.limite_participantes) < 1) {
        return res.status(400).json({ mensaje: 'Hay datos del torneo con formato o longitud inválidos' });
    }
    const fechaInicio = new Date(body.fecha_Inicio);
    const fechaFin = new Date(body.fecha_fin);
    const fechaInscripcionInicio = new Date(body.Fecha_Inicio_Inscripcion);
    const fechaInscripcionFin = new Date(body.Fecha_fin_Inscripcion);
    if ([fechaInicio, fechaFin, fechaInscripcionInicio, fechaInscripcionFin].some((fecha) => Number.isNaN(fecha.getTime())) ||
        fechaInicio >= fechaFin || fechaInscripcionInicio > fechaInscripcionFin ||
        fechaInscripcionFin > fechaInicio) {
        return res.status(400).json({ mensaje: 'Las fechas del torneo o de inscripción no son coherentes' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [ubicaciones] = await connection.execute(
            `SELECT 1
             FROM provincias pr
             INNER JOIN ciudades c ON c.idProvincia = pr.idProvincia
             WHERE pr.idProvincia = ? AND pr.idPais = ? AND c.idCiudad = ?`,
            [Number(body.idProvicncia), Number(body.idPais), Number(body.idCiudad)]
        );
        if (!ubicaciones.length) {
            await connection.rollback();
            return res.status(400).json({ mensaje: 'La ciudad no pertenece a la provincia y país seleccionados' });
        }

        if (!(await usuariosConRol(connection, jueces, ROLES.JUEZ)) ||
            !(await usuariosConRol(connection, delegados, ROLES.DELEGADO))) {
            await connection.rollback();
            return res.status(400).json({ mensaje: 'Cada usuario designado debe tener el rol correspondiente' });
        }

        const columnas = ['idUsuario', ...camposTorneo];
        const valores = [
            req.usuario.idUsuario,
            ...camposTorneo.map((campo) => {
                const valor = body[campo];
                if (['idPais', 'idProvicncia', 'idCiudad', 'limite_participantes'].includes(campo)) {
                    return Number(valor);
                }
                if (['nombre', 'Contacto_Organizador', 'direccion'].includes(campo)) return valor.trim();
                return valor ?? null;
            })
        ];
        const [creacion] = await connection.execute(
            `INSERT INTO torneos (${columnas.join(', ')})
             VALUES (${columnas.map(() => '?').join(', ')})`,
            valores
        );

        for (const idUsuario of jueces) {
            await connection.execute(
                'INSERT INTO jueces_x_torneo (idTorneo, idUsuario) VALUES (?, ?)',
                [creacion.insertId, idUsuario]
            );
        }
        for (const idUsuario of delegados) {
            await connection.execute(
                'INSERT INTO delegados_X_torneo (idtorneo, idUsuario) VALUES (?, ?)',
                [creacion.insertId, idUsuario]
            );
        }

        await connection.commit();
        return res.status(201).json({ mensaje: 'Torneo creado correctamente', idTorneo: creacion.insertId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al crear torneo:', error.message);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ mensaje: 'El país, provincia o ciudad seleccionados no existen o no coinciden' });
        }
        return res.status(500).json({ mensaje: 'No se pudo crear el torneo' });
    } finally {
        connection?.release();
    }
});

module.exports = router;
