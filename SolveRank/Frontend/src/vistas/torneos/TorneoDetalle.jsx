import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';

import competidoresLimIcon from '/src/assets/home/iconos/competidores-violeta-icon.png';
import categoIcon from '/src/assets/torneos/categorias-azul-icon.png';
import fechaTorneoIcon from '/src/assets/torneos/calendar-violeta-icon.svg';
import ubicacionIcon2 from '/src/assets/torneos/ubicacion-violeta-icon.svg';
import liveIcon from '/src/assets/torneos/en-vivo-icon.svg';
import cuboBanner from '/src/assets/img-cubo-banner2.png';

import TorneoGeneral from './TorneoGeneral.jsx';
import Inscripcion from './Inscripcion.jsx';
import MezclasTorneo from './MezclasTorneo.jsx';
import CargaResultadosTorneo from './CargaResultadosTorneo.jsx';
import PanelResultadosTorneo from './PanelResultadosTorneo.jsx';
import ResultadosPublicosTorneo from './ResultadosPublicosTorneo.jsx';
import CategoriaTorneoCard from './CategoriaTorneoCard.jsx';
import CronogramaTorneo from './CronogramaTorneo.jsx';
import { categorias as catalogoCategorias } from './pasos/datosCategorias.js';
import { estadoTorneo } from './estadoTorneo.js';
import './TorneoDetalle.css';

function fechaLegible(fecha) {
    if (!fecha) return 'Fecha por confirmar';
    const dia = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(dia.getTime())) return 'Fecha por confirmar';
    return dia.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(' de ', ' ').replace('.', '').replace(' de ', ' ').replace('.', '').toLocaleUpperCase('es-AR');
}

function estadoInscripcion(torneo) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const apertura = torneo.Fecha_Inicio_Inscripcion ? new Date(`${String(torneo.Fecha_Inicio_Inscripcion).slice(0, 10)}T00:00:00`) : null;
    const cierre = torneo.Fecha_fin_Inscripcion ? new Date(`${String(torneo.Fecha_fin_Inscripcion).slice(0, 10)}T23:59:59`) : null;
    if (!apertura || !cierre || Number.isNaN(apertura.getTime()) || Number.isNaN(cierre.getTime())) return 'Inscripciones sin fechas';
    if (hoy < apertura) return 'Inscripciones próximamente';
    if (hoy <= cierre) return 'Inscripciones abiertas';
    return 'Inscripciones cerradas';
}

