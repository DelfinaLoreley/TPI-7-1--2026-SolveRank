const router = require('express').Router();
const db = require('../../config/db/conexion');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const verificarToken = require('../../middleware/authMiddleware');
const { ROLES, permitirRoles } = require('../../middleware/autorizacion');

// Catálogos que necesita el formulario de creación.
router.get('/catalogos', verificarToken, permitirRoles(ROLES.ORGANIZADOR), async (req, res) => {
    try {
        const [paises] = await db.execute('SELECT idPais, pais FROM paises ORDER BY pais');
        const [provincias] = await db.execute('SELECT idProvincia, provincia, idPais FROM provincias ORDER BY provincia');
        const [ciudades] = await db.execute('SELECT idCiudad, ciudad, idProvincia FROM ciudades ORDER BY ciudad');
        const [categorias] = await db.execute('SELECT idCategoria, categoria FROM categorias ORDER BY idCategoria');
        const [formatos] = await db.execute('SELECT idFormato, formato FROM formatos ORDER BY idFormato');
        const [jueces] = await db.execute("SELECT u.idUsuario, u.Nombre AS nombre, u.apellido FROM usuarios u INNER JOIN tipos_usuarios t ON t.idTipoUsuario=u.idTipoUsuario WHERE LOWER(t.Nombre)=LOWER(?) ORDER BY u.Nombre, u.apellido", [ROLES.JUEZ]);
        const [delegados] = await db.execute("SELECT u.idUsuario, u.Nombre AS nombre, u.apellido FROM usuarios u INNER JOIN tipos_usuarios t ON t.idTipoUsuario=u.idTipoUsuario WHERE LOWER(t.Nombre)=LOWER(?) ORDER BY u.Nombre, u.apellido", [ROLES.DELEGADO]);
        return res.json({ paises, provincias, ciudades, categorias, formatos, jueces, delegados });
    } catch (error) {
        console.error('Error al cargar catálogos de torneo:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron cargar los datos del formulario' });
    }
});

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

function idValido(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function verificarAccesoResultados(connection, usuario, idTorneo) {
    const [torneos] = await connection.execute(
        `SELECT idTorneo, idUsuario AS idOrganizador,
                (CURDATE() BETWEEN DATE(fecha_Inicio) AND DATE(fecha_fin)) AS enCurso
         FROM torneos WHERE idTorneo = ?`,
        [idTorneo]
    );
    if (!torneos.length) return { estado: 'no-encontrado' };
    const torneo = torneos[0];
    if (!Boolean(torneo.enCurso)) return { estado: 'fuera-de-fecha' };

    if (usuario.rol === ROLES.ORGANIZADOR && Number(torneo.idOrganizador) === Number(usuario.idUsuario)) {
        return { estado: 'autorizado', torneo };
    }
    if (usuario.rol === ROLES.DELEGADO) {
        const [designaciones] = await connection.execute(
            'SELECT 1 FROM delegados_X_torneo WHERE idtorneo = ? AND idUsuario = ? LIMIT 1',
            [idTorneo, usuario.idUsuario]
        );
        if (designaciones.length) return { estado: 'autorizado', torneo };
    }
    return { estado: 'sin-permiso' };
}

function normalizarIntento(valor) {
    if (typeof valor !== 'string') return null;
    const texto = valor.trim().toUpperCase();
    if (!texto) return { tiempo: null, penalizacion: null };
    if (texto === 'DNF' || texto === 'DNS') return { tiempo: null, penalizacion: texto };
    const coincidencia = texto.match(/^(?:(\d{1,2}):)?([0-5]?\d)\.(\d{1,3})(\+2)?$/);
    if (!coincidencia) return null;
    const minutos = Number(coincidencia[1] || 0);
    const segundos = Number(coincidencia[2]);
    const fraccion = coincidencia[3].padEnd(3, '0');
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    const tiempo = `${String(horas).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}:${String(segundos).padStart(2, '0')}.${fraccion}`;
    return { tiempo, penalizacion: coincidencia[4] ? '+2' : null };
}

function resultadosValidos(intentos, cantidadEsperada) {
    if (!Number.isInteger(cantidadEsperada) || cantidadEsperada <= 0
        || !Array.isArray(intentos) || intentos.length !== cantidadEsperada) return null;
    const intentosNormalizados = intentos.map(normalizarIntento);
    if (intentosNormalizados.some((intento) => intento === null || (!intento.tiempo && !intento.penalizacion))) return null;
    return intentosNormalizados;
}

function tiempoLegible(tiempo) {
    if (!tiempo) return '';
    const [horas, minutos, segundos] = String(tiempo).split(':');
    const [segundo, fraccion = '00'] = String(segundos).split('.');
    const totalMinutos = Number(horas) * 60 + Number(minutos);
    const decimales = fraccion.padEnd(2, '0').replace(/0+$/, '').padEnd(2, '0');
    const parteSegundos = `${String(Number(segundo)).padStart(2, '0')}.${decimales}`;
    return totalMinutos
        ? `${String(totalMinutos).padStart(2, '0')}:${parteSegundos}`
        : parteSegundos;
}

router.get('/:idTorneo/resultados/acceso', verificarToken, permitirRoles(ROLES.ORGANIZADOR, ROLES.DELEGADO), async (req, res) => {
    const idTorneo = idValido(req.params.idTorneo);
    if (!idTorneo) return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    try {
        const acceso = await verificarAccesoResultados(db, req.usuario, idTorneo);
        if (acceso.estado === 'no-encontrado') return res.status(404).json({ mensaje: 'No se encontró el torneo' });
        if (acceso.estado === 'fuera-de-fecha') return res.status(403).json({ mensaje: 'La carga de resultados solo está disponible durante las fechas del torneo' });
        if (acceso.estado !== 'autorizado') return res.status(403).json({ mensaje: 'No tenés permisos para cargar resultados en este torneo' });

        const [rondas] = await db.execute(
            `SELECT rct.idRonda, rct.idCategoria, c.categoria, r.ronda,
                    r.tiempoLimite, f.formato, f.cantidad_Solves AS cantidadIntentos,
                    (SELECT COUNT(DISTINCT ci.idUsuario)
                     FROM categorias_x_inscripcion ci
                     WHERE ci.idTorneo = rct.idTorneo AND ci.idCategoria = rct.idCategoria) AS totalCompetidores,
                    (SELECT COUNT(DISTINCT i.idUsuario)
                     FROM intentos_x_competidor i
                     WHERE i.idTorneo = rct.idTorneo AND i.idRonda = rct.idRonda) AS competidoresConResultados,
                    (SELECT cx.hora_inicio
                     FROM cronograma_x_torneo cx
                     WHERE cx.idtorneo = rct.idTorneo AND cx.idronda = rct.idRonda
                     ORDER BY cx.hora_inicio LIMIT 1) AS horaInicio,
                    (SELECT cx.hora_fin
                     FROM cronograma_x_torneo cx
                     WHERE cx.idtorneo = rct.idTorneo AND cx.idronda = rct.idRonda
                     ORDER BY cx.hora_inicio LIMIT 1) AS horaFin
             FROM rondas_x_categoria_x_torneo rct
             INNER JOIN categorias c ON c.idCategoria = rct.idCategoria
             INNER JOIN rondas r ON r.idRonda = rct.idRonda
             LEFT JOIN formato_x_categoria_x_torneo fct
                ON fct.idTorneo = rct.idTorneo AND fct.idCategoria = rct.idCategoria
             LEFT JOIN formatos f ON f.idFormato = fct.idFormato
             WHERE rct.idTorneo = ?
             ORDER BY c.categoria, rct.idRonda`,
            [idTorneo]
        );
        return res.json({ torneo: acceso.torneo, rondas });
    } catch (error) {
        console.error('Error al consultar acceso a carga de resultados:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo consultar el acceso a resultados' });
    }
});

