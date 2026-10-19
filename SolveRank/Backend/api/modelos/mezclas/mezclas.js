const router = require('express').Router();
const path = require('path');
const { pathToFileURL } = require('url');
const db = require('../../config/db/conexion');
const verificarToken = require('../../middleware/authMiddleware');
const { ROLES, permitirRoles } = require('../../middleware/autorizacion');

const MAX_GRUPO_LENGTH = 50;
const MAX_MEZCLAS = 200;
const EVENTOS = new Map([
    ['2x2x2', '222'], ['2x2', '222'],
    ['3x3x3', '333'], ['3x3', '333'],
    ['4x4x4', '444'], ['4x4', '444'],
    ['5x5x5', '555'], ['5x5', '555'],
    ['6x6x6', '666'], ['6x6', '666'],
    ['7x7x7', '777'], ['7x7', '777'],
    ['skewb', 'skewb'], ['pyraminx', 'pyram'], ['megaminx', 'minx'],
    ['3x3 oh', '333oh'], ['3x3 bld', '333bf'],
    ['4x4 bld', '444bf'], ['5x5 bld', '555bf'],
    ['clock', 'clock'], ['square-1', 'sq1'], ['square 1', 'sq1']
]);

let motorPromise;
function cargarMotor() {
    if (!motorPromise) {
        const archivo = path.resolve(__dirname, '../../../../port/dist/index.js');
        motorPromise = import(pathToFileURL(archivo).href).catch((error) => {
            motorPromise = null;
            throw error;
        });
    }
    return motorPromise;
}

function validarId(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function normalizarCategoria(nombre) {
    return String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function normalizarGrupo(valor) {
    const grupo = typeof valor === 'string' && valor.trim() ? valor.trim() : 'A';
    return grupo.length <= MAX_GRUPO_LENGTH && /^[A-Za-z0-9_-]+$/.test(grupo) ? grupo : null;
}

async function obtenerDatosRonda(idTorneo, idRonda) {
    const [filas] = await db.execute(
        `SELECT t.idTorneo, t.idUsuario AS idOrganizador,
                (CURDATE() > t.Fecha_fin_Inscripcion) AS inscripcionFinalizada,
                rct.idCategoria, c.categoria,
                f.formato, f.cantidad_Solves AS cantidadIntentos
         FROM torneos t
         INNER JOIN rondas_x_categoria_x_torneo rct
            ON rct.idTorneo = t.idTorneo AND rct.idRonda = ?
         INNER JOIN categorias c ON c.idCategoria = rct.idCategoria
         LEFT JOIN formato_x_categoria_x_torneo fct
            ON fct.idTorneo = t.idTorneo AND fct.idCategoria = rct.idCategoria
         LEFT JOIN formatos f ON f.idFormato = fct.idFormato
         WHERE t.idTorneo = ?`,
        [idRonda, idTorneo]
    );
    return filas[0] || null;
}

function puedeGestionar(usuario, torneo) {
    return usuario.rol === ROLES.ORGANIZADOR &&
        Number(torneo.idOrganizador) === Number(usuario.idUsuario);
}

async function puedeConsultar(usuario, torneo) {
    if (usuario.rol === ROLES.ORGANIZADOR && Number(torneo.idOrganizador) === Number(usuario.idUsuario)) return true;
    if (usuario.rol !== ROLES.DELEGADO) return false;
    const [filas] = await db.execute(
        'SELECT 1 FROM delegados_X_torneo WHERE idtorneo = ? AND idUsuario = ? LIMIT 1',
        [torneo.idTorneo, usuario.idUsuario]
    );
    return filas.length > 0;
}

function eventoDe(categoria) {
    return EVENTOS.get(normalizarCategoria(categoria)) || null;
}

// Indica si el organizador dueño o un delegado designado puede ver las mezclas.
router.get('/torneos/:idTorneo/acceso', verificarToken, permitirRoles(ROLES.ORGANIZADOR, ROLES.DELEGADO), async (req, res) => {
    const idTorneo = validarId(req.params.idTorneo);
    if (!idTorneo) return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    try {
        const [torneos] = await db.execute(
            'SELECT idTorneo, idUsuario AS idOrganizador FROM torneos WHERE idTorneo = ?',
            [idTorneo]
        );
        if (!torneos.length) return res.status(404).json({ mensaje: 'No se encontró el torneo' });
        const puedeVer = await puedeConsultar(req.usuario, torneos[0]);
        return res.json({ puedeVerMezclas: puedeVer });
    } catch (error) {
        console.error('Error al verificar acceso a mezclas:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo verificar el acceso a las mezclas' });
    }
});

// Lista todas las mezclas y renderiza el SVG para cada secuencia guardada.
router.get('/torneos/:idTorneo/listado', verificarToken, permitirRoles(ROLES.ORGANIZADOR, ROLES.DELEGADO), async (req, res) => {
    const idTorneo = validarId(req.params.idTorneo);
    if (!idTorneo) return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    try {
        const [torneos] = await db.execute(
            'SELECT idTorneo, idUsuario AS idOrganizador FROM torneos WHERE idTorneo = ?',
            [idTorneo]
        );
        if (!torneos.length) return res.status(404).json({ mensaje: 'No se encontró el torneo' });
        if (!(await puedeConsultar(req.usuario, torneos[0]))) {
            return res.status(403).json({ mensaje: 'No tenés acceso a las mezclas de este torneo' });
        }
        const [filas] = await db.execute(
            `SELECT m.idRonda, m.grupo, m.numeroMezcla, m.mezcla,
                    m.versionGenerador, c.idCategoria, c.categoria, r.ronda
             FROM mezclas m
             INNER JOIN rondas_x_categoria_x_torneo rct
                ON rct.idTorneo = m.idTorneo AND rct.idRonda = m.idRonda
             INNER JOIN categorias c ON c.idCategoria = rct.idCategoria
             INNER JOIN rondas r ON r.idRonda = rct.idRonda
             WHERE m.idTorneo = ?
             ORDER BY c.idCategoria, m.idRonda, m.grupo, m.numeroMezcla`,
            [idTorneo]
        );
        const motor = filas.length ? await cargarMotor() : null;
        const mezclas = [];
        for (const fila of filas) {
            const evento = eventoDe(fila.categoria);
            let svg = null;
            if (evento) {
                try {
                    svg = await motor.renderScrambleSvg({ event: evento, scramble: fila.mezcla });
                } catch (error) {
                    console.error(`No se pudo renderizar el SVG de la mezcla ${fila.idRonda}/${fila.numeroMezcla}:`, error.message);
                }
            }
            mezclas.push({ ...fila, svg });
        }
        return res.json({ oficialWCA: false, mezclas });
    } catch (error) {
        console.error('Error al listar mezclas del torneo:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener las mezclas del torneo' });
    }
});

