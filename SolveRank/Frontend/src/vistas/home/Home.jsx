import './Home.css';
import { useEffect, useState } from 'react';
import axios from '../../axiosApi';
import cuboImagen from '/src/assets/home/img-cubo-home.png';
import torneosIcon from '/src/assets/home/iconos/torneos-icon.png';
import rankingsIcon from '/src/assets/home/iconos/rankings-icon.png';
import competidoresIcon from '/src/assets/home/iconos/organizadores-azul-icon.png';
import paisesIcon from '/src/assets/home/iconos/paises-cuberos-violeta-icon.png';
import torneosIcon2 from '/src/assets/home/iconos/torneos-amarillo-icon.png';
import calendarIcon from '/src/assets/home/iconos/Calendar.png';
import guardarIcon from '/src/assets/home/iconos/guardado.png';
import lugarIcon from '/src/assets/home/iconos/ubicacion-icon.png';
import categoriasIcon from '/src/assets/home/iconos/categoria3x3-icon.png';
import competidoresIcon2 from '/src/assets/home/iconos/competidores-icon.png';
import estadisticasIcon from '/src/assets/home/iconos/estadisticas.png';
import cuboImg from '/src/assets/home/cubo-img-stat.png';
import avatarPredeterminado from '/src/assets/home/iconos/user-pfp-icon.png';

function fechaDeTorneo(fecha) {
    if (!fecha) return null;
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }
    const valor = fecha instanceof Date ? fecha : new Date(String(fecha).replace(' ', 'T'));
    return Number.isNaN(valor.getTime()) ? null : valor;
}

function estadoInscripcion(torneo) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finTorneo = fechaDeTorneo(torneo.fecha_fin);
    if (finTorneo) {
        finTorneo.setHours(23, 59, 59, 999);
        if (hoy > finTorneo) return 'Torneo finalizado';
    }
    const apertura = fechaDeTorneo(torneo.Fecha_Inicio_Inscripcion);
    const cierre = fechaDeTorneo(torneo.Fecha_fin_Inscripcion);
    if (!apertura || !cierre) return 'Inscripción sin fechas';
    apertura.setHours(0, 0, 0, 0);
    cierre.setHours(23, 59, 59, 999);
    if (hoy < apertura) return 'Inscripciones próximamente';
    if (hoy <= cierre) return 'Inscripciones abiertas';
    return 'Inscripciones cerradas';
}

function formatearTiempoRanking(segundos) {
    if (segundos === null || segundos === undefined || segundos === '') return '—';
    const valor = Number(segundos);
    if (!Number.isFinite(valor) || valor < 0) return '—';
    const totalCentesimas = Math.round(valor * 100);
    const minutos = Math.floor(totalCentesimas / 6000);
    const restantes = totalCentesimas % 6000;
    const segundosEnteros = Math.floor(restantes / 100);
    const centesimas = restantes % 100;
    const tiempo = `${String(segundosEnteros).padStart(2, '0')}.${String(centesimas).padStart(2, '0')}`;
    return minutos > 0 ? `${String(minutos).padStart(2, '0')}:${tiempo}` : tiempo;
}

const indicadoresEstadisticas = [
    { icono: '/src/assets/home/iconos/competidores-ic.png', clave: 'competidores', texto: 'Competidores registrados', color: 'violeta' },
    { icono: '/src/assets/home/iconos/torneos-ic.png', clave: 'torneosEsteAnio', texto: 'Torneos este año', color: 'dorado' },
    { icono: '/src/assets/home/iconos/paises-ic.png', clave: 'paises', texto: 'Países representados', color: 'azul' },
    { icono: '/src/assets/home/iconos/resultados-ic.png', clave: 'resultadosRegistrados', texto: 'Resultados registrados', color: 'verde' },
];