router.get('/:idTorneo/resultados/rondas/:idRonda', verificarToken, permitirRoles(ROLES.ORGANIZADOR, ROLES.DELEGADO), async (req, res) => {
    const idTorneo = idValido(req.params.idTorneo);
    const idRonda = idValido(req.params.idRonda);
    if (!idTorneo || !idRonda) return res.status(400).json({ mensaje: 'El torneo o la ronda indicados no son válidos' });
    try {
        const acceso = await verificarAccesoResultados(db, req.usuario, idTorneo);
        if (acceso.estado === 'no-encontrado') return res.status(404).json({ mensaje: 'No se encontró el torneo' });
        if (acceso.estado === 'fuera-de-fecha') return res.status(403).json({ mensaje: 'La consulta de resultados solo está disponible durante las fechas del torneo' });
        if (acceso.estado !== 'autorizado') return res.status(403).json({ mensaje: 'No tenés permisos para consultar resultados de este torneo' });

        const [rondas] = await db.execute(
            `SELECT rct.idRonda, rct.idCategoria, c.categoria, r.ronda,
                    r.tiempoLimite, f.formato, f.cantidad_Solves AS cantidadIntentos
             FROM rondas_x_categoria_x_torneo rct
             INNER JOIN categorias c ON c.idCategoria = rct.idCategoria
             INNER JOIN rondas r ON r.idRonda = rct.idRonda
             LEFT JOIN formato_x_categoria_x_torneo fct
                ON fct.idTorneo = rct.idTorneo AND fct.idCategoria = rct.idCategoria
             LEFT JOIN formatos f ON f.idFormato = fct.idFormato
             WHERE rct.idTorneo = ? AND rct.idRonda = ?`,
            [idTorneo, idRonda]
        );
        if (!rondas.length) return res.status(404).json({ mensaje: 'La ronda no pertenece a este torneo' });

        const [competidores] = await db.execute(
            `SELECT u.idUsuario, u.wcaid, CONCAT_WS(' ', u.Nombre, u.apellido) AS nombre,
                    p.pais, COUNT(DISTINCT ci.idCategoria) AS categorias
             FROM usuarios_x_torneo ux
             INNER JOIN usuarios u ON u.idUsuario = ux.idUsuario
             LEFT JOIN paises p ON p.idPais = u.idPais
             INNER JOIN categorias_x_inscripcion ci
                ON ci.idUsuario = ux.idUsuario AND ci.idTorneo = ux.idTorneo
             WHERE ux.idTorneo = ? AND ci.idCategoria = ?
             GROUP BY u.idUsuario, u.wcaid, u.Nombre, u.apellido, p.pais
             ORDER BY nombre`,
            [idTorneo, rondas[0].idCategoria]
        );
        const [intentos] = await db.execute(
            `SELECT id, idUsuario, tiempo, penalizacion
             FROM intentos_x_competidor
             WHERE idTorneo = ? AND idRonda = ?
             ORDER BY idUsuario, id`,
            [idTorneo, idRonda]
        );
        const resultadosPorUsuario = new Map();
        for (const competidor of competidores) resultadosPorUsuario.set(Number(competidor.idUsuario), { intentos: [] });
        for (const intento of intentos) {
            const resultado = resultadosPorUsuario.get(Number(intento.idUsuario));
            if (!resultado) continue;
            resultado.intentos.push(['DNF', 'DNS'].includes(String(intento.penalizacion).toUpperCase())
                ? String(intento.penalizacion).toUpperCase()
                : `${tiempoLegible(intento.tiempo)}${intento.penalizacion === '+2' ? '+2' : ''}`);
        }
        const competidoresConResultados = competidores.map((competidor) => ({
            ...competidor,
            ...(resultadosPorUsuario.get(Number(competidor.idUsuario)) || { intentos: [] }),
        }));
        return res.json({ ronda: rondas[0], competidores: competidoresConResultados });
    } catch (error) {
        console.error('Error al obtener resultados de la ronda:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener los resultados de la ronda' });
    }
});

