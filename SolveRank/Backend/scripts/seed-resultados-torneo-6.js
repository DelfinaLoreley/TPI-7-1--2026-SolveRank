require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');

const DATABASE_ESPERADA = '26_71_gutierrezd';
const ID_TORNEO = 6;
const PREFIJO_EMAIL = 'solverank.prueba.';

function formatoTiempo(centesimasTotales) {
    const segundosTotales = Math.floor(centesimasTotales / 100);
    const centesimas = centesimasTotales % 100;
    const horas = Math.floor(segundosTotales / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}.${String(centesimas).padStart(2, '0')}`;
}

function tiempoBase(categoria, posicion, indiceRonda) {
    const bases = {
        '2x2x2': [250, 10],
        '3x3x3': [500, 20],
        '4x4x4': [1500, 25],
        Pyraminx: [350, 10],
        Megaminx: [4000, 50]
    };
    const [base, incremento] = bases[categoria] || [800, 20];
    return base + (indiceRonda * 125) + (posicion * incremento);
}

function intentosPara(formato, base, cantidad) {
    const nombreFormato = String(formato).toUpperCase();
    if (nombreFormato === 'AO5' && cantidad === 5) {
        return [-20, -10, 0, 10, 20].map((variacion) => formatoTiempo(base + variacion));
    }
    if (nombreFormato === 'MO3' && cantidad === 3) {
        return [-10, 0, 10].map((variacion) => formatoTiempo(base + variacion));
    }
    if (nombreFormato.startsWith('BO') && cantidad > 0) {
        return Array.from({ length: cantidad }, (_, indice) => formatoTiempo(base + (indice * 30)));
    }
    throw new Error(`Formato no contemplado para la carga sintética: ${formato} (${cantidad} intentos).`);
}

async function insertarIntentos(connection, filas) {
    const loteMaximo = 100;
    for (let inicio = 0; inicio < filas.length; inicio += loteMaximo) {
        const lote = filas.slice(inicio, inicio + loteMaximo);
        const placeholders = lote.map(() => '(?, ?, ?, ?, ?)').join(', ');
        await connection.execute(
            `INSERT INTO intentos_x_competidor (idRonda, idTorneo, idUsuario, tiempo, penalizacion) VALUES ${placeholders}`,
            lote.flat()
        );
    }
}

async function main() {
    if (process.env.DB_NAME !== DATABASE_ESPERADA) {
        throw new Error(`Base inesperada. Se esperaba ${DATABASE_ESPERADA}.`);
    }
    if (process.env.CONFIRMAR_RESULTADOS_TORNEO_6 !== 'SI') {
        throw new Error('Definí CONFIRMAR_RESULTADOS_TORNEO_6=SI para habilitar esta carga.');
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
        const [[torneo]] = await connection.execute(
            'SELECT idTorneo FROM torneos WHERE idTorneo = ? FOR UPDATE',
            [ID_TORNEO]
        );
        if (!torneo) throw new Error(`No existe el torneo ${ID_TORNEO}.`);

        const [[resultadosPrevios]] = await connection.execute(
            'SELECT COUNT(*) AS total FROM intentos_x_competidor WHERE idTorneo = ?',
            [ID_TORNEO]
        );
        if (Number(resultadosPrevios.total)) {
            throw new Error('El torneo ya tiene resultados; no se insertó nada para evitar duplicados.');
        }

        const [competidores] = await connection.execute(
            `SELECT u.idUsuario, u.email
             FROM usuarios_x_torneo ux
             INNER JOIN usuarios u ON u.idUsuario = ux.idUsuario
             INNER JOIN tipos_usuarios tu ON tu.idTipoUsuario = u.idTipoUsuario
             WHERE ux.idTorneo = ? AND u.email LIKE ? AND LOWER(tu.Nombre) = LOWER(?)
             ORDER BY u.email`,
            [ID_TORNEO, `${PREFIJO_EMAIL}%@example.test`, 'Competidor']
        );
        if (competidores.length !== 90) {
            throw new Error(`Se esperaban 90 competidores de prueba inscriptos y hay ${competidores.length}.`);
        }

        const [configuraciones] = await connection.execute(
            `SELECT rct.idCategoria, c.categoria, rct.idRonda, r.ronda,
                    r.porcentajeAvance, f.formato, f.cantidad_Solves AS cantidadIntentos,
                    (SELECT COUNT(*) FROM categorias_x_inscripcion ci
                     WHERE ci.idTorneo = rct.idTorneo AND ci.idCategoria = rct.idCategoria) AS inscriptos
             FROM rondas_x_categoria_x_torneo rct
             INNER JOIN categorias c ON c.idCategoria = rct.idCategoria
             INNER JOIN rondas r ON r.idRonda = rct.idRonda
             INNER JOIN formato_x_categoria_x_torneo fct
                ON fct.idTorneo = rct.idTorneo AND fct.idCategoria = rct.idCategoria
             INNER JOIN formatos f ON f.idFormato = fct.idFormato
             WHERE rct.idTorneo = ?
             ORDER BY rct.idCategoria, rct.idRonda`,
            [ID_TORNEO]
        );
        const categorias = [...new Set(configuraciones.map((fila) => Number(fila.idCategoria)))];
        if (categorias.length !== 5 || configuraciones.length !== 15) {
            throw new Error(`Configuración inesperada: ${categorias.length} categorías y ${configuraciones.length} rondas.`);
        }
        if (configuraciones.some((fila) => Number(fila.inscriptos) !== 90)) {
            throw new Error('No todas las categorías tienen exactamente 90 inscriptos.');
        }

        const filasIntentos = [];
        const resumen = [];
        for (const idCategoria of categorias) {
            const rondas = configuraciones.filter((fila) => Number(fila.idCategoria) === idCategoria);
            let participantes = competidores;

            for (let indiceRonda = 0; indiceRonda < rondas.length; indiceRonda += 1) {
                const ronda = rondas[indiceRonda];
                if (/final/i.test(String(ronda.ronda || ''))) break;
                const porcentaje = Number(ronda.porcentajeAvance);
                if (!Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 100) {
                    throw new Error(`Porcentaje de avance inválido en ${ronda.categoria} ${ronda.ronda}.`);
                }

                participantes.forEach((competidor, posicion) => {
                    const base = tiempoBase(ronda.categoria, posicion, indiceRonda);
                    for (const tiempo of intentosPara(ronda.formato, base, Number(ronda.cantidadIntentos))) {
                        filasIntentos.push([ronda.idRonda, ID_TORNEO, competidor.idUsuario, tiempo, null]);
                    }
                });

                const cantidadAvanzan = Math.min(
                    participantes.length,
                    Math.ceil(participantes.length * porcentaje / 100)
                );
                resumen.push({
                    categoria: ronda.categoria,
                    ronda: ronda.ronda,
                    participantes: participantes.length,
                    porcentajeAvance: porcentaje,
                    avanzan: cantidadAvanzan,
                    intentos: participantes.length * Number(ronda.cantidadIntentos)
                });
                participantes = participantes.slice(0, cantidadAvanzan);
            }
        }

        await insertarIntentos(connection, filasIntentos);
        await connection.commit();
        console.log(JSON.stringify({
            base: DATABASE_ESPERADA,
            idTorneo: ID_TORNEO,
            competidoresInscritos: competidores.length,
            rondasConResultados: resumen.length,
            intentosGuardados: filasIntentos.length,
            progresion: resumen
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
