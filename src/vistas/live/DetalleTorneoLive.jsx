import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';
import PaisConBandera from '../../componentes/PaisConBandera.jsx';
import TiempoConBadge from '../../componentes/TiempoConBadge.jsx';
import useMarcasTiempos from '../../hooks/useMarcasTiempos.js';

import mediaIcon from '/src/assets/icons/promedio-icon.png';
import searchIcon from '/src/assets/icons/search-icon.png';
import userPfpIcon from '/src/assets/home/iconos/user-pfp-icon.png';
import compIcon from '/src/assets/icons/organizador-azul-icon.svg';
import starIcon from '/src/assets/torneos/estrella-icon-responsive.png';
import rondaIcon from '/src/assets/torneos/rondas-icon.svg';

import { categorias as catalogoCategorias } from '../torneos/pasos/datosCategorias.js';
import '../torneos/CargaResultadosTorneo.css';
import './DetalleTorneoLive.css';

function normalizar(valor) {
    return String(valor ?? '').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tiempoACentesimas(tiempo) {
    const texto = String(tiempo ?? '').trim().toUpperCase();
    if (!texto || texto === 'DNF' || texto === 'DNS') return null;
    const coincidencia = texto.match(/^(?:(\d{1,3}):)?([0-5]?\d)\.(\d{2})(\+2)?$/);
    if (!coincidencia) return null;
    return ((Number(coincidencia[1] || 0) * 60 + Number(coincidencia[2])) * 100)
        + Number(coincidencia[3]) + (coincidencia[4] ? 200 : 0);
}

function tiempoLegible(valor) {
    if (!Number.isFinite(valor)) return 'DNF';
    const minutos = Math.floor(valor / 6000);
    const segundos = Math.floor((valor % 6000) / 100);
    const centesimas = Math.trunc(valor % 100);
    const tiempo = `${String(segundos).padStart(2, '0')}.${String(centesimas).padStart(2, '0')}`;
    return minutos ? `${String(minutos).padStart(2, '0')}:${tiempo}` : tiempo;
}

function horarioLegible(valor) {
    return valor ? String(valor).slice(0, 5) : '—';
}

function obtenerIconoCategoria(nombre, seleccionado = false) {
    const normalizado = normalizar(nombre);
    const categoria = catalogoCategorias.find(({ id, etiqueta }) =>
        normalizar(id) === normalizado || normalizar(etiqueta) === normalizado
    );
    return seleccionado ? (categoria?.iconoSeleccionado || categoria?.icono) : categoria?.icono;
}

function construirFila(competidor, ronda) {
    const cantidad = Number(ronda.cantidadIntentos) || 0;
    const intentos = (competidor.intentos ?? []).slice(0, cantidad);
    const valores = intentos.map(tiempoACentesimas);
    const validos = valores.filter((valor) => valor !== null);
    const mejor = validos.length ? Math.min(...validos) : null;
    const completo = cantidad > 0 && intentos.length === cantidad;
    const formato = String(ronda.formato ?? '').toUpperCase();
    let resultado = null;

    if (completo) {
        if (formato.startsWith('BO')) {
            resultado = mejor ?? Infinity;
        } else if (formato === 'AO5') {
            const promediar = [...valores].sort((a, b) => (a ?? Infinity) - (b ?? Infinity)).slice(1, -1);
            resultado = promediar.some((valor) => valor === null)
                ? Infinity
                : promediar.reduce((suma, valor) => suma + valor, 0) / promediar.length;
        } else {
            resultado = valores.some((valor) => valor === null)
                ? Infinity
                : valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
        }
    }

    return { ...competidor, intentos, mejor, resultado, completo };
}

function ordenarFilas(ronda) {
    return (ronda?.competidores ?? [])
        .map((competidor) => construirFila(competidor, ronda))
        .sort((a, b) => {
            if (a.resultado === null) return b.resultado === null ? a.nombre.localeCompare(b.nombre, 'es') : 1;
            if (b.resultado === null) return -1;
            if (a.resultado === Infinity) return b.resultado === Infinity ? a.nombre.localeCompare(b.nombre, 'es') : 1;
            if (b.resultado === Infinity) return -1;
            return a.resultado - b.resultado || a.nombre.localeCompare(b.nombre, 'es');
        });
}

function fechaLocal(fecha) {
    if (!fecha) return null;
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
    if (!anio || !mes || !dia) return null;
    return new Date(anio, mes - 1, dia);
}

function esActividadActual(actividad, torneo, ahora) {
    const inicioTorneo = fechaLocal(torneo.fecha_Inicio);
    const finTorneo = fechaLocal(torneo.fecha_fin) ?? inicioTorneo;
    if (finTorneo) finTorneo.setHours(23, 59, 59, 999);
    if (!inicioTorneo || !finTorneo || ahora < inicioTorneo || ahora > finTorneo) return false;
    const horaInicio = String(actividad.horaInicio ?? '').slice(0, 5);
    const horaFin = String(actividad.horaFin ?? '').slice(0, 5);
    if (!horaInicio || !horaFin) return false;
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    return horaActual >= horaInicio && horaActual <= horaFin;
}

function TablaResultadosLive({ ronda, marcasTiempos }) {
    const filas = ordenarFilas(ronda);
    const cantidad = Number(ronda?.cantidadIntentos) || 0;
    const [competidorSeleccionado, setCompetidorSeleccionado] = useState(null);
    const esFormatoBo = String(ronda?.formato ?? '').toUpperCase().startsWith('BO');
    const obtenerMarca = (competidor) => marcasTiempos[`${ronda?.idCategoria}:${competidor.idUsuario}`]
        || competidor.marcas;
    const marcaSeleccionada = competidorSeleccionado
        ? obtenerMarca(competidorSeleccionado.fila)
        : null;

    useEffect(() => {
        if (!competidorSeleccionado) return undefined;

        function cerrarConEscape(evento) {
            if (evento.key === 'Escape') setCompetidorSeleccionado(null);
        }

        document.addEventListener('keydown', cerrarConEscape);
        return () => document.removeEventListener('keydown', cerrarConEscape);
    }, [competidorSeleccionado]);

    function abrirDetalleCompetidor(fila, indice) {
        if (!window.matchMedia('(max-width: 560px)').matches) return;
        setCompetidorSeleccionado({
            fila,
            posicion: fila.resultado !== null ? indice + 1 : '—',
        });
    }

    function verTodosLosResultados() {
        setCompetidorSeleccionado(null);
        document.querySelector('.live-detalle-resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return (
        <>
            <div className="live-detalle-tabla-contenedor" role="region" aria-label="Resultados de la categoría" tabIndex={0}>
                <table className="live-detalle-tabla">
                    <thead>
                        <tr>
                            <th scope="col">Pos.</th>
                            <th scope="col">Nombre</th>
                            <th scope="col">País</th>
                            <th scope="col">Single</th>
                            <th scope="col">{esFormatoBo ? 'Resultado' : 'Media'}</th>
                            {Array.from({ length: cantidad }, (_, indice) => <th scope="col" key={indice}>{indice + 1}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filas.length ? filas.map((fila, indice) => (
                            <tr key={fila.idUsuario}>
                                <td className={indice < 3 && fila.resultado !== null ? `live-detalle-puesto puesto-${indice + 1}` : 'live-detalle-puesto'}>
                                    {fila.resultado === null ? '—' : indice + 1}
                                </td>
                                <td>
                                    <button
                                        className="live-detalle-nombre-competidor"
                                        type="button"
                                        aria-label={`Ver intentos de ${fila.nombre}`}
                                        onClick={() => abrirDetalleCompetidor(fila, indice)}
                                    >
                                        {fila.nombre}
                                    </button>
                                </td>
                                <td><PaisConBandera pais={fila.pais} /></td>
                                <td><TiempoConBadge valor={fila.mejor === null ? null : fila.mejor / 100} marca={obtenerMarca(fila)}>{fila.mejor === null ? (fila.completo ? 'DNF' : '—') : tiempoLegible(fila.mejor)}</TiempoConBadge></td>
                                <td><TiempoConBadge valor={Number.isFinite(fila.resultado) ? fila.resultado / 100 : null} tipo={esFormatoBo ? 'single' : 'media'} marca={obtenerMarca(fila)}>{fila.resultado === null ? '—' : Number.isFinite(fila.resultado) ? tiempoLegible(fila.resultado) : 'DNF'}</TiempoConBadge></td>
                                {Array.from({ length: cantidad }, (_, intento) => (
                                    <td key={intento}>{String(fila.intentos[intento] ?? '—').replace(/^00:/, '')}</td>
                                ))}
                            </tr>
                        )) : (
                            <tr><td colSpan={cantidad + 5}>Todavía no hay resultados para esta ronda.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {competidorSeleccionado && (
                <div
                    className="carga-resultados-modal-fondo"
                    onMouseDown={(evento) => {
                        if (evento.target === evento.currentTarget) setCompetidorSeleccionado(null);
                    }}
                >
                    <section
                        className="carga-resultados-modal live-detalle-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="carga-resultados-modal-titulo"
                        tabIndex="-1"
                    >
                        <header className="carga-resultados-modal-perfil">
                            <img src={userPfpIcon} alt="" />
                            <div>
                                <h2 id="carga-resultados-modal-titulo">
                                    {competidorSeleccionado.fila.nombre}
                                    {' '}
                                    <strong>#{competidorSeleccionado.posicion}</strong>
                                </h2>
                                <p><PaisConBandera pais={competidorSeleccionado.fila.pais} fallback="País no informado" /></p>
                            </div>
                        </header>

                        <div className="carga-resultados-modal-datos">
                            <div>
                                <span className="carga-resultados-modal-icono"><img src={compIcon} alt="" /></span>
                                <span>Competidor<strong>ID: {competidorSeleccionado.fila.idUsuario}</strong></span>
                            </div>
                            <div>
                                <span className="carga-resultados-modal-icono categoria">
                                    {obtenerIconoCategoria(ronda?.categoria, true)
                                        ? <img src={obtenerIconoCategoria(ronda?.categoria, true)} alt="" />
                                        : '◇'}
                                </span>
                                <span>Categoría<strong>{ronda?.categoria || '—'}</strong></span>
                            </div>
                            <div>
                                <span className="carga-resultados-modal-icono"><img src={rondaIcon} alt="" /></span>
                                <span>Ronda<strong>{ronda?.ronda || '—'}</strong></span>
                            </div>
                        </div>

                        <h3 className="carga-resultados-modal-intentos-titulo">Intentos</h3>
                        <div className="carga-resultados-modal-intentos">
                            {Array.from({ length: cantidad }, (_, intento) => (
                                <div key={intento}>
                                    <strong>{intento + 1}</strong>
                                    <span>{String(competidorSeleccionado.fila.intentos[intento] ?? '—').replace(/^00:/, '')}</span>
                                </div>
                            ))}
                        </div>

                        <div className="carga-resultados-modal-estadisticas">
                            <div>
                                <span className="carga-resultados-modal-icono"><img src={mediaIcon} alt="" /></span>
                                <span>{esFormatoBo ? 'Resultado' : 'Promedio'}
                                    <strong><TiempoConBadge valor={Number.isFinite(competidorSeleccionado.fila.resultado) ? competidorSeleccionado.fila.resultado / 100 : null} tipo={esFormatoBo ? 'single' : 'media'} marca={marcaSeleccionada}>
                                        {competidorSeleccionado.fila.resultado === null
                                            ? '—'
                                            : Number.isFinite(competidorSeleccionado.fila.resultado)
                                            ? tiempoLegible(competidorSeleccionado.fila.resultado)
                                            : 'DNF'}
                                    </TiempoConBadge></strong>
                                </span>
                            </div>
                            <div>
                                <span className="carga-resultados-modal-estrella" aria-hidden="true"><img src={starIcon} alt="" /></span>
                                <span>Mejor
                                    <strong><TiempoConBadge valor={competidorSeleccionado.fila.mejor === null ? null : competidorSeleccionado.fila.mejor / 100} marca={marcaSeleccionada}>
                                        {competidorSeleccionado.fila.mejor === null
                                            ? (competidorSeleccionado.fila.completo ? 'DNF' : '—')
                                            : tiempoLegible(competidorSeleccionado.fila.mejor)}
                                    </TiempoConBadge></strong>
                                </span>
                            </div>
                        </div>

                        <footer className="carga-resultados-modal-acciones">
                            <button type="button" onClick={verTodosLosResultados}>Ver todos los resultados</button>
                            <button type="button" onClick={() => setCompetidorSeleccionado(null)}>Cerrar</button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}

function DetalleTorneoLive({ torneoSeleccionado, onSalir }) {
    const idTorneo = torneoSeleccionado?.idTorneo;
    const [detalle, setDetalle] = useState(null);
    const [datosLive, setDatosLive] = useState({ competidores: [], rondas: [] });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [errorActualizacion, setErrorActualizacion] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [rondaSeleccionada, setRondaSeleccionada] = useState('');
    const [busquedaCompetidor, setBusquedaCompetidor] = useState('');
    const [ahora, setAhora] = useState(() => new Date());

    const registrosParaMarcas = useMemo(
        () => datosLive.rondas.flatMap((ronda) => (ronda.competidores ?? []).map((competidor) => ({
            idCategoria: ronda.idCategoria,
            idUsuario: competidor.idUsuario
        }))),
        [datosLive.rondas]
    );
    const marcasTiempos = useMarcasTiempos(registrosParaMarcas);

    useEffect(() => {
        let activo = true;
        Promise.all([
            axios.get(`/torneos/detalle/${idTorneo}`),
            axios.get(`/torneos/${idTorneo}/live`)
        ])
            .then(([{ data: dataDetalle }, { data: dataLive }]) => {
                if (!activo) return;
                setDetalle(dataDetalle);
                setDatosLive({
                    competidores: dataLive.competidores ?? [],
                    rondas: dataLive.rondas ?? []
                });
            })
            .catch((err) => {
                if (activo) setError(err?.response?.data?.mensaje || 'No se pudo cargar la información en vivo del torneo.');
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        return () => { activo = false; };
    }, [idTorneo]);

    useEffect(() => {
        let activo = true;
        const actualizarResultados = () => {
            axios.get(`/torneos/${idTorneo}/live`)
                .then(({ data }) => {
                    if (!activo) return;
                    setDatosLive({
                        competidores: data.competidores ?? [],
                        rondas: data.rondas ?? []
                    });
                    setErrorActualizacion('');
                })
                .catch((err) => {
                    if (activo) setErrorActualizacion(err?.response?.data?.mensaje || 'No se pudieron actualizar los datos en vivo.');
                });
        };
        const intervalo = window.setInterval(actualizarResultados, 30000);
        return () => {
            activo = false;
            window.clearInterval(intervalo);
        };
    }, [idTorneo]);

    useEffect(() => {
        const intervalo = window.setInterval(() => setAhora(new Date()), 30000);
        return () => window.clearInterval(intervalo);
    }, []);

    const torneo = detalle?.torneo;
    const categorias = useMemo(() => {
        const unicas = new Map();
        for (const categoria of detalle?.categorias ?? []) {
            const id = String(categoria.idCategoria);
            if (!unicas.has(id)) unicas.set(id, { id, nombre: categoria.categoria });
        }
        return [...unicas.values()];
    }, [detalle]);

    const actividadActual = useMemo(
        () => detalle?.cronograma?.find((actividad) => esActividadActual(actividad, torneo ?? {}, ahora)),
        [detalle, torneo, ahora]
    );
    const idCategoriaActiva = categoriaSeleccionada
        || String(actividadActual?.idCategoria ?? categorias[0]?.id ?? '');
    const categoriaActiva = categorias.find((categoria) => categoria.id === idCategoriaActiva);
    const rondasCategoria = useMemo(
        () => datosLive.rondas
            .filter((ronda) => String(ronda.idCategoria) === idCategoriaActiva)
            .sort((a, b) => Number(a.idRonda) - Number(b.idRonda)),
        [datosLive.rondas, idCategoriaActiva]
    );
    const actividadRondaActual = actividadActual
        && String(actividadActual.idCategoria) === idCategoriaActiva
        ? actividadActual
        : null;
    const idRondaActiva = rondaSeleccionada
        || String(actividadRondaActual?.idRonda ?? rondasCategoria[0]?.idRonda ?? '');
    const rondaActiva = rondasCategoria.find((ronda) => String(ronda.idRonda) === idRondaActiva);

    const cronograma = useMemo(() => (detalle?.cronograma ?? []).map((actividad) => {
        const categoria = categorias.find((item) => item.id === String(actividad.idCategoria));
        const configuracion = (detalle?.categorias ?? []).find((item) =>
            String(item.idCategoria) === String(actividad.idCategoria)
            && String(item.idRonda) === String(actividad.idRonda)
        );
        return { ...actividad, nombreCategoria: categoria?.nombre ?? actividad.categoria, formato: configuracion?.formato };
    }), [detalle, categorias]);

    const competidoresFiltrados = useMemo(() => {
        const termino = busquedaCompetidor.trim().toLocaleLowerCase('es');
        return datosLive.competidores.filter((competidor) =>
            !termino || `${competidor.nombre} ${competidor.pais ?? ''}`.toLocaleLowerCase('es').includes(termino)
        );
    }, [datosLive.competidores, busquedaCompetidor]);

    function cambiarCategoria(evento) {
        setCategoriaSeleccionada(evento.target.value);
        setRondaSeleccionada('');
    }

    if (cargando) {
        return <main className="live-detalle-page"><p className="live-detalle-mensaje" role="status">Cargando torneo…</p></main>;
    }
    if (error || !torneo) {
        return (
            <main className="live-detalle-page">
                <div className="live-detalle-contenido">
                    <button className="live-detalle-volver" type="button" onClick={onSalir}>← Volver a SolveRank LIVE</button>
                    <p className="live-detalle-mensaje" role="alert">{error || 'No se encontró el torneo.'}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="live-detalle-page">
            <div className="live-detalle-contenido">
                <button className="live-detalle-volver" type="button" onClick={onSalir}>← Volver a SolveRank LIVE</button>
                <header className="live-detalle-encabezado">
                    <h1>{torneo.nombre}</h1>
                    <label className="live-detalle-select-categoria">
                        {obtenerIconoCategoria(categoriaActiva?.nombre) && (
                            <img src={obtenerIconoCategoria(categoriaActiva?.nombre)} alt="" />
                        )}
                        <select value={idCategoriaActiva} onChange={cambiarCategoria} aria-label="Categoría">
                            {categorias.map((categoria) => (
                                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                            ))}
                        </select>
                    </label>
                </header>

                <section className="live-detalle-seccion live-detalle-resultados" aria-labelledby="live-resultados-titulo">
                    <div className="live-detalle-resultados-encabezado">
                        <h2 id="live-resultados-titulo">{categoriaActiva?.nombre ?? 'Resultados'}</h2>
                        {actividadRondaActual && (
                            <span className="live-detalle-en-curso"><span aria-hidden="true" />En curso: {actividadRondaActual.evento || actividadRondaActual.ronda}</span>
                        )}
                    </div>
                    {errorActualizacion && <p className="live-detalle-mensaje" role="alert">{errorActualizacion}</p>}
                    {rondasCategoria.length ? (
                        <>
                            <nav className="live-detalle-rondas" aria-label="Rondas de la categoría">
                                {rondasCategoria.map((ronda) => (
                                    <button
                                        type="button"
                                        key={ronda.idRonda}
                                        className={String(ronda.idRonda) === idRondaActiva ? 'activa' : ''}
                                        aria-pressed={String(ronda.idRonda) === idRondaActiva}
                                        onClick={() => setRondaSeleccionada(String(ronda.idRonda))}
                                    >
                                        <span>{ronda.ronda}</span>
                                    </button>
                                ))}
                            </nav>
                            <TablaResultadosLive ronda={rondaActiva} marcasTiempos={marcasTiempos} />
                        </>
                    ) : (
                        <p className="live-detalle-mensaje">Todavía no hay rondas configuradas para esta categoría.</p>
                    )}
                </section>

                <section className="live-detalle-seccion" aria-labelledby="live-cronograma-titulo">
                    <h2 id="live-cronograma-titulo">Cronograma</h2>
                    {cronograma.length ? (
                        <div className="live-detalle-cronograma">
                            {cronograma.map((actividad, indice) => {
                                const icono = obtenerIconoCategoria(actividad.nombreCategoria);
                                const actual = esActividadActual(actividad, torneo, ahora);
                                return (
                                    <article className={`live-detalle-actividad${actual ? ' actual' : ''}`} key={`${actividad.idCategoria}-${actividad.idRonda}-${indice}`}>
                                        <span className="live-detalle-actividad-icono">
                                            {icono && <img src={icono} alt="" />}
                                        </span>
                                        <div>
                                            <h3>{actividad.nombreCategoria}</h3>
                                            <p>Formato: {actividad.formato || 'Por confirmar'}</p>
                                            <p>{actividad.ronda || actividad.evento || 'Ronda por confirmar'}</p>
                                            <time>{horarioLegible(actividad.horaInicio)} - {horarioLegible(actividad.horaFin)}</time>
                                        </div>
                                        {actual && <span className="live-detalle-actividad-badge">En curso</span>}
                                    </article>
                                );
                            })}
                        </div>
                    ) : <p className="live-detalle-mensaje">El cronograma todavía no está disponible.</p>}
                </section>

                <section className="live-detalle-seccion live-detalle-competidores" aria-labelledby="live-competidores-titulo">
                    <h2 id="live-competidores-titulo">Competidores</h2>
                    <label className="live-detalle-busqueda">
                        <img src={searchIcon}/>
                        <input
                            type="search"
                            value={busquedaCompetidor}
                            onChange={(evento) => setBusquedaCompetidor(evento.target.value)}
                            placeholder="Buscar el nombre del competidor..."
                            aria-label="Buscar competidor por nombre o país"
                        />
                    </label>
                    <ul className="live-detalle-lista-competidores">
                        {competidoresFiltrados.map((competidor) => (
                            <li key={competidor.idUsuario}>                                <span>{competidor.nombre}</span>
                                <PaisConBandera className="live-detalle-pais" pais={competidor.pais} fallback="País no informado" />
                            </li>
                        ))}
                        {!competidoresFiltrados.length && (
                            <li className="live-detalle-sin-competidores">
                                {busquedaCompetidor ? 'No encontramos competidores para esa búsqueda.' : 'Todavía no hay competidores inscriptos.'}
                            </li>
                        )}
                    </ul>
                </section>
            </div>
        </main>
    );
}

export default DetalleTorneoLive;