router.post('/:idTorneo/resultados/rondas/:idRonda', verificarToken, permitirRoles(ROLES.ORGANIZADOR, ROLES.DELEGADO), async (req, res) => {
    const idTorneo = idValido(req.params.idTorneo);
    const idRonda = idValido(req.params.idRonda);
    const idUsuario = idValido(req.body?.idUsuario);
    if (!idTorneo || !idRonda || !idUsuario) return res.status(400).json({ mensaje: 'El torneo, la ronda o el competidor no son válidos' });
    if (!Array.isArray(req.body?.intentos)) return res.status(400).json({ mensaje: 'Ingresá los intentos según el formato configurado para la ronda' });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const acceso = await verificarAccesoResultados(connection, req.usuario, idTorneo);
        if (acceso.estado === 'no-encontrado') {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'No se encontró el torneo' });
        }
        if (acceso.estado === 'fuera-de-fecha') {
            await connection.rollback();
            return res.status(403).json({ mensaje: 'La carga de resultados solo está disponible durante las fechas del torneo' });
        }
        if (acceso.estado !== 'autorizado') {
            await connection.rollback();
            return res.status(403).json({ mensaje: 'No tenés permisos para cargar resultados en este torneo' });
        }

        const [rondas] = await connection.execute(
            `SELECT rct.idCategoria, f.cantidad_Solves AS cantidadIntentos
             FROM rondas_x_categoria_x_torneo rct
             LEFT JOIN formato_x_categoria_x_torneo fct
                ON fct.idTorneo = rct.idTorneo AND fct.idCategoria = rct.idCategoria
             LEFT JOIN formatos f ON f.idFormato = fct.idFormato
             WHERE rct.idTorneo = ? AND rct.idRonda = ?`,
            [idTorneo, idRonda]
        );
        if (!rondas.length) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'La ronda no pertenece a este torneo' });
        }
        const cantidadIntentos = Number(rondas[0].cantidadIntentos);
        if (!Number.isInteger(cantidadIntentos) || cantidadIntentos <= 0) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'La categoría de esta ronda no tiene un formato configurado' });
        }
        const resultados = resultadosValidos(req.body.intentos, cantidadIntentos);
        if (!resultados) {
            await connection.rollback();
            return res.status(400).json({ mensaje: 'Completá todos los intentos del formato configurado con MM:SS.CC, +2, DNF o DNS' });
        }
        const [inscripciones] = await connection.execute(
            `SELECT 1 FROM usuarios_x_torneo ux
             INNER JOIN categorias_x_inscripcion ci
                ON ci.idUsuario = ux.idUsuario AND ci.idTorneo = ux.idTorneo
             WHERE ux.idTorneo = ? AND ux.idUsuario = ? AND ci.idCategoria = ?
             LIMIT 1`,
            [idTorneo, idUsuario, rondas[0].idCategoria]
        );
        if (!inscripciones.length) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'El competidor no está inscripto en esta categoría' });
        }

        await connection.execute(
            'DELETE FROM intentos_x_competidor WHERE idTorneo = ? AND idRonda = ? AND idUsuario = ?',
            [idTorneo, idRonda, idUsuario]
        );
        const insertarIntento = async (intento) => {
            await connection.execute(
                `INSERT INTO intentos_x_competidor
                    (idTorneo, idRonda, idUsuario, tiempo, penalizacion)
                 VALUES (?, ?, ?, ?, ?)`,
                [idTorneo, idRonda, idUsuario, intento.tiempo || '00:00:00.00', intento.penalizacion]
            );
        };
        for (const intento of resultados) await insertarIntento(intento);
        await connection.commit();
        return res.json({ mensaje: 'Se guardaron los resultados del competidor' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al guardar resultados de competidor:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron guardar los resultados' });
    } finally {
        connection?.release();
    }
});