function Home({ onVerTorneo, onVerTodosTorneos }) {
    const [torneos, setTorneos] = useState([]);
    const [estadisticasReales, setEstadisticasReales] = useState(null);
    const [categoriasRanking, setCategoriasRanking] = useState([]);
    const [categoriaRanking, setCategoriaRanking] = useState('');
    const [resultadosRanking, setResultadosRanking] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);
    const [errorRanking, setErrorRanking] = useState('');
    const [cargandoTorneos, setCargandoTorneos] = useState(true);
    const [errorTorneos, setErrorTorneos] = useState('');

    useEffect(() => {
        let activo = true;
        axios.get('/torneos')
            .then(({ data }) => {
                if (!activo) return;
                setEstadisticasReales(data.estadisticas ?? null);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const proximos = (data.torneos ?? [])
                    .map((torneo) => ({ ...torneo, fechaObjeto: fechaDeTorneo(torneo.fecha_Inicio) }))
                    .filter((torneo) => torneo.fechaObjeto && torneo.fechaObjeto >= hoy)
                    .sort((a, b) => a.fechaObjeto - b.fechaObjeto)
                    .slice(0, 4);
                setTorneos(proximos);
            })
            .catch((error) => {
                if (activo) setErrorTorneos(error?.response?.data?.mensaje || 'No se pudieron cargar los torneos.');
            })
            .finally(() => { if (activo) setCargandoTorneos(false); });

        return () => { activo = false; };
    }, []);

    useEffect(() => {
        let activo = true;
        axios.get('/torneos/categorias')
            .then(({ data }) => {
                if (!activo) return;
                const categorias = data.categorias ?? [];
                setCategoriasRanking(categorias);
                if (categorias.length) setCategoriaRanking(String(categorias[0].idCategoria));
            })
            .catch((error) => {
                if (activo) setErrorRanking(error?.response?.data?.mensaje || 'No se pudieron cargar las categorías.');
            });
        return () => { activo = false; };
    }, []);

    useEffect(() => {
        if (!categoriaRanking) return undefined;
        let activo = true;
        setCargandoRanking(true);
        setErrorRanking('');
        axios.get(`/torneos/ranking/${categoriaRanking}`)
            .then(({ data }) => { if (activo) setResultadosRanking(data.resultados ?? []); })
            .catch((error) => {
                if (activo) setErrorRanking(error?.response?.data?.mensaje || 'No se pudo cargar este ranking.');
            })
            .finally(() => { if (activo) setCargandoRanking(false); });
        return () => { activo = false; };
    }, [categoriaRanking]);

    const urlBackend = axios.defaults.baseURL.replace(/\/api\/?$/, '');

    return (
        <main className="home-page">
            <div className="home-contenido">
                <section className="home-hero" id="inicio">
                    <div className="home-hero-texto">
                        <h1>
                            <span>Tu pasión.</span>
                            <span className="azul">Tu tiempo.</span>
                            <span className="violeta">Tu mejor versión.</span>
                        </h1>
                        <p>
                            Plataforma oficial de gestión de torneos<br className="desktop-break" />
                            de speedcubing. Encuentra torneos, sigue<br className="desktop-break" />
                            tus resultados y supera tus propios límites.
                        </p>
                        <div className="home-hero-botones">
                            <a href="#torneos" className="home-button primario"><img src={torneosIcon} alt="Torneos" /> Ver Torneos</a>
                            <a href="#rankings" className="home-button secundario"><img src={rankingsIcon} alt="Rankings" /> Ver Rankings</a>
                        </div>
                        <div className="home-resumen">
                            <div><span className="resumen-icono azul"><img src={competidoresIcon} alt="Competidores" /></span><strong>{estadisticasReales ? Number(estadisticasReales.competidores).toLocaleString('es-AR') : '—'}</strong><small>Competidores</small></div>
                            <hr/>
                            <div><span className="resumen-icono dorado"><img src={torneosIcon2} alt="Torneos" /></span><strong>{estadisticasReales ? Number(estadisticasReales.torneosEsteAnio).toLocaleString('es-AR') : '—'}</strong><small>Torneos este año</small></div>
                            <hr/>
                            <div><span className="resumen-icono violeta"><img src={paisesIcon} alt="Países" /></span><strong>{estadisticasReales ? Number(estadisticasReales.paises).toLocaleString('es-AR') : '—'}</strong><small>Países de inscriptos</small></div>
                        </div>
                    </div>
                    <div className="home-cubo-escena">
                        <img src={cuboImagen} alt="Cubo de Rubik" />
                    </div>
                </section>

                <section className="home-panel home-torneos" id="torneos">
                    <div className="home-section-heading">
                        <h2><img src={calendarIcon}/> Próximos torneos</h2>
                        <a href="#torneos" onClick={(evento) => {
                            evento.preventDefault();
                            onVerTodosTorneos?.();
                        }}>Ver todos ⟶</a>
                    </div>
                    <div className="home-torneos-grid">
                        {cargandoTorneos ? <p className="home-torneos-mensaje" role="status">Cargando torneos…</p>
                            : errorTorneos ? <p className="home-torneos-mensaje" role="alert">{errorTorneos}</p>
                            : torneos.length === 0 ? <p className="home-torneos-mensaje">Todavía no hay próximos torneos publicados.</p>
                            : torneos.map((torneo) => {
                                const fecha = torneo.fechaObjeto;
                                const estado = estadoInscripcion(torneo);
                                const lugar = [torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ');
                                const imagen = torneo.pathImagen ? `${urlBackend}${torneo.pathImagen}` : cuboImagen;
                                return <article className="home-torneo-card" key={torneo.idTorneo}>
                                <div className="home-torneo-imagen">
                                    <img className="home-torneo-foto" src={imagen} alt={`Imagen del torneo ${torneo.nombre}`} />
                                    <span className={`home-estado ${estado === 'Inscripciones abiertas' ? 'abiertas' : estado === 'Inscripciones cerradas' ? 'cerradas' : estado === 'Torneo finalizado' ? 'finalizado' : ''}`}>{estado}</span>
                                    <button className="home-torneo-btn-guardar"><img src={guardarIcon} alt="Guardar torneo"/></button>
                                </div>
                                <div className="home-torneo-info">
                                    <div className="home-fecha"><strong>{fecha.toLocaleDateString('es-AR', { day: '2-digit' })}</strong><span>{fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}</span></div>
                                    <div className="home-torneo-detalle">
                                        <h3>{torneo.nombre}</h3>
                                        <p> <img src={lugarIcon} alt="Lugar"/> {lugar || torneo.Lugar_Venue || 'Ubicación a confirmar'}</p>
                                    </div>
                                    <div className="home-torneo-meta"><span><img src={categoriasIcon} alt="Categorías"/> {torneo.categorias} categorías</span><span> <img src={competidoresIcon2} alt="Competidores"/> {torneo.inscriptos}/{torneo.limite_participantes} inscriptos</span></div>
                                </div>
                                <button className="home-torneo-link" type="button" onClick={() => onVerTorneo?.(torneo)}>Ver torneo <span>⟶</span></button>
                            </article>;
                            })}
                    </div>
                </section>

                <div className="home-dashboard">
                    <section className="home-panel home-ranking" id="rankings">
                        <div className="home-section-heading">
                            <h2><span className="home-ranking-icon"><img src={torneosIcon2}/></span> Rankings</h2>
                            <a href="#rankings">Ver rankings completos ⟶</a>
                        </div>
                        <div className="home-categorias" aria-label="Categorías de ranking">
                            {categoriasRanking.map((categoria) => (
                                <button
                                    className={String(categoria.idCategoria) === categoriaRanking ? 'seleccionada' : ''}
                                    type="button"
                                    key={categoria.idCategoria}
                                    aria-pressed={String(categoria.idCategoria) === categoriaRanking}
                                    onClick={() => setCategoriaRanking(String(categoria.idCategoria))}
                                >{categoria.categoria}</button>
                            ))}
                        </div>
                        <ol className="home-ranking-lista home-ranking-tabla" aria-label="Ranking de la categoría seleccionada">
                            <li className="home-ranking-header">
                                <span>#</span><span></span><span>Competidor</span><span>País</span><span>Mejor single</span>
                            </li>
                            {cargandoRanking ? <li className="home-ranking-mensaje">Cargando ranking…</li>
                                : errorRanking ? <li className="home-ranking-mensaje" role="alert">{errorRanking}</li>
                                : resultadosRanking.length === 0 ? <li className="home-ranking-mensaje">Todavía no hay resultados para esta categoría.</li>
                                : resultadosRanking.map((competidor, index) => (
                                    <li key={competidor.idUsuario}>
                                        <span className="ranking-puesto">{index + 1}</span>
                                        <span className="ranking-avatar"><img src={competidor.avatar_url || avatarPredeterminado} alt="" /></span>
                                        <strong>{[competidor.nombre, competidor.apellido].filter(Boolean).join(' ')}</strong>
                                        <span className="ranking-pais">{competidor.pais || '—'}</span>
                                        <b>{formatearTiempoRanking(competidor.mejorTiempo)}</b>
                                    </li>
                                ))}
                        </ol>
                        <a className="home-ranking-link" href="#rankings">Ver ranking de {categoriasRanking.find(({ idCategoria }) => String(idCategoria) === categoriaRanking)?.categoria || 'categoría'} ⟶</a>
                    </section>

                    <section className="home-panel home-estadisticas" id="estadisticas">
                        <div className="home-section-heading">
                            <h2><span className="home-estadisticas-icon"><img src={estadisticasIcon} alt="Estadísticas" /></span> Estadísticas</h2>
                        </div>
                        <div className="home-estadisticas-grid">
                            {indicadoresEstadisticas.map((dato) => (
                                <article className="home-estadistica" key={dato.texto}>
                                    <span className={`home-estadistica-icono ${dato.color}`}>
                                        <img src={dato.icono} alt={dato.texto} />
                                    </span>
                                    <div><strong>{estadisticasReales ? Number(estadisticasReales[dato.clave]).toLocaleString('es-AR') : '—'}</strong><small>{dato.texto}</small></div>
                                </article>
                            ))}
                        </div>
                        <div className="home-cta">
                            <div>
                                <h3>¿Listo para competir?</h3>
                                <p>Encuentra tu próximo torneo y<br />demuestra de lo que eres capaz.</p>
                                <a href="#torneos">Explorar torneos ⟶</a>
                            </div>
                            <div className="cubo-img-cta">
                                <img src={cuboImg} alt="" />
                            </div>
                        </div>
                    </section>
                </div>

            </div>
        </main>
    );
}

export default Home;
