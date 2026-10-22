import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';
import resultadosIcon from '/src/assets/home/iconos/resultados-icon-selected.png';
import { categorias as catalogoCategorias } from './pasos/datosCategorias.js';
import './ResultadosPublicosTorneo.css';

function centesimas(tiempo) {
    const texto = String(tiempo || '').trim().toUpperCase();
    if (!texto || texto === 'DNF' || texto === 'DNS') return null;
    const partes = texto.match(/^(?:(\d{1,3}):)?([0-5]?\d)\.(\d{2})(\+2)?$/);
    if (!partes) return null;
    return ((Number(partes[1] || 0) * 60 + Number(partes[2])) * 100)
        + Number(partes[3]) + (partes[4] ? 200 : 0);
}

function tiempoLegible(valor) {
    if (!Number.isFinite(valor)) return 'DNF';
    const minutos = Math.floor(valor / 6000);
    const segundos = Math.floor((valor % 6000) / 100);
    const decimas = Math.trunc(valor % 100);
    const tiempo = `${String(segundos).padStart(2, '0')}.${String(decimas).padStart(2, '0')}`;
    return minutos ? `${String(minutos).padStart(2, '0')}:${tiempo}` : tiempo;
}

function quitarMinutosCero(valor) {
    return String(valor || '—').replace(/^00:/, '');
}

function calcularFila(competidor, ronda) {
    const cantidad = Number(ronda.cantidadIntentos) || competidor.intentos?.length || 0;
    const intentosOriginales = (competidor.intentos || []).slice(0, cantidad);
    const valores = intentosOriginales.map(centesimas);
    const validos = valores.filter((valor) => valor !== null);
    const mejor = validos.length ? Math.min(...validos) : null;
    const completo = cantidad > 0 && intentosOriginales.length === cantidad && intentosOriginales.every(Boolean);
    const formato = String(ronda.formato || '').toUpperCase();
    let resultado = null;
    let media = null;

    if (completo) {
        if (formato.startsWith('BO')) {
            resultado = mejor ?? Infinity;
        } else if (formato === 'AO5') {
            const ordenados = [...valores].sort((a, b) => (a ?? Infinity) - (b ?? Infinity));
            const aPromediar = ordenados.slice(1, -1);
            resultado = aPromediar.some((valor) => valor === null)
                ? Infinity
                : Math.floor(aPromediar.reduce((suma, valor) => suma + valor, 0) / aPromediar.length);
            media = resultado;
        } else {
            resultado = valores.some((valor) => valor === null)
                ? Infinity
                : Math.floor(valores.reduce((suma, valor) => suma + valor, 0) / valores.length);
            media = resultado;
        }
    }

    const intentosParaMostrar = intentosOriginales.map((intento, indice) => {
        const valor = valores[indice];
        let texto = quitarMinutosCero(intento);
        let descartado = false;
        if (completo && formato === 'AO5' && valores.length === 5) {
            const posiciones = valores.map((tiempo, indiceOriginal) => ({ tiempo: tiempo ?? Infinity, indice: indiceOriginal }))
                .sort((a, b) => a.tiempo - b.tiempo || a.indice - b.indice);
            descartado = indice === posiciones[0].indice || indice === posiciones.at(-1).indice;
        }
        if (descartado && texto !== '—') texto = `(${texto})`;
        return texto || (valor === null ? '—' : tiempoLegible(valor));
    });

    return {
        ...competidor,
        intentosParaMostrar,
        mejor,
        media,
        resultado: resultado === Infinity ? Infinity : resultado,
        completo
    };
}

function ordenarFilas(ronda) {
    return (ronda.competidores || [])
        .map((competidor) => calcularFila(competidor, ronda))
        .sort((a, b) => {
            if (a.resultado === null) return b.resultado === null
                ? a.nombre.localeCompare(b.nombre, 'es')
                : 1;
            if (b.resultado === null) return -1;
            if (a.resultado === Infinity) return b.resultado === Infinity ? a.nombre.localeCompare(b.nombre, 'es') : 1;
            if (b.resultado === Infinity) return -1;
            return a.resultado - b.resultado || a.nombre.localeCompare(b.nombre, 'es');
        });
}