// Listado público de torneos.
router.get('/categorias', async (req, res) => {
    try {
        const [categorias] = await db.execute('SELECT idCategoria, categoria FROM categorias ORDER BY idCategoria');
        return res.json({ categorias });
    } catch (error) {
        console.error('Error al obtener categorías para el ranking:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener las categorías' });
    }
});

// Ranking por mejor tiempo individual registrado en cada categoría.
router.get('/ranking/:idCategoria', async (req, res) => {
    const idCategoria = Number(req.params.idCategoria);
    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        return res.status(400).json({ mensaje: 'La categoría indicada no es válida' });
    }
    try {
        const [resultados] = await db.execute(
            `SELECT u.idUsuario, u.Nombre AS nombre, u.apellido, u.avatar_url,
                    p.pais,
                    MIN(CASE
                        WHEN UPPER(COALESCE(i.penalizacion, '')) IN ('DNF', 'DNS') THEN NULL
                        WHEN UPPER(COALESCE(i.penalizacion, '')) IN ('+2', '2') THEN TIME_TO_SEC(i.tiempo) + 2
                        ELSE TIME_TO_SEC(i.tiempo)
                    END) AS mejorTiempo
             FROM intentos_x_competidor i
             INNER JOIN rondas_x_categoria_x_torneo rct
                ON rct.idRonda = i.idRonda AND rct.idTorneo = i.idTorneo
             INNER JOIN usuarios u ON u.idUsuario = i.idUsuario
             LEFT JOIN paises p ON p.idPais = u.idPais
             WHERE rct.idCategoria = ?
             GROUP BY u.idUsuario, u.Nombre, u.apellido, u.avatar_url, p.pais
             HAVING mejorTiempo IS NOT NULL
             ORDER BY mejorTiempo ASC, u.Nombre ASC, u.apellido ASC
             LIMIT 10`,
            [idCategoria]
        );
        return res.json({ resultados });
    } catch (error) {
        console.error('Error al obtener el ranking:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo obtener el ranking' });
    }
});

