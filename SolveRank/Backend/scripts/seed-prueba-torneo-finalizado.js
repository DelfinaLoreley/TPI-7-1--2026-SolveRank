require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const DATABASE_ESPERADA = '26_71_gutierrezd';
const NOMBRE_TORNEO = 'SolveRank - Torneo de prueba finalizado';
const PREFIJO_EMAIL = 'solverank.prueba.';
const CLAVE_COMUN = 'PruebaSolveRank2026!';
const CANTIDAD_COMPETIDORES = 100;

async function insertarLote(connection, tabla, columnas, filas) {
    const cantidadColumnas = columnas.length;
    const placeholdersFila = `(${Array(cantidadColumnas).fill('?').join(', ')})`;
    const placeholders = Array(filas.length).fill(placeholdersFila).join(', ');
    await connection.execute(
        `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES ${placeholders}`,
        filas.flat()
    );
}

async function main() {
    if (process.env.DB_NAME !== DATABASE_ESPERADA) {
        throw new Error(`Base inesperada. Se esperaba ${DATABASE_ESPERADA}.`);
    }
    if (process.env.CONFIRMAR_SEED_PRUEBAS !== 'SI') {
        throw new Error('Definí CONFIRMAR_SEED_PRUEBAS=SI para habilitar esta carga de prueba.');
    }

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 1,
        connectTimeout: 10000
    });
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [[rolCompetidor]] = await connection.execute(
            'SELECT idTipoUsuario FROM tipos_usuarios WHERE LOWER(Nombre) = LOWER(?) LIMIT 1',
            ['Competidor']
        );
        const [[rolOrganizador]] = await connection.execute(
            'SELECT idTipoUsuario FROM tipos_usuarios WHERE LOWER(Nombre) = LOWER(?) LIMIT 1',
            ['Organizador']
        );
        const [[organizador]] = await connection.execute(
            `SELECT u.idUsuario
             FROM usuarios u
             WHERE u.idTipoUsuario = ?
             ORDER BY u.idUsuario
             LIMIT 1`,
            [rolOrganizador?.idTipoUsuario]
        );
        const [[pais]] = await connection.execute(
            'SELECT idPais FROM paises WHERE pais = ? ORDER BY idPais LIMIT 1',
            ['Argentina']
        );
        const [[ubicacion]] = await connection.execute(
            `SELECT pr.idPais, pr.idProvincia, c.idCiudad
             FROM provincias pr
             INNER JOIN ciudades c ON c.idProvincia = pr.idProvincia
             WHERE pr.idPais = ?
             ORDER BY pr.idProvincia, c.idCiudad
             LIMIT 1`,
            [pais?.idPais]
        );
        const [[genero]] = await connection.execute('SELECT id FROM generos ORDER BY id LIMIT 1');
        const [[categoria]] = await connection.execute(
            'SELECT idCategoria FROM categorias WHERE LOWER(TRIM(categoria)) = LOWER(?) LIMIT 1',
            ['3x3x3']
        );
        const [[formato]] = await connection.execute(
            'SELECT idFormato, cantidad_Solves FROM formatos WHERE UPPER(formato) = ? LIMIT 1',
            ['AO5']
        );

        if (!rolCompetidor || !organizador || !ubicacion || !genero || !categoria || !formato) {
            throw new Error('Faltan roles, ubicación, género, categoría 3x3x3 o formato AO5 en los catálogos.');
        }

        const [usuariosPrevios] = await connection.execute(
            'SELECT COUNT(*) AS total FROM usuarios WHERE email LIKE ?',
            [`${PREFIJO_EMAIL}%@example.test`]
        );
        const [torneosPrevios] = await connection.execute(
            'SELECT COUNT(*) AS total FROM torneos WHERE nombre = ?',
            [NOMBRE_TORNEO]
        );
        if (Number(usuariosPrevios[0].total) || Number(torneosPrevios[0].total)) {
            throw new Error('Ya existen datos de esta carga. No se insertó nada para evitar duplicados.');
        }

        const passwordHash = await bcrypt.hash(CLAVE_COMUN, 10);
        const usuarios = Array.from({ length: CANTIDAD_COMPETIDORES }, (_, indice) => {
            const numero = String(indice + 1).padStart(3, '0');
            return [
                rolCompetidor.idTipoUsuario,
                ubicacion.idPais,
                genero.id,
                null,
                `CompetidorPrueba${numero}`,
                `SolveRank${numero}`,
                `${1990 + (indice % 16)}-${String((indice % 12) + 1).padStart(2, '0')}-${String((indice % 27) + 1).padStart(2, '0')}`,
                `${PREFIJO_EMAIL}${numero}@example.test`,
                passwordHash
            ];
        });
        await insertarLote(connection, 'usuarios', [
            'idTipoUsuario', 'idPais', 'idGenero', 'wcaid', 'Nombre', 'apellido',
            'fecha_Nacimiento', 'email', 'password_hash'
        ], usuarios);

        const [nuevosUsuarios] = await connection.execute(
            'SELECT idUsuario, email FROM usuarios WHERE email LIKE ? ORDER BY email',
            [`${PREFIJO_EMAIL}%@example.test`]
        );
        if (nuevosUsuarios.length !== CANTIDAD_COMPETIDORES) {
            throw new Error(`Se esperaban ${CANTIDAD_COMPETIDORES} cuentas, se encontraron ${nuevosUsuarios.length}.`);
        }

        const [creacionTorneo] = await connection.execute(
            `INSERT INTO torneos
                (idUsuario, idPais, idProvicncia, idCiudad, fecha_Inicio, fecha_fin,
                 Fecha_Inicio_Inscripcion, Fecha_fin_Inscripcion, nombre,
                 Contacto_Organizador, descripcion, Lugar_Venue, limite_participantes,
                 direccion, pathImagen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                organizador.idUsuario,
                ubicacion.idPais,
                ubicacion.idProvincia,
                ubicacion.idCiudad,
                '2026-08-15 09:00:00',
                '2026-08-15 18:00:00',
                '2026-07-01',
                '2026-08-14',
                NOMBRE_TORNEO,
                'solverank.prueba@example.test',
                'Torneo sintético para probar inscripciones, carga de resultados y rankings.',
                'Sede de pruebas SolveRank',
                120,
                'Dirección de prueba 100',
                null
            ]
        );
        const idTorneo = creacionTorneo.insertId;

        await connection.execute('INSERT INTO categorias_x_torneo (idTorneo, idCategoria) VALUES (?, ?)', [idTorneo, categoria.idCategoria]);
        await connection.execute(
            'INSERT INTO formato_x_categoria_x_torneo (idFormato, idCategoria, idTorneo) VALUES (?, ?, ?)',
            [formato.idFormato, categoria.idCategoria, idTorneo]
        );
        const [creacionRonda] = await connection.execute(
            'INSERT INTO rondas (ronda, cutoff, tiempoLimite, porcentajeAvance) VALUES (?, ?, ?, ?)',
            ['Final', '00:00:00', '00:10:00', 100]
        );
        const idRonda = creacionRonda.insertId;
        await connection.execute(
            'INSERT INTO rondas_x_categoria_x_torneo (idTorneo, idRonda, idCategoria) VALUES (?, ?, ?)',
            [idTorneo, idRonda, categoria.idCategoria]
        );
        await connection.execute(
            'INSERT INTO cronograma_x_torneo (idtorneo, idcategoria, idronda, evento, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?, ?)',
            [idTorneo, categoria.idCategoria, idRonda, 'Final', '09:00:00', '18:00:00']
        );

        await insertarLote(connection, 'usuarios_x_torneo', ['idUsuario', 'idTorneo'], nuevosUsuarios.map((u) => [u.idUsuario, idTorneo]));
        await insertarLote(connection, 'categorias_x_inscripcion', ['idUsuario', 'idTorneo', 'idCategoria'], nuevosUsuarios.map((u) => [u.idUsuario, idTorneo, categoria.idCategoria]));

        const intentos = [];
        for (let indice = 0; indice < nuevosUsuarios.length; indice += 1) {
            for (let intento = 0; intento < Number(formato.cantidad_Solves); intento += 1) {
                const numero = indice + 1;
                const dnf = intento === 4 && numero % 20 === 0;
                const centesimas = (numero * 37 + intento * 61) % 100;
                const segundos = 5 + ((numero * 11 + intento * 17) % 45);
                const tiempo = dnf
                    ? '00:00:00.00'
                    : `00:00:${String(segundos).padStart(2, '0')}.${String(centesimas).padStart(2, '0')}`;
                const penalizacion = dnf ? 'DNF' : (numero % 13 === 0 && intento === 1 ? '+2' : null);
                intentos.push([idRonda, idTorneo, nuevosUsuarios[indice].idUsuario, tiempo, penalizacion]);
            }
        }
        await insertarLote(connection, 'intentos_x_competidor', ['idRonda', 'idTorneo', 'idUsuario', 'tiempo', 'penalizacion'], intentos);

        await connection.commit();
        console.log(JSON.stringify({
            database: DATABASE_ESPERADA,
            idTorneo,
            idRonda,
            competidores: nuevosUsuarios.length,
            inscripciones: nuevosUsuarios.length,
            intentos: intentos.length,
            categoria: '3x3x3',
            formato: 'AO5',
            fechasTorneo: ['2026-08-15 09:00:00', '2026-08-15 18:00:00'],
            usuarioInicio: nuevosUsuarios[0].email,
            usuarioFin: nuevosUsuarios[nuevosUsuarios.length - 1].email,
            claveComun: CLAVE_COMUN
        }, null, 2));
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