function iconoCategoria(nombre) {
    const normalizado = String(nombre || '').trim().toLocaleLowerCase('es');
    return catalogoCategorias.find(({ id, etiqueta }) =>
        String(id).toLocaleLowerCase('es') === normalizado
        || String(etiqueta).toLocaleLowerCase('es') === normalizado
    )?.icono;
}

function cantidadClasifican(ronda, rondas) {
    if (/final/i.test(String(ronda.ronda || ''))) return 0;
    const rondasCategoria = rondas
        .filter((item) => String(item.idCategoria) === String(ronda.idCategoria))
        .sort((a, b) => Number(a.idRonda) - Number(b.idRonda));
    const indice = rondasCategoria.findIndex((item) => String(item.idRonda) === String(ronda.idRonda));
    if (indice < 0) return 0;

    let participantes = Number(ronda.totalCompetidores) || 0;
    for (let i = 0; i < indice; i += 1) {
        if (/final/i.test(String(rondasCategoria[i].ronda || ''))) return 0;
        const porcentaje = Math.max(0, Math.min(100, Number(rondasCategoria[i].porcentajeAvance) || 0));
        participantes = Math.ceil(participantes * porcentaje / 100);
    }
    const porcentaje = Math.max(0, Math.min(100, Number(ronda.porcentajeAvance) || 0));
    return Math.ceil(participantes * porcentaje / 100);
}

function esUltimaRonda(ronda, rondas) {
    const rondasCategoria = rondas
        .filter((item) => String(item.idCategoria) === String(ronda.idCategoria))
        .sort((a, b) => Number(a.idRonda) - Number(b.idRonda));
    return String(rondasCategoria.at(-1)?.idRonda) === String(ronda.idRonda);
}