// Detalle público de un torneo para la vista de información.
router.get('/detalle/:idTorneo', async (req, res) => {
    const idTorneo = Number(req.params.idTorneo);
    if (!Number.isSafeInteger(idTorneo) || idTorneo <= 0) {
        return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    }
    try {
        const [torneos] = await db.execute(
            `SELECT t.idTorneo, t.nombre, t.descripcion, t.fecha_Inicio, t.fecha_fin,
                    t.Fecha_Inicio_Inscripcion, t.Fecha_fin_Inscripcion,
                    t.limite_participantes, t.pathImagen, t.Lugar_Venue,
                    t.direccion, t.Contacto_Organizador, t.observacion,
                    p.pais, pr.provincia, c.ciudad,
                    COUNT(DISTINCT ux.idUsuario) AS inscriptos,
                    CONCAT_WS(' ', org.Nombre, org.apellido) AS organizador
             FROM torneos t
             INNER JOIN usuarios org ON org.idUsuario = t.idUsuario
             LEFT JOIN paises p ON p.idPais = t.idPais
             LEFT JOIN provincias pr ON pr.idProvincia = t.idProvicncia
             LEFT JOIN ciudades c ON c.idCiudad = t.idCiudad
             LEFT JOIN usuarios_x_torneo ux ON ux.idTorneo = t.idTorneo
             WHERE t.idTorneo = ?
             GROUP BY t.idTorneo`,
            [idTorneo]
        );
        if (!torneos.length) return res.status(404).json({ mensaje: 'No se encontró el torneo' });

        const [categorias] = await db.execute(
            `SELECT c.idCategoria, c.categoria, f.formato,
                    rct.idRonda, r.ronda, r.cutoff, r.tiempoLimite, r.porcentajeAvance
             FROM categorias_x_torneo cxt
             INNER JOIN categorias c ON c.idCategoria = cxt.idCategoria
             LEFT JOIN formato_x_categoria_x_torneo fct
                ON fct.idTorneo = cxt.idTorneo AND fct.idCategoria = cxt.idCategoria
             LEFT JOIN formatos f ON f.idFormato = fct.idFormato
             LEFT JOIN rondas_x_categoria_x_torneo rct
                ON rct.idTorneo = cxt.idTorneo AND rct.idCategoria = cxt.idCategoria
             LEFT JOIN rondas r ON r.idRonda = rct.idRonda
             WHERE cxt.idTorneo = ?
             ORDER BY cxt.idCategoria, rct.idRonda`,
            [idTorneo]
        );
        const [cronograma] = await db.execute(
            `SELECT cx.idCategoria, c.categoria, cx.idRonda, r.ronda, cx.evento,
                    cx.hora_inicio AS horaInicio, cx.hora_fin AS horaFin
             FROM cronograma_x_torneo cx
             INNER JOIN categorias c ON c.idCategoria = cx.idcategoria
             INNER JOIN rondas r ON r.idRonda = cx.idronda
             WHERE cx.idtorneo = ?
             ORDER BY cx.hora_inicio, c.categoria`,
            [idTorneo]
        );
        const [jueces] = await db.execute(
            `SELECT CONCAT_WS(' ', u.Nombre, u.apellido) AS nombre
             FROM jueces_x_torneo j
             INNER JOIN usuarios u ON u.idUsuario = j.idUsuario
             WHERE j.idTorneo = ? ORDER BY u.Nombre, u.apellido`,
            [idTorneo]
        );
        const [delegados] = await db.execute(
            `SELECT CONCAT_WS(' ', u.Nombre, u.apellido) AS nombre
             FROM delegados_X_torneo d
             INNER JOIN usuarios u ON u.idUsuario = d.idUsuario
             WHERE d.idtorneo = ? ORDER BY u.Nombre, u.apellido`,
            [idTorneo]
        );
        const categoriasDetalle = categorias.reduce((lista, fila) => {
            let categoria = lista.find((item) => Number(item.idCategoria) === Number(fila.idCategoria));
            if (!categoria) {
                categoria = {
                    idCategoria: fila.idCategoria,
                    id: fila.categoria,
                    nombre: fila.categoria,
                    etiqueta: fila.categoria,
                    formato: fila.formato,
                    rondas: []
                };
                lista.push(categoria);
            }
            if (fila.ronda) categoria.rondas.push(fila.ronda);
            return lista;
        }, []);
        return res.json({
            torneo: {
                ...torneos[0],
                categorias: categoriasDetalle,
                jueces: jueces.map((item) => item.nombre),
                delegados: delegados.map((item) => item.nombre),
                importante: torneos[0].observacion ? [torneos[0].observacion] : []
            },
            categorias,
            cronograma
        });
    } catch (error) {
        console.error('Error al obtener el detalle del torneo:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo obtener el detalle del torneo' });
    }
});

// Inscripción de competidores y jueces (excepto jueces designados en este torneo).
router.get('/:idTorneo/inscripcion/estado', verificarToken, permitirRoles(ROLES.COMPETIDOR, ROLES.JUEZ), async (req, res) => {
    const idTorneo = Number(req.params.idTorneo);
    if (!Number.isSafeInteger(idTorneo) || idTorneo <= 0) {
        return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    }
    try {
        const [[registro]] = await db.execute(
            'SELECT 1 FROM usuarios_x_torneo WHERE idTorneo = ? AND idUsuario = ? LIMIT 1',
            [idTorneo, req.usuario.idUsuario]
        );
        const [categorias] = await db.execute(
            `SELECT c.idCategoria, c.categoria
             FROM categorias_x_inscripcion ci
             INNER JOIN categorias c ON c.idCategoria = ci.idCategoria
             WHERE ci.idTorneo = ? AND ci.idUsuario = ?
             ORDER BY c.idCategoria`,
            [idTorneo, req.usuario.idUsuario]
        );
        return res.json({ inscripto: Boolean(registro), categorias });
    } catch (error) {
        console.error('Error al consultar la inscripción del usuario:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo consultar el estado de inscripción' });
    }
});

