const db = require('../config/db/conexion');

const CATEGORIAS_EXCLUIDAS_SQL = "LOWER(TRIM(c.categoria)) NOT IN ('3x3x3 fmc', '3x3x3 multi-blind', '3x3 fm', '3x3 mbld')";

async function buscarCompetidores(req, res) {
    const texto = typeof req.query.texto === 'string' ? req.query.texto.trim() : '';
    if (texto.length < 2 || texto.length > 100) return res.json({ competidores: [] });
    try {
        const termino = `%${texto}%`;
        const [competidores] = await db.execute(
            `SELECT u.idUsuario, u.Nombre AS nombre, u.apellido, u.wcaid, u.avatar_url,
                    p.pais, tu.Nombre AS rol
             FROM usuarios u
             INNER JOIN tipos_usuarios tu ON tu.idTipoUsuario = u.idTipoUsuario
             LEFT JOIN paises p ON p.idPais = u.idPais
             WHERE LOWER(tu.Nombre) IN ('competidor', 'juez')
               AND (u.Nombre LIKE ? OR u.apellido LIKE ?
                    OR CONCAT_WS(' ', u.Nombre, u.apellido) LIKE ? OR u.wcaid LIKE ?)
             ORDER BY u.Nombre, u.apellido
             LIMIT 8`,
            [termino, termino, termino, termino]
        );
        return res.json({ competidores });
    } catch (error) {
        console.error('Error al buscar competidores:', error.message);
        return res.status(500).json({ mensaje: 'No se pudieron buscar perfiles' });
    }
}

function calcularPromedio(formato, intentos) {
    const nombre = String(formato || '').toUpperCase();
    if (nombre === 'AO5' && intentos.length === 5) {
        const ordenados = intentos.map((valor) => valor === null ? Infinity : valor).sort((a, b) => a - b);
        const centrales = ordenados.slice(1, -1);
        return centrales.every(Number.isFinite)
            ? centrales.reduce((suma, valor) => suma + valor, 0) / centrales.length
            : Infinity;
    }
    if (nombre === 'MO3' && intentos.length === 3) {
        return intentos.every(Number.isFinite)
            ? intentos.reduce((suma, valor) => suma + valor, 0) / intentos.length
            : Infinity;
    }
    return null;
}

function asignarPuestos(competidores, selector) {
    const ordenados = [...competidores].sort((a, b) => {
        const diferencia = selector(a) - selector(b);
        return Number.isNaN(diferencia) || diferencia === 0
            ? a.nombre.localeCompare(b.nombre, 'es')
            : diferencia;
    });
    let puesto = 0;
    let anterior;
    return ordenados.map((competidor, indice) => {
        const valor = selector(competidor);
        if (indice === 0 || Math.abs(valor - anterior) > 1e-9) puesto = indice + 1;
        anterior = valor;
        return { ...competidor, puesto };
    });
}