function TablaResultados({ ronda, rondas, podios = false, ultimaRonda = false }) {
    const filas = ordenarFilas(ronda);
    const visibles = podios ? filas.filter((fila) => Number.isFinite(fila.resultado)).slice(0, 3) : filas;
    const avanzan = cantidadClasifican(ronda, rondas);
    const formato = String(ronda.formato || '').toUpperCase();
    const cantidad = Number(ronda.cantidadIntentos) || 0;
    const icono = iconoCategoria(ronda.categoria);

    return (
        <section className={`resultados-publicos-bloque${podios ? ' podios' : ''}`}>
            <h3 className="resultados-publicos-categoria">
                <span aria-hidden="true">⟵</span>
                {icono && <img src={icono} alt="" />}
                <span>{ronda.categoria}</span>
                <span aria-hidden="true">⟶</span>
            </h3>
            {!podios && <p className="resultados-publicos-ronda">{ronda.ronda}</p>}
            <div className="resultados-publicos-tabla-contenedor">
                <table className="resultados-publicos-tabla">
                    <thead>
                        <tr>
                            <th scope="col">Pos.</th>
                            <th scope="col">Nombre</th>
                            <th scope="col">País</th>
                            {Array.from({ length: cantidad }, (_, indice) => <th scope="col" key={indice}>{indice + 1}</th>)}
                            <th scope="col">Single</th>
                            <th scope="col">{formato.startsWith('BO') ? 'Resultado' : 'Media'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.length ? visibles.map((fila, indice) => (
                            <tr key={fila.idUsuario}>
                                <td className={[
                                    'resultados-publicos-puesto',
                                    !podios && !ultimaRonda && fila.resultado !== null && indice < avanzan
                                        ? 'resultados-publicos-clasifica'
                                        : '',
                                    (podios || ultimaRonda) && Number.isFinite(fila.resultado) && indice < 3
                                        ? `resultados-publicos-podio-${indice + 1}`
                                        : '',
                                ].filter(Boolean).join(' ')}>
                                    {(podios || ultimaRonda) && Number.isFinite(fila.resultado) && indice < 3 && (
                                        <span aria-label={`Puesto ${indice + 1}`}>{['🥇', '🥈', '🥉'][indice]}</span>
                                    )}
                                    {indice + 1}
                                </td>
                                <td className="resultados-publicos-nombre">{fila.nombre}</td>
                                <td>{fila.pais || '—'}</td>
                                {Array.from({ length: cantidad }, (_, intento) => (
                                    <td key={intento}>{fila.intentosParaMostrar[intento] || '—'}</td>
                                ))}
                                <td className="resultados-publicos-total">
                                    {fila.mejor === null ? (fila.completo ? 'DNF' : '—') : tiempoLegible(fila.mejor)}
                                </td>
                                <td className="resultados-publicos-total">
                                    {fila.resultado === null ? '—' : Number.isFinite(fila.resultado) ? tiempoLegible(fila.resultado) : 'DNF'}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={cantidad + 5}>Todavía no hay resultados para esta ronda.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function ResultadosPublicosTorneo({ idTorneo, rondas = [] }) {
    const [modo, setModo] = useState('podios');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [resultados, setResultados] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;
        setCargando(true);
        setError('');
        axios.get(`/torneos/${idTorneo}/resultados/publicos/completo`)
            .then(({ data }) => { if (activo) setResultados(data.rondas ?? []); })
            .catch((err) => {
                if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar los resultados del torneo.');
            })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [idTorneo]);

    const categorias = useMemo(() => {
        const unicas = new Map();
        for (const ronda of rondas) {
            if (!unicas.has(String(ronda.idCategoria))) {
                unicas.set(String(ronda.idCategoria), { id: String(ronda.idCategoria), nombre: ronda.categoria });
            }
        }
        return [...unicas.values()];
    }, [rondas]);

    const rondasVisibles = resultados.filter((ronda) => !categoriaSeleccionada || String(ronda.idCategoria) === categoriaSeleccionada);
    const categoriasVisibles = categorias.filter((categoria) => !categoriaSeleccionada || categoria.id === categoriaSeleccionada);

    const podios = categoriasVisibles.map((categoria) => {
        const rondasCategoria = rondasVisibles
            .filter((ronda) => String(ronda.idCategoria) === categoria.id)
            .sort((a, b) => Number(a.idRonda) - Number(b.idRonda));
        const rondaFinal = rondasCategoria.find((ronda) => /final/i.test(String(ronda.ronda || '')));
        const rondaConResultados = rondaFinal?.competidores?.length
            ? rondaFinal
            : [...rondasCategoria].reverse().find((ronda) => ronda.competidores?.length);
        return rondaConResultados || null;
    }).filter(Boolean);

    return (
        <section className="resultados-publicos-panel" aria-labelledby="resultados-publicos-titulo">
            <h2 id="resultados-publicos-titulo"><img src={resultadosIcon} alt="" /> RESULTADOS</h2>
            <div className="resultados-publicos-filtros">
                <span>Mostrar por:</span>
                <div className="resultados-publicos-modos" role="group" aria-label="Filtrar resultados por modo">
                    <button type="button" className={modo === 'podios' ? 'activo' : ''} aria-pressed={modo === 'podios'} onClick={() => setModo('podios')}>PODIOS</button>
                    <button type="button" className={modo === 'todos' ? 'activo' : ''} aria-pressed={modo === 'todos'} onClick={() => setModo('todos')}>TODOS</button>
                </div>
                <label className="resultados-publicos-filtro-categoria">
                    <span className="sr-only">Filtrar por categoría</span>
                    <select value={categoriaSeleccionada} onChange={(evento) => setCategoriaSeleccionada(evento.target.value)}>
                        <option value="">Todas las categorías</option>
                        {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
                    </select>
                </label>
            </div>

            {cargando ? <p className="resultados-publicos-mensaje" role="status">Cargando resultados…</p>
                : error ? <p className="resultados-publicos-mensaje" role="alert">{error}</p>
                    : modo === 'podios' ? (
                        podios.length ? podios.map((ronda) => <TablaResultados key={ronda.idRonda} ronda={ronda} rondas={resultados} podios />)
                            : <p className="resultados-publicos-mensaje">Todavía no hay resultados para mostrar en los podios.</p>
                    ) : (
                        rondasVisibles.length ? rondasVisibles.map((ronda) => (
                            <TablaResultados
                                key={ronda.idRonda}
                                ronda={ronda}
                                rondas={resultados}
                                ultimaRonda={esUltimaRonda(ronda, resultados)}
                            />
                        ))
                            : <p className="resultados-publicos-mensaje">Todavía no se cargaron resultados para estas categorías.</p>
                    )}
        </section>
    );
}

export default ResultadosPublicosTorneo;