router.post('/:idTorneo/inscripcion', verificarToken, permitirRoles(ROLES.COMPETIDOR, ROLES.JUEZ), async (req, res) => {
    const idTorneo = Number(req.params.idTorneo);
    if (!Number.isSafeInteger(idTorneo) || idTorneo <= 0) {
        return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    }
    const seleccion = req.body?.categorias;
    if (!Array.isArray(seleccion) || !seleccion.length) {
        return res.status(400).json({ mensaje: 'Seleccioná al menos una categoría para inscribirte' });
    }
    const idsCategorias = [...new Set(seleccion.map(Number))];
    if (idsCategorias.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
        return res.status(400).json({ mensaje: 'La selección de categorías no es válida' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [torneos] = await connection.execute(
            `SELECT idTorneo, Fecha_Inicio_Inscripcion, Fecha_fin_Inscripcion, limite_participantes
             FROM torneos WHERE idTorneo = ? FOR UPDATE`,
            [idTorneo]
        );
        if (!torneos.length) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'No se encontró el torneo' });
        }

        const placeholdersCategorias = idsCategorias.map(() => '?').join(',');
        const [categoriasValidas] = await connection.execute(
            `SELECT idCategoria FROM categorias_x_torneo
             WHERE idTorneo = ? AND idCategoria IN (${placeholdersCategorias})`,
            [idTorneo, ...idsCategorias]
        );
        if (categoriasValidas.length !== idsCategorias.length) {
            await connection.rollback();
            return res.status(400).json({ mensaje: 'Una o más categorías no pertenecen a este torneo' });
        }

        if (req.usuario.rol === ROLES.JUEZ) {
            const [designaciones] = await connection.execute(
                'SELECT 1 FROM jueces_x_torneo WHERE idTorneo = ? AND idUsuario = ?',
                [idTorneo, req.usuario.idUsuario]
            );
            if (designaciones.length) {
                await connection.rollback();
                return res.status(403).json({ mensaje: 'Un juez designado para este torneo no puede inscribirse como competidor' });
            }
        }

        const [fechas] = await connection.execute(
            `SELECT CURDATE() >= ? AND CURDATE() <= ? AS inscripcionAbierta
             FROM torneos WHERE idTorneo = ?`,
            [torneos[0].Fecha_Inicio_Inscripcion, torneos[0].Fecha_fin_Inscripcion, idTorneo]
        );
        if (!Boolean(fechas[0].inscripcionAbierta)) {
            await connection.rollback();
            return res.status(403).json({ mensaje: 'El período de inscripción no está abierto' });
        }

        const [existentes] = await connection.execute(
            'SELECT 1 FROM usuarios_x_torneo WHERE idUsuario = ? AND idTorneo = ?',
            [req.usuario.idUsuario, idTorneo]
        );
        if (existentes.length) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Ya estás inscripto en este torneo' });
        }

        const [[conteo]] = await connection.execute(
            'SELECT COUNT(*) AS inscriptos FROM usuarios_x_torneo WHERE idTorneo = ?',
            [idTorneo]
        );
        if (Number(conteo.inscriptos) >= Number(torneos[0].limite_participantes)) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'El torneo ya alcanzó el límite de participantes' });
        }

        await connection.execute(
            'INSERT INTO usuarios_x_torneo (idUsuario, idTorneo) VALUES (?, ?)',
            [req.usuario.idUsuario, idTorneo]
        );
        for (const idCategoria of idsCategorias) {
            await connection.execute(
                'INSERT INTO categorias_x_inscripcion (idUsuario, idTorneo, idCategoria) VALUES (?, ?, ?)',
                [req.usuario.idUsuario, idTorneo, idCategoria]
            );
        }
        await connection.commit();
        return res.status(201).json({ mensaje: 'Te inscribiste correctamente en el torneo' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al inscribir participante:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo completar la inscripción' });
    } finally {
        connection?.release();
    }
});

router.delete('/:idTorneo/inscripcion', verificarToken, permitirRoles(ROLES.COMPETIDOR, ROLES.JUEZ), async (req, res) => {
    const idTorneo = Number(req.params.idTorneo);
    if (!Number.isSafeInteger(idTorneo) || idTorneo <= 0) {
        return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    }
    try {
        const [resultado] = await db.execute(
            'DELETE FROM usuarios_x_torneo WHERE idUsuario = ? AND idTorneo = ?',
            [req.usuario.idUsuario, idTorneo]
        );
        if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'No tenés una inscripción activa en este torneo' });
        await db.execute(
            'DELETE FROM categorias_x_inscripcion WHERE idUsuario = ? AND idTorneo = ?',
            [req.usuario.idUsuario, idTorneo]
        );
        return res.json({ mensaje: 'Se canceló tu inscripción' });
    } catch (error) {
        console.error('Error al cancelar inscripción:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo cancelar la inscripción' });
    }
});