async function obtenerMiPerfil(req, res) {
    const idUsuario = req.publico ? Number(req.params.idUsuario) : Number(req.usuario.idUsuario);
    try {
        const [[perfil]] = await db.execute(
            `SELECT u.idUsuario, u.idTipoUsuario, u.idPais, u.idGenero, u.Nombre AS nombre,
                    u.apellido, u.email, u.wcaid, u.fecha_Nacimiento, u.avatar_url,
                    p.pais, g.genero, t.Nombre AS rol
             FROM usuarios u
             LEFT JOIN paises p ON p.idPais = u.idPais
             LEFT JOIN generos g ON g.id = u.idGenero
             INNER JOIN tipos_usuarios t ON t.idTipoUsuario = u.idTipoUsuario
             WHERE u.idUsuario = ?`,
            [idUsuario]
        );
        if (!perfil) return res.status(404).json({ mensaje: 'No se encontró el perfil' });
        if (req.publico && !['Competidor', 'Juez'].includes(perfil.rol)) {
            return res.status(404).json({ mensaje: 'No se encontró el perfil' });
        }

        const [filas] = await db.execute(
            `SELECT i.idTorneo, i.idRonda, i.idUsuario, i.penalizacion, f.formato,
                    f.cantidad_Solves AS cantidadIntentos, c.idCategoria, c.categoria,
                    u.Nombre AS nombre, u.apellido, u.idPais,
                    CASE
                        WHEN UPPER(COALESCE(i.penalizacion, '')) IN ('DNF', 'DNS') OR i.tiempo IS NULL THEN NULL
                        ELSE ROUND((TIME_TO_SEC(i.tiempo) + MICROSECOND(i.tiempo) / 1000000
                            + CASE WHEN UPPER(COALESCE(i.penalizacion, '')) IN ('+2', '2') THEN 2 ELSE 0 END) * 100)
                    END AS tiempoCentesimas
             FROM intentos_x_competidor i
             INNER JOIN rondas_x_categoria_x_torneo rct
                ON rct.idRonda = i.idRonda AND rct.idTorneo = i.idTorneo
             INNER JOIN torneos t ON t.idTorneo = i.idTorneo
             INNER JOIN formato_x_categoria_x_torneo fct
                ON fct.idTorneo = rct.idTorneo AND fct.idCategoria = rct.idCategoria
             INNER JOIN formatos f ON f.idFormato = fct.idFormato
             INNER JOIN categorias c ON c.idCategoria = rct.idCategoria
             INNER JOIN usuarios u ON u.idUsuario = i.idUsuario
             WHERE t.fecha_fin < CURDATE() AND ${CATEGORIAS_EXCLUIDAS_SQL}
             ORDER BY c.idCategoria, i.idTorneo, i.idRonda, u.idUsuario, i.id`,
            []
        );

        const rondas = new Map();
        const competidoresPorCategoria = new Map();
        for (const fila of filas) {
            const idCat = Number(fila.idCategoria);
            const idCompetidor = Number(fila.idUsuario);
            const llave = `${idCat}:${fila.idTorneo}:${fila.idRonda}:${idCompetidor}`;
            if (!rondas.has(llave)) {
                rondas.set(llave, {
                    idCategoria: idCat,
                    categoria: fila.categoria,
                    idTorneo: Number(fila.idTorneo),
                    idRonda: Number(fila.idRonda),
                    idUsuario: idCompetidor,
                    formato: String(fila.formato || '').toUpperCase(),
                    cantidad: Number(fila.cantidadIntentos),
                    intentos: [],
                    nombre: `${fila.nombre || ''} ${fila.apellido || ''}`.trim(),
                    idPais: fila.idPais === null ? null : Number(fila.idPais),
                });
            }
            rondas.get(llave).intentos.push(fila.tiempoCentesimas === null ? null : Number(fila.tiempoCentesimas));
        }

        const rondasCompletas = [];
        for (const ronda of rondas.values()) {
            if (!Number.isInteger(ronda.cantidad) || ronda.cantidad <= 0 || ronda.intentos.length !== ronda.cantidad) continue;
            ronda.single = ronda.intentos.some(Number.isFinite) ? Math.min(...ronda.intentos.filter(Number.isFinite)) : Infinity;
            ronda.media = calcularPromedio(ronda.formato, ronda.intentos);
            rondasCompletas.push(ronda);
            if (!competidoresPorCategoria.has(ronda.idCategoria)) competidoresPorCategoria.set(ronda.idCategoria, new Map());
            const lista = competidoresPorCategoria.get(ronda.idCategoria);
            if (!lista.has(ronda.idUsuario)) {
                lista.set(ronda.idUsuario, {
                    idUsuario: ronda.idUsuario,
                    nombre: ronda.nombre,
                    idPais: ronda.idPais,
                    single: Infinity,
                    media: Infinity,
                });
            }
            const competidor = lista.get(ronda.idUsuario);
            competidor.single = Math.min(competidor.single, ronda.single);
            if (ronda.media !== null) competidor.media = Math.min(competidor.media, ronda.media);
        }

        const categorias = [];
        for (const [idCategoria, competidoresMap] of competidoresPorCategoria) {
            const competidores = [...competidoresMap.values()];
            const propio = competidoresMap.get(idUsuario);
            if (!propio) continue;
            const puesto = (tipo, idPais = null) => {
                const enRanking = competidores.filter((competidor) => idPais === null || competidor.idPais === idPais);
                return asignarPuestos(enRanking, (competidor) => competidor[tipo])
                    .find((competidor) => competidor.idUsuario === idUsuario)?.puesto ?? null;
            };
            categorias.push({
                idCategoria,
                categoria: rondasCompletas.find((ronda) => ronda.idCategoria === idCategoria)?.categoria,
                single: Number.isFinite(propio.single) ? propio.single / 100 : null,
                media: Number.isFinite(propio.media) ? propio.media / 100 : null,
                singleNR: perfil.idPais === null ? null : puesto('single', Number(perfil.idPais)),
                singleWR: puesto('single'),
                mediaNR: perfil.idPais === null ? null : puesto('media', Number(perfil.idPais)),
                mediaWR: puesto('media'),
            });
        }

        const [cuentas] = await db.execute(
            `SELECT
                (SELECT COUNT(*) FROM (
                    SELECT idTorneo FROM usuarios_x_torneo WHERE idUsuario = ?
                    UNION SELECT idTorneo FROM jueces_x_torneo WHERE idUsuario = ?
                    UNION SELECT idtorneo AS idTorneo FROM delegados_X_torneo WHERE idUsuario = ?
                    UNION SELECT idTorneo FROM torneos WHERE idUsuario = ?
                ) participaciones) AS torneos,
                (SELECT COUNT(*) FROM intentos_x_competidor
                 WHERE idUsuario = ? AND tiempo IS NOT NULL
                   AND UPPER(COALESCE(penalizacion, '')) NOT IN ('DNF', 'DNS')) AS soluciones`,
            [idUsuario, idUsuario, idUsuario, idUsuario, idUsuario]
        );

        let medallero = { oro: 0, plata: 0, bronce: 0 };
        const [rondasFinales] = await db.execute(
            `SELECT rct.idTorneo, rct.idCategoria, MAX(rct.idRonda) AS idRonda
             FROM rondas_x_categoria_x_torneo rct
             INNER JOIN torneos t ON t.idTorneo = rct.idTorneo
             WHERE t.fecha_fin < CURDATE()
             GROUP BY rct.idTorneo, rct.idCategoria`
        );
        const rondasFinalesSet = new Set(rondasFinales.map((ronda) => `${ronda.idTorneo}:${ronda.idCategoria}:${ronda.idRonda}`));
        const competicionesFinales = new Map();
        for (const ronda of rondasCompletas) {
            if (!rondasFinalesSet.has(`${ronda.idTorneo}:${ronda.idCategoria}:${ronda.idRonda}`)) continue;
            const llave = `${ronda.idTorneo}:${ronda.idCategoria}`;
            if (!competicionesFinales.has(llave)) competicionesFinales.set(llave, []);
            const valor = ronda.media !== null ? ronda.media : ronda.single;
            competicionesFinales.get(llave).push({ idUsuario: ronda.idUsuario, nombre: ronda.nombre, valor });
        }
        for (const participantes of competicionesFinales.values()) {
            const clasificacion = asignarPuestos(participantes, (competidor) => competidor.valor);
            const podio = clasificacion.find((competidor) => competidor.idUsuario === idUsuario);
            if (podio?.puesto === 1) medallero.oro += 1;
            if (podio?.puesto === 2) medallero.plata += 1;
            if (podio?.puesto === 3) medallero.bronce += 1;
        }

        return res.json({
            perfil: req.publico
                ? { ...perfil, email: undefined, fecha_Nacimiento: undefined, idGenero: undefined }
                : perfil,
            estadisticas: {
                torneos: Number(cuentas[0].torneos),
                soluciones: Number(cuentas[0].soluciones),
                podios: medallero.oro + medallero.plata + medallero.bronce,
            },
            medallero,
            categorias,
        });
    } catch (error) {
        console.error('Error al cargar mi perfil:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo cargar tu perfil' });
    }
}