function TorneoDetalle({ idTorneo, usuario, onSalir }) {
    const [detalle, setDetalle] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [seccionActiva, setSeccionActiva] = useState('general');
    const [puedeVerMezclas, setPuedeVerMezclas] = useState(false);
    const [estadoInscripcionUsuario, setEstadoInscripcionUsuario] = useState(null);
    const [accesoResultados, setAccesoResultados] = useState(null);
    const [errorAccesoResultados, setErrorAccesoResultados] = useState('');
    const [rondaSeleccionada, setRondaSeleccionada] = useState('');

    useEffect(() => {
        let activo = true;
        setCargando(true);
        setError('');
        axios.get(`/torneos/detalle/${idTorneo}`)
            .then(({ data }) => { if (activo) setDetalle(data); })
            .catch((err) => { if (activo) setError(err?.response?.data?.mensaje || 'No se pudo cargar el torneo.'); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [idTorneo]);

    useEffect(() => {
        let activo = true;
        setPuedeVerMezclas(false);
        if (!['Organizador', 'Delegado'].includes(usuario?.rol)) return () => { activo = false; };
        axios.get(`/mezclas/torneos/${idTorneo}/acceso`)
            .then(({ data }) => { if (activo) setPuedeVerMezclas(Boolean(data.puedeVerMezclas)); })
            .catch(() => { if (activo) setPuedeVerMezclas(false); });
        return () => { activo = false; };
    }, [idTorneo, usuario?.rol]);

    useEffect(() => {
        let activo = true;
        if (!['Organizador', 'Delegado', 'Competidor', 'Juez'].includes(usuario?.rol)) {
            return () => { activo = false; };
        }
        axios.get(`/torneos/${idTorneo}/resultados/acceso`)
            .then(({ data }) => {
                if (activo) {
                    setAccesoResultados({
                        idTorneo: String(idTorneo),
                        idUsuario: String(usuario.idUsuario),
                        permitido: true,
                        rondas: data.rondas ?? [],
                    });
                    setErrorAccesoResultados('');
                }
            })
            .catch((err) => {
                if (!activo) return;
                setAccesoResultados({
                    idTorneo: String(idTorneo),
                    idUsuario: String(usuario.idUsuario),
                    permitido: false,
                    rondas: [],
                });
                setErrorAccesoResultados(err?.response?.data?.mensaje || 'No se pudieron consultar los resultados de este torneo.');
            });
        return () => { activo = false; };
    }, [idTorneo, usuario?.idUsuario, usuario?.rol]);

    useEffect(() => {
        if (usuario?.rol !== 'Competidor') return undefined;
        let activo = true;
        axios.get(`/torneos/${idTorneo}/inscripcion/estado`)
            .then(({ data }) => {
                if (activo) {
                    setEstadoInscripcionUsuario({
                        idTorneo: String(idTorneo),
                        idUsuario: String(usuario.idUsuario),
                        inscripto: Boolean(data.inscripto),
                    });
                }
            })
            .catch(() => {
                if (activo) {
                    setEstadoInscripcionUsuario({
                        idTorneo: String(idTorneo),
                        idUsuario: String(usuario.idUsuario),
                        inscripto: false,
                    });
                }
            });
        return () => { activo = false; };
    }, [idTorneo, usuario?.idUsuario, usuario?.rol]);

    useEffect(() => {
        if (seccionActiva === 'inscripcion') {
            document.getElementById('seccion-inscripcion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [seccionActiva]);

    const categorias = useMemo(() => {
        const unicas = new Map();
        for (const categoria of detalle?.categorias ?? []) {
            if (!unicas.has(categoria.idCategoria)) {
                unicas.set(categoria.idCategoria, { ...categoria, rondas: [] });
            }
            if (categoria.idRonda) {
                unicas.get(categoria.idCategoria).rondas.push({
                    idRonda: categoria.idRonda,
                    nombre: categoria.ronda,
                    formato: categoria.formato,
                    cutoff: categoria.cutoff,
                    tiempoLimite: categoria.tiempoLimite,
                    porcentajeAvance: categoria.porcentajeAvance
                });
            }
        }
        return [...unicas.values()];
    }, [detalle]);

    if (cargando) return <main className="torneo-detalle-page"><p role="status">Cargando torneo…</p></main>;
    if (error || !detalle?.torneo) {
        return (
            <main className="torneo-detalle-page">
                <div className="torneo-detalle-contenedor">
                    {onSalir && <button className="torneo-detalle-volver" type="button" onClick={onSalir}>← Volver a torneos</button>}
                    <p role="alert">{error || 'No se encontró el torneo.'}</p>
                </div>
            </main>
        );
    }

    const torneo = { ...detalle.torneo, categorias };
    const limite = Number(torneo.limite_participantes) || 0;
    const cuposRestantes = Math.max(limite - (Number(torneo.inscriptos) || 0), 0);
    const estado = estadoTorneo(torneo);
    const accesoResultadosActual = accesoResultados?.idTorneo === String(idTorneo)
        && accesoResultados?.idUsuario === String(usuario?.idUsuario)
        && accesoResultados.permitido;
    const resultadosAutorizados = ['Organizador', 'Delegado'].includes(usuario?.rol) && accesoResultadosActual;
    const resultadosVisibles = ['Competidor', 'Juez'].includes(usuario?.rol) && accesoResultadosActual;
    const estadoRegistro = estadoInscripcion(torneo);
    const inscripcionUsuarioActual = estadoInscripcionUsuario?.idTorneo === String(idTorneo)
        && estadoInscripcionUsuario?.idUsuario === String(usuario?.idUsuario)
        ? estadoInscripcionUsuario
        : null;
    const lugar = [torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ') || torneo.Lugar_Venue || 'Ubicación por confirmar';
    const puedeInscribirse = ['Competidor', 'Juez'].includes(usuario?.rol);
    const secciones = [
        ['general', 'General'],
        ['categorias', 'Categorías'],
        ...(puedeVerMezclas ? [['mezclas', 'Mezclas']] : []),
        ['cronograma', 'Cronograma'],
        ...(resultadosAutorizados
            ? [['resultados', 'Cargar resultados']]
            : resultadosVisibles ? [['resultados', 'Ver resultados']] : []),
        ...(puedeInscribirse ? [['inscripcion', 'Inscripción']] : [])
    ];

    async function volverPanelResultados() {
        setRondaSeleccionada('');
        try {
            const { data } = await axios.get(`/torneos/${idTorneo}/resultados/acceso`);
            setAccesoResultados({
                idTorneo: String(idTorneo),
                idUsuario: String(usuario.idUsuario),
                permitido: true,
                rondas: data.rondas ?? [],
            });
            setErrorAccesoResultados('');
        } catch (err) {
            setErrorAccesoResultados(err?.response?.data?.mensaje || 'No se pudo actualizar el estado de las rondas.');
        }
    }

    if (seccionActiva === 'resultados' && (resultadosAutorizados || resultadosVisibles) && rondaSeleccionada) {
        return (
            <CargaResultadosTorneo
                idTorneo={idTorneo}
                torneo={torneo}
                rondas={accesoResultados.rondas}
                rondaSeleccionada={rondaSeleccionada}
                soloLectura={resultadosVisibles}
                onVolver={volverPanelResultados}
            />
        );
    }

    return (
        <main className="torneo-detalle-page">
            <div className="torneo-detalle-contenedor">
                <header className="torneo-detalle-encabezado">
                    {onSalir && <button className="torneo-detalle-volver" type="button" onClick={onSalir}>← Volver a torneos</button>}
                    <div className="torneo-detalle-hero">
                        <div className="torneo-detalle-hero-contenido">
                            <h1>{torneo.nombre}</h1>
                            <div className="torneo-detalle-resumen">
                                <div className="torneo-detalle-resumen-div">
                                    <img src={fechaTorneoIcon} alt="" />
                                    <span>{fechaLegible(torneo.fecha_Inicio)} - {fechaLegible(torneo.fecha_fin)}</span>
                                    <p>Fecha del torneo</p>
                                </div>
                                <div className="torneo-detalle-resumen-div">
                                    <img src={ubicacionIcon2} alt="" />
                                    <span>{torneo.ciudad || torneo.Lugar_Venue || 'Sede por confirmar'}</span>
                                    <p>{lugar}</p>
                                </div>
                                <div className="torneo-detalle-resumen-div">
                                    <img src={competidoresLimIcon} alt="" />
                                    <span>{limite} competidores</span>
                                    <p>Límite de inscripción</p>
                                </div>
                                <div className="torneo-detalle-tags">
                                    <span className={estadoRegistro === 'Inscripciones abiertas'
                                        ? 'tag-inscripciones'
                                        : estadoRegistro === 'Inscripciones próximamente'
                                            ? 'tag-inscripciones-proximas'
                                            : 'tag-estado-torneo'}>
                                        {estadoRegistro}
                                    </span>
                                    <span className="tag-cupos-restantes">Quedan {cuposRestantes} cupos</span>
                                    <span className={`tag-estado-evento tag-estado-evento-${estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}>{estado}</span>
                                </div>
                            </div>
                            <div className="torneo-detalle-btns">
                                {usuario?.rol === 'Competidor' && inscripcionUsuarioActual && !inscripcionUsuarioActual.inscripto && (
                                    <button className="btn-inscribirme" type="button" onClick={() => setSeccionActiva('inscripcion')}>
                                        Inscribirme <span aria-hidden="true">→</span>
                                    </button>
                                )}
                                {estado === 'En curso' && (
                                    <button className="btn-ver-resultados" type="button" disabled title="Próximamente">
                                        <img src={liveIcon} alt="" />
                                        Ver resultados en vivo
                                    </button>
                                )}
                            </div>
                            <img
                                className={`torneo-detalle-hero-imagen${torneo.pathImagen ? '' : ' torneo-detalle-hero-imagen-placeholder'}`}
                                src={torneo.pathImagen ? `${axios.defaults.baseURL.replace(/\/api\/?$/, '')}${torneo.pathImagen}` : cuboBanner}
                                alt={torneo.pathImagen ? `Imagen del torneo ${torneo.nombre}` : ''}
                                aria-hidden={!torneo.pathImagen}
                            />
                        </div>
                    </div>
                </header>

                <nav className="navbar-torneo-detalle" aria-label="Secciones del torneo">
                    {secciones.map(([id, etiqueta]) => (
                        <button className={seccionActiva === id ? 'activo' : ''} type="button" key={id} onClick={() => {
                            setSeccionActiva(id);
                            setRondaSeleccionada('');
                        }}>
                            {etiqueta}
                        </button>
                    ))}
                </nav>

                {errorAccesoResultados && ['Organizador', 'Delegado', 'Competidor', 'Juez'].includes(usuario?.rol) && (
                    <p role="alert">{errorAccesoResultados}</p>
                )}

                {seccionActiva === 'general' && <TorneoGeneral torneo={torneo} />}

                {seccionActiva === 'categorias' && (
                    <section className="torneo-detalle-contenido">
                        <h2> <span aria-hidden="true"><img src={categoIcon}/></span> Categorías</h2>
                        {categorias.length ? (
                            <div className="torneo-detalle-categorias-grid">
                                {categorias.map((categoria) => (
                                    <CategoriaTorneoCard
                                        key={categoria.idCategoria}
                                        categoria={categoria}
                                        catalogo={catalogoCategorias}
                                    />
                                ))}
                            </div>
                        ) : <p>No hay categorías cargadas para este torneo.</p>}
                    </section>
                )}

                {seccionActiva === 'mezclas' && puedeVerMezclas && <MezclasTorneo idTorneo={idTorneo} />}

                {seccionActiva === 'resultados' && resultadosVisibles && (
                    <ResultadosPublicosTorneo
                        idTorneo={idTorneo}
                        rondas={accesoResultados.rondas}
                    />
                )}

                {seccionActiva === 'resultados' && resultadosAutorizados && (
                    <PanelResultadosTorneo
                        torneo={torneo}
                        rondas={accesoResultados.rondas}
                        cronograma={detalle.cronograma ?? []}
                        onSeleccionarRonda={(idRonda) => setRondaSeleccionada(String(idRonda))}
                    />
                )}

                {seccionActiva === 'cronograma' && (
                    <CronogramaTorneo actividades={detalle.cronograma ?? []} categorias={categorias} torneo={torneo} />
                )}

                {seccionActiva === 'inscripcion' && puedeInscribirse && (
                    <div id="seccion-inscripcion">
                        <Inscripcion torneo={torneo} categoriasTorneo={categorias} inscripcionAbierta={estadoRegistro === 'Inscripciones abiertas' && cuposRestantes > 0} />
                    </div>
                )}
            </div>
        </main>
    );
}

export default TorneoDetalle;