router.get('/', async (req, res) => {
    try {
        const [torneos] = await db.execute(
            `SELECT t.idTorneo, t.nombre, t.descripcion, t.fecha_Inicio,
                    t.fecha_fin, t.Fecha_Inicio_Inscripcion,
                    t.Fecha_fin_Inscripcion, t.limite_participantes,
                    t.pathImagen, t.Lugar_Venue, t.direccion,
                    p.pais, pr.provincia, c.ciudad,
                    COUNT(DISTINCT ux.idUsuario) AS inscriptos,
                    COUNT(DISTINCT cxt.idCategoria) AS categorias,
                    GROUP_CONCAT(DISTINCT cat.categoria ORDER BY cat.idCategoria SEPARATOR '|') AS categoriasLista
             FROM torneos t
             LEFT JOIN paises p ON p.idPais = t.idPais
             LEFT JOIN provincias pr ON pr.idProvincia = t.idProvicncia
             LEFT JOIN ciudades c ON c.idCiudad = t.idCiudad
             LEFT JOIN usuarios_x_torneo ux ON ux.idTorneo = t.idTorneo
             LEFT JOIN categorias_x_torneo cxt ON cxt.idTorneo = t.idTorneo
             LEFT JOIN categorias cat ON cat.idCategoria = cxt.idCategoria
             GROUP BY t.idTorneo
             ORDER BY t.fecha_Inicio`
        );
        const [[competidores]] = await db.execute(
            `SELECT COUNT(DISTINCT u.idUsuario) AS total
             FROM usuarios u
             INNER JOIN tipos_usuarios tu ON tu.idTipoUsuario = u.idTipoUsuario
             WHERE LOWER(tu.Nombre) IN (LOWER(?), LOWER(?))`,
            [ROLES.COMPETIDOR, ROLES.JUEZ]
        );
        const [[torneosEsteAnio]] = await db.execute(
            'SELECT COUNT(*) AS total FROM torneos WHERE YEAR(fecha_Inicio) = YEAR(CURDATE())'
        );
        const [[paisesInscritos]] = await db.execute(
            `SELECT COUNT(DISTINCT u.idPais) AS total
             FROM usuarios_x_torneo ux
             INNER JOIN usuarios u ON u.idUsuario = ux.idUsuario
             WHERE u.idPais IS NOT NULL`
        );
        const [[resultadosRegistrados]] = await db.execute(
            'SELECT COUNT(*) AS total FROM intentos_x_competidor'
        );
        return res.json({
            torneos,
            estadisticas: {
                competidores: Number(competidores.total),
                torneosEsteAnio: Number(torneosEsteAnio.total),
                paises: Number(paisesInscritos.total),
                resultadosRegistrados: Number(resultadosRegistrados.total)
            }
        });
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
                    COUNT(DISTINCT ux.idUsuario) AS inscriptos,
                    COUNT(DISTINCT cxt.idCategoria) AS categorias,
                    COUNT(DISTINCT rct.idRonda) AS rondasTotales,
                    COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN rct.idRonda END) AS rondasConMezclas
             FROM torneos t
             LEFT JOIN paises p ON p.idPais = t.idPais
             LEFT JOIN provincias pr ON pr.idProvincia = t.idProvicncia
             LEFT JOIN ciudades c ON c.idCiudad = t.idCiudad
             LEFT JOIN usuarios_x_torneo ux ON ux.idTorneo = t.idTorneo
             LEFT JOIN categorias_x_torneo cxt ON cxt.idTorneo = t.idTorneo
             LEFT JOIN rondas_x_categoria_x_torneo rct ON rct.idTorneo = t.idTorneo
             LEFT JOIN mezclas m ON m.idTorneo = t.idTorneo AND m.idRonda = rct.idRonda
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

// Rondas y estado de mezclas para el botón del panel del organizador.
router.get('/:idTorneo/mis-rondas', verificarToken, permitirRoles(ROLES.ORGANIZADOR), async (req, res) => {
    const idTorneo = Number(req.params.idTorneo);
    if (!Number.isSafeInteger(idTorneo) || idTorneo <= 0) {
        return res.status(400).json({ mensaje: 'El torneo indicado no es válido' });
    }
    try {
        const [torneos] = await db.execute(
            'SELECT idTorneo FROM torneos WHERE idTorneo = ? AND idUsuario = ?',
            [idTorneo, req.usuario.idUsuario]
        );
        if (!torneos.length) return res.status(404).json({ mensaje: 'No se encontró el torneo' });

        const [rondas] = await db.execute(
            `SELECT rct.idRonda, rct.idCategoria, c.categoria, r.ronda,
                    f.formato, f.cantidad_Solves AS cantidadIntentos,
                    COUNT(DISTINCT m.id) AS mezclasExistentes
             FROM rondas_x_categoria_x_torneo rct
             INNER JOIN categorias c ON c.idCategoria = rct.idCategoria
             INNER JOIN rondas r ON r.idRonda = rct.idRonda
             LEFT JOIN formato_x_categoria_x_torneo fct
                ON fct.idTorneo = rct.idTorneo AND fct.idCategoria = rct.idCategoria
             LEFT JOIN formatos f ON f.idFormato = fct.idFormato
             LEFT JOIN mezclas m ON m.idTorneo = rct.idTorneo AND m.idRonda = rct.idRonda AND m.grupo = 'A'
             WHERE rct.idTorneo = ?
             GROUP BY rct.idRonda, rct.idCategoria, c.categoria, r.ronda, f.formato, f.cantidad_Solves
             ORDER BY rct.idCategoria, rct.idRonda`,
            [idTorneo]
        );
        return res.json({ rondas });
    } catch (error) {
        console.error('Error al listar rondas del torneo:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron obtener las rondas del torneo' });
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
    const categorias = normalizarIds(body.categorias ?? []);
    const formatos = body.formatos && typeof body.formatos === 'object' ? body.formatos : {};
    const rondas = body.rondas && typeof body.rondas === 'object' && !Array.isArray(body.rondas) ? body.rondas : null;
    const cronograma = Array.isArray(body.cronograma) ? body.cronograma : null;
    if (!categorias || !categorias.length || !rondas || !cronograma ||
        categorias.some((id) => !formatos[id] || !Array.isArray(rondas[id]) || !rondas[id].length)) {
        return res.status(400).json({ mensaje: 'Completá categorías, formatos, rondas y cronograma válidos' });
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
    let archivoImagenGuardado;
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

        const placeholdersCategorias = categorias.map(() => '?').join(',');
        const [categoriasValidas] = await connection.execute(
            `SELECT idCategoria FROM categorias WHERE idCategoria IN (${placeholdersCategorias})`, categorias
        );
        const [formatosValidos] = await connection.execute('SELECT idFormato FROM formatos');
        const idsFormatosValidos = new Set(formatosValidos.map((item) => Number(item.idFormato)));
        if (categoriasValidas.length !== categorias.length || categorias.some((id) => !idsFormatosValidos.has(Number(formatos[id])))) {
            await connection.rollback();
            return res.status(400).json({ mensaje: 'Hay categorías o formatos que no existen' });
        }

        let pathImagen = null;
        if (body.imagenBase64) {
            const coincidencia = typeof body.imagenBase64 === 'string'
                ? body.imagenBase64.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/)
                : null;
            if (!coincidencia) {
                await connection.rollback();
                return res.status(400).json({ mensaje: 'La imagen debe ser un archivo JPG o PNG válido' });
            }
            const bufferImagen = Buffer.from(coincidencia[2], 'base64');
            const esPng = coincidencia[1] === 'png' && bufferImagen.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
            const esJpeg = coincidencia[1] === 'jpeg' && bufferImagen[0] === 0xff && bufferImagen[1] === 0xd8 && bufferImagen[2] === 0xff;
            if (bufferImagen.length > 5 * 1024 * 1024 || (!esPng && !esJpeg)) {
                await connection.rollback();
                return res.status(400).json({ mensaje: 'La imagen debe ser JPG o PNG y no superar los 5 MB' });
            }
            const extension = esPng ? 'png' : 'jpg';
            const nombreArchivo = `${crypto.randomUUID()}.${extension}`;
            const directorio = path.join(__dirname, '../../../public/torneos');
            await fs.mkdir(directorio, { recursive: true });
            archivoImagenGuardado = path.join(directorio, nombreArchivo);
            await fs.writeFile(archivoImagenGuardado, bufferImagen, { flag: 'wx' });
            pathImagen = `/uploads/torneos/${nombreArchivo}`;
        }

        const columnas = ['idUsuario', ...camposTorneo];
        const valores = [
            req.usuario.idUsuario,
            ...camposTorneo.map((campo) => {
                const valor = campo === 'pathImagen' ? pathImagen : body[campo];
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

        const rondasPersistidas = new Map();
        for (const idCategoria of categorias) {
            await connection.execute('INSERT INTO categorias_x_torneo (idTorneo, idCategoria) VALUES (?, ?)', [creacion.insertId, idCategoria]);
            await connection.execute('INSERT INTO formato_x_categoria_x_torneo (idFormato, idCategoria, idTorneo) VALUES (?, ?, ?)', [Number(formatos[idCategoria]), idCategoria, creacion.insertId]);
            for (const ronda of rondas[idCategoria]) {
                if (!ronda.nombre || !ronda.cutoff || !ronda.tiempoLimite || !Number.isInteger(Number(ronda.porcentajeAvance))) {
                    throw Object.assign(new Error('Configuración de ronda inválida'), { code: 'INVALID_ROUND' });
                }
                const [insertRonda] = await connection.execute(
                    'INSERT INTO rondas (ronda, cutoff, tiempoLimite, porcentajeAvance) VALUES (?, ?, ?, ?)',
                    [ronda.nombre, ronda.cutoff, ronda.tiempoLimite, Number(ronda.porcentajeAvance)]
                );
                rondasPersistidas.set(`${idCategoria}:${ronda.nombre}`, insertRonda.insertId);
                await connection.execute('INSERT INTO rondas_x_categoria_x_torneo (idTorneo, idRonda, idCategoria) VALUES (?, ?, ?)', [creacion.insertId, insertRonda.insertId, idCategoria]);
            }
        }
        for (const actividad of cronograma) {
            const idRonda = actividad.idRonda || rondasPersistidas.get(`${actividad.idCategoria}:${actividad.ronda}`);
            if (!actividad.idCategoria || !idRonda || !actividad.horaInicio || !actividad.horaFin) {
                throw Object.assign(new Error('Actividad de cronograma inválida'), { code: 'INVALID_SCHEDULE' });
            }
            await connection.execute(
                'INSERT INTO cronograma_x_torneo (idtorneo, idcategoria, idronda, evento, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?, ?)',
                [creacion.insertId, Number(actividad.idCategoria), Number(idRonda), actividad.evento || null, actividad.horaInicio, actividad.horaFin]
            );
        }

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
        if (archivoImagenGuardado) await fs.unlink(archivoImagenGuardado).catch(() => {});
        console.error('Error al crear torneo:', error.message);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ mensaje: 'El país, provincia o ciudad seleccionados no existen o no coinciden' });
        }
        if (error.code === 'INVALID_ROUND' || error.code === 'INVALID_SCHEDULE') {
            return res.status(400).json({ mensaje: 'La configuración de rondas o cronograma no es válida' });
        }
        return res.status(500).json({ mensaje: 'No se pudo crear el torneo' });
    } finally {
        connection?.release();
    }
});

module.exports = router;