async function obtenerPerfilPublico(req, res) {
    const idUsuario = Number(req.params.idUsuario);
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({ mensaje: 'El usuario indicado no es válido' });
    }
    req.publico = true;
    return obtenerMiPerfil(req, res);
}

async function actualizarMiPerfil(req, res) {
    const idUsuario = Number(req.usuario.idUsuario);
    const { nombre, apellido, idPais, idGenero, fechaNacimiento, wcaid } = req.body || {};
    const paisId = Number(idPais);
    const generoId = Number(idGenero);
    const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
    const apellidoLimpio = typeof apellido === 'string' ? apellido.trim() : '';
    const wcaIdLimpio = typeof wcaid === 'string' ? wcaid.trim() : '';
    const fechaValida = !fechaNacimiento || (typeof fechaNacimiento === 'string'
        && /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
        && !Number.isNaN(Date.parse(`${fechaNacimiento}T00:00:00Z`))
        && new Date(`${fechaNacimiento}T00:00:00Z`).toISOString().slice(0, 10) === fechaNacimiento
        && fechaNacimiento <= new Date().toISOString().slice(0, 10));
    if (!nombreLimpio || nombreLimpio.length > 50 || !apellidoLimpio || apellidoLimpio.length > 50
        || !Number.isSafeInteger(paisId) || paisId <= 0
        || !Number.isSafeInteger(generoId) || generoId <= 0
        || !fechaValida
        || wcaIdLimpio.length > 10 || (wcaIdLimpio && !/^\d{4}[A-Z]{4}\d{2}$/.test(wcaIdLimpio))) {
        return res.status(400).json({ mensaje: 'Revisá los datos del perfil' });
    }
    try {
        const [[validos]] = await db.execute(
            `SELECT (SELECT COUNT(*) FROM paises WHERE idPais = ?) AS pais,
                    (SELECT COUNT(*) FROM generos WHERE id = ?) AS genero`,
            [paisId, generoId]
        );
        if (!validos.pais || !validos.genero) return res.status(400).json({ mensaje: 'El país o género seleccionado no existe' });
        await db.execute(
            `UPDATE usuarios
             SET idPais = ?, idGenero = ?, Nombre = ?, apellido = ?, fecha_Nacimiento = ?, wcaid = ?
             WHERE idUsuario = ?`,
            [paisId, generoId, nombreLimpio, apellidoLimpio, fechaNacimiento || null, wcaIdLimpio || null, idUsuario]
        );
        return res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Ese WCA ID ya está asociado a otra cuenta' });
        console.error('Error al actualizar mi perfil:', error.message);
        return res.status(500).json({ mensaje: 'No se pudo actualizar el perfil' });
    }
}

module.exports = { buscarCompetidores, obtenerMiPerfil, obtenerPerfilPublico, actualizarMiPerfil };