// Genera un lote no oficial una sola vez por torneo, ronda y grupo.
router.post('/torneos/:idTorneo/rondas/:idRonda/generar', verificarToken, permitirRoles(ROLES.ORGANIZADOR), async (req, res) => {
    const idTorneo = validarId(req.params.idTorneo);
    const idRonda = validarId(req.params.idRonda);
    const grupo = normalizarGrupo(req.body?.grupo);
    if (!idTorneo || !idRonda || !grupo) {
        return res.status(400).json({ mensaje: 'El torneo, la ronda o el grupo no son válidos' });
    }

    let connection;
    try {
        const ronda = await obtenerDatosRonda(idTorneo, idRonda);
        if (!ronda) return res.status(404).json({ mensaje: 'No se encontró la ronda en ese torneo' });
        if (!puedeGestionar(req.usuario, { ...ronda, idTorneo })) {
            return res.status(403).json({ mensaje: 'Solo el organizador dueño del torneo puede generar mezclas' });
        }
        if (!Boolean(ronda.inscripcionFinalizada)) {
            return res.status(403).json({ mensaje: 'La generación se habilita cuando finaliza el período de inscripción' });
        }

        const evento = eventoDe(ronda.categoria);
        if (!evento) {
            return res.status(422).json({ mensaje: `La categoría "${ronda.categoria}" no está soportada por este port` });
        }
        const [existentes] = await db.execute(
            'SELECT COUNT(*) AS total FROM mezclas WHERE idTorneo = ? AND idRonda = ? AND grupo = ?',
            [idTorneo, idRonda, grupo]
        );
        if (Number(existentes[0].total) > 0) {
            return res.status(409).json({ mensaje: 'Este grupo ya tiene mezclas. No se regeneran ni reemplazan.' });
        }

        const motor = await cargarMotor();
        const opciones = { event: evento };
        const cantidadIntentos = Number(ronda.cantidadIntentos);
        if (Number.isInteger(cantidadIntentos) && cantidadIntentos > 0) {
            if (cantidadIntentos > 100) {
                return res.status(422).json({ mensaje: 'La cantidad de intentos de la ronda supera el límite del generador' });
            }
            opciones.count = cantidadIntentos;
        }
        const lote = await motor.generateScrambles(opciones);
        const secuencias = lote.attempts.flatMap((intento) => intento.scrambles.map((mezcla) => mezcla.text));
        if (!secuencias.length || secuencias.length > MAX_MEZCLAS) {
            return res.status(422).json({ mensaje: 'El port devolvió una cantidad de mezclas no válida' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        await connection.execute('SELECT idTorneo FROM torneos WHERE idTorneo = ? FOR UPDATE', [idTorneo]);
        const [repetidas] = await connection.execute(
            'SELECT 1 FROM mezclas WHERE idTorneo = ? AND idRonda = ? AND grupo = ? LIMIT 1 FOR UPDATE',
            [idTorneo, idRonda, grupo]
        );
        if (repetidas.length) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Otro proceso ya generó mezclas para este grupo' });
        }

        const versionGenerador = `tnoodle-native ${lote.engine.portVersion} (motor ${lote.engine.version})`;
        const filas = secuencias.map((mezcla, indice) => [
            idTorneo, req.usuario.idUsuario, idRonda, grupo, indice + 1, mezcla, versionGenerador
        ]);
        await connection.query(
            `INSERT INTO mezclas
                (idTorneo, idUsuario, idRonda, grupo, numeroMezcla, mezcla, versionGenerador)
             VALUES ?`,
            [filas]
        );
        await connection.commit();

        return res.status(201).json({
            mensaje: 'Mezclas generadas y guardadas. Generador no oficial de la WCA.',
            oficialWCA: false,
            idTorneo,
            idRonda,
            categoria: ronda.categoria,
            evento,
            grupo,
            cantidad: secuencias.length,
            intentos: lote.count,
            versionGenerador,
            mezclas: secuencias.map((mezcla, indice) => ({ numeroMezcla: indice + 1, mezcla }))
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al generar mezclas con el port:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Este grupo ya tiene mezclas y no se pueden reemplazar' });
        }
        if (error.code === 'QUEUE_FULL' || error.code === 'TIMEOUT') {
            return res.status(503).json({ mensaje: 'El generador está ocupado o tardó demasiado. Volvé a intentar más tarde.' });
        }
        return res.status(500).json({ mensaje: 'No se pudieron generar las mezclas' });
    } finally {
        connection?.release();
    }
});

// Devuelve las secuencias guardadas. Las mezclas quedan ocultas a competidores.
router.get('/torneos/:idTorneo/rondas/:idRonda', verificarToken, async (req, res) => {
    const idTorneo = validarId(req.params.idTorneo);
    const idRonda = validarId(req.params.idRonda);
    const grupo = normalizarGrupo(req.query.grupo);
    if (!idTorneo || !idRonda || !grupo) {
        return res.status(400).json({ mensaje: 'El torneo, la ronda o el grupo no son válidos' });
    }
    try {
        const ronda = await obtenerDatosRonda(idTorneo, idRonda);
        if (!ronda) return res.status(404).json({ mensaje: 'No se encontró la ronda en ese torneo' });
        if (!(await puedeConsultar(req.usuario, { ...ronda, idTorneo }))) {
            return res.status(403).json({ mensaje: 'No tenés acceso a las mezclas de este torneo' });
        }
        const [mezclas] = await db.execute(
            `SELECT numeroMezcla, mezcla, versionGenerador, generadoEn
             FROM mezclas
             WHERE idTorneo = ? AND idRonda = ? AND grupo = ?
             ORDER BY numeroMezcla`,
            [idTorneo, idRonda, grupo]
        );
        return res.json({ oficialWCA: false, categoria: ronda.categoria, grupo, mezclas });
    } catch (error) {
        console.error('Error al obtener mezclas:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener las mezclas' });
    }
});

// Calcula el SVG cuando se solicita; solo recibe texto que ya está guardado.
router.get('/torneos/:idTorneo/rondas/:idRonda/:numeroMezcla/svg', verificarToken, async (req, res) => {
    const idTorneo = validarId(req.params.idTorneo);
    const idRonda = validarId(req.params.idRonda);
    const numeroMezcla = validarId(req.params.numeroMezcla);
    const grupo = normalizarGrupo(req.query.grupo);
    if (!idTorneo || !idRonda || !numeroMezcla || !grupo) {
        return res.status(400).json({ mensaje: 'El torneo, la ronda, el grupo o el número de mezcla no son válidos' });
    }
    try {
        const ronda = await obtenerDatosRonda(idTorneo, idRonda);
        if (!ronda) return res.status(404).json({ mensaje: 'No se encontró la ronda en ese torneo' });
        if (!(await puedeConsultar(req.usuario, { ...ronda, idTorneo }))) {
            return res.status(403).json({ mensaje: 'No tenés acceso a las mezclas de este torneo' });
        }
        const evento = eventoDe(ronda.categoria);
        if (!evento) return res.status(422).json({ mensaje: 'La categoría no está soportada por este port' });
        const [filas] = await db.execute(
            `SELECT mezcla FROM mezclas
             WHERE idTorneo = ? AND idRonda = ? AND grupo = ? AND numeroMezcla = ?`,
            [idTorneo, idRonda, grupo, numeroMezcla]
        );
        if (!filas.length) return res.status(404).json({ mensaje: 'No se encontró esa mezcla' });

        const motor = await cargarMotor();
        const svg = await motor.renderScrambleSvg({ event: evento, scramble: filas[0].mezcla });
        return res.json({ oficialWCA: false, evento, numeroMezcla, svg });
    } catch (error) {
        console.error('Error al renderizar SVG de mezcla:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo generar el SVG de la mezcla' });
    }
});

module.exports = router;
