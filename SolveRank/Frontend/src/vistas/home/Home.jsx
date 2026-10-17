import { useEffect, useState } from 'react';
import './Home.css';
import axios from '../../axiosApi';
import cuboImagen from '/src/assets/home/img-cubo-home.png';
import imagenUshuaia from '/src/assets/home/cards-torneos/casa_de_la_cultura_ush.jpeg';
import imagenRioGrande from '/src/assets/home/cards-torneos/club_peon_peon.jfif';
import imagenTella from '/src/assets/home/cards-torneos/Universidad_Torcuato_Di_Tella.jpg';
import imagenMdq from '/src/assets/home/cards-torneos/club_defensores_de_belgrano.jpg';
import torneosIcon from '/src/assets/home/iconos/torneos-icon.png';
import rankingsIcon from '/src/assets/home/iconos/rankings-icon.png';
import competidoresIcon from '/src/assets/home/iconos/organizadores-azul-icon.png';
import paisesIcon from '/src/assets/home/iconos/paises-cuberos-violeta-icon.png';
import torneosIcon2 from '/src/assets/home/iconos/torneos-amarillo-icon.png';
import calendarIcon from '/src/assets/home/iconos/Calendar.png';
import guardarIcon from '/src/assets/home/iconos/guardado.png';
import lugarIcon from '/src/assets/home/iconos/ubicacion-icon.png';
import competidoresIcon2 from '/src/assets/home/iconos/competidores-icon.png';
import estadisticasIcon from '/src/assets/home/iconos/estadisticas.png';
import cuboImg from '/src/assets/home/cubo-img-stat.png';

const imagenesTorneos = [imagenUshuaia, imagenRioGrande, imagenTella, imagenMdq];

function fechaLocal(fecha) {
    if (!fecha) return null;
    const partes = String(fecha).slice(0, 10).split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
    return new Date(partes[0], partes[1] - 1, partes[2]);
}

function fechaCorta(fecha) {
    const valor = fechaLocal(fecha);
    if (!valor) return ['—', ''];
    return [
        String(valor.getDate()).padStart(2, '0'),
        valor.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()
    ];
}

function estadoInscripcion(torneo) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const apertura = fechaLocal(torneo.Fecha_Inicio_Inscripcion);
    const cierre = fechaLocal(torneo.Fecha_fin_Inscripcion);
    if (apertura && hoy < apertura) return 'Inscripciones próximamente';
    if (cierre && hoy > cierre) return 'Inscripciones cerradas';
    return 'Inscripciones abiertas';
}

function adaptarTorneo(torneo, indice) {
    const fecha = fechaCorta(torneo.fecha_Inicio);
    const lugar = [torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ');
    return {
        ...torneo,
        fecha,
        lugar: lugar || torneo.Lugar_Venue || 'Ubicación por confirmar',
        competidores: Number(torneo.limite_participantes) || 0,
        estado: estadoInscripcion(torneo),
        estilo: `torneo-${indice % imagenesTorneos.length}`,
        imagen: torneo.pathImagen || imagenesTorneos[indice % imagenesTorneos.length]
    };
}

const competidores = [
    { nombre: 'Teodor Zajder', pais: 'Poland', bandera: '/src/assets/home/poland-fleg.png', tiempo: '2.76', avatar: '/src/assets/home/iconos/user-pfp-icon.png' },
    { nombre: 'Yiheng Wang', pais: 'China', bandera: '/src/assets/home/china.flag.png', tiempo: '2.77', avatar: '/src/assets/home/iconos/user-pfp-icon.png' },
    { nombre: 'Max Park', pais: 'USA', bandera: '/src/assets/home/usa-flag.png', tiempo: '3.13', avatar: '/src/assets/home/iconos/user-pfp-icon.png' },
    { nombre: 'Qixian Sao', pais: 'China', bandera: '/src/assets/home/china.flag.png', tiempo: '3.24', avatar: '/src/assets/home/iconos/user-pfp-icon.png' },
    { nombre: 'Ruihang Xu', pais: 'China', bandera: '/src/assets/home/china.flag.png', tiempo: '3.24', avatar: '/src/assets/home/iconos/user-pfp-icon.png' },
];

const estadisticas = [
    { icono: '/src/assets/home/iconos/competidores-ic.png', valor: '1.812', texto: 'Competidores registrados', color: 'violeta' },
    { icono: '/src/assets/home/iconos/torneos-ic.png', valor: '49', texto: 'Torneos este año', color: 'dorado' },
    { icono: '/src/assets/home/iconos/paises-ic.png', valor: '15', texto: 'Países representados', color: 'azul' },
    { icono: '/src/assets/home/iconos/resultados-ic.png', valor: '181.222', texto: 'Resultados registrados', color: 'verde' },
];

function Home({ onVerTorneo }) {
    const [torneos, setTorneos] = useState([]);
    const [cargandoTorneos, setCargandoTorneos] = useState(true);
    const [errorTorneos, setErrorTorneos] = useState('');

    useEffect(() => {
        let activo = true;

        axios.get('/torneos')
            .then(({ data }) => {
                if (activo) {
                    setTorneos((data.torneos || []).map(adaptarTorneo));
                    setErrorTorneos('');
                }
            })
            .catch((error) => {
                console.error('No se pudieron cargar los torneos:', error);
                if (activo) setErrorTorneos('No se pudieron cargar los torneos. Intentá nuevamente más tarde.');
            })
            .finally(() => {
                if (activo) setCargandoTorneos(false);
            });

        return () => {
            activo = false;
        };
    }, []);

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
                            <div><span className="resumen-icono azul"><img src={competidoresIcon} alt="Competidores" /></span><strong>1.907</strong><small>Competidores</small></div>
                            <hr/>
                            <div><span className="resumen-icono dorado"><img src={torneosIcon2} alt="Torneos" /></span><strong>912</strong><small>Torneos este año</small></div>
                            <hr/>
                            <div><span className="resumen-icono violeta"><img src={paisesIcon} alt="Países" /></span><strong>22</strong><small>Países</small></div>
                        </div>
                    </div>
                    <div className="home-cubo-escena">
                        <img src={cuboImagen} alt="Cubo de Rubik" />
                    </div>
                </section>

                <section className="home-panel home-torneos" id="torneos">
                    <div className="home-section-heading">
                        <h2><img src={calendarIcon}/> Próximos torneos</h2>
                        <a href="#torneos">Ver todos ⟶</a>
                    </div>
                    <div className="home-torneos-grid">
                        {cargandoTorneos && <p className="home-torneos-mensaje">Cargando torneos...</p>}
                        {errorTorneos && <p className="home-torneos-mensaje" role="alert">{errorTorneos}</p>}
                        {!cargandoTorneos && !errorTorneos && torneos.length === 0 && (
                            <p className="home-torneos-mensaje">Todavía no hay torneos publicados.</p>
                        )}
                        {torneos.map((torneo) => (
                            <article className="home-torneo-card" key={torneo.idTorneo}>
                                <div className={`home-torneo-imagen ${torneo.estilo}`}>
                                    <img className="home-torneo-foto" src={torneo.imagen} alt={`Sede del torneo ${torneo.nombre}`} />
                                    <span className={`home-estado ${torneo.estado === 'Inscripciones abiertas' ? 'abiertas' : torneo.estado === 'Inscripciones cerradas' ? 'cerradas' : ''}`}>{torneo.estado}</span>
                                    <button className="home-torneo-btn-guardar"><img src={guardarIcon} alt="Guardar torneo"/></button>
                                </div>
                                <div className="home-torneo-info">
                                    <div className="home-fecha"><strong>{torneo.fecha[0]}</strong><span>{torneo.fecha[1]}</span></div>
                                    <div className="home-torneo-detalle">
                                        <h3>{torneo.nombre}</h3>
                                        <p> <img src={lugarIcon} alt="Lugar"/> {torneo.lugar}</p>
                                    </div>
                                    <div className="home-torneo-meta"><span> <img src={competidoresIcon2} alt="Competidores"/> {torneo.competidores} cupos</span></div>
                                </div>
                                <button className="home-torneo-link" type="button" onClick={() => onVerTorneo(torneo)}>
                                    Ver torneo <span>⟶</span>
                                </button>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="home-dashboard">
                    <section className="home-panel home-ranking" id="rankings">
                        <div className="home-section-heading">
                            <h2><span className="home-ranking-icon"><img src={torneosIcon2}/></span> Rankings</h2>
                            <a href="#rankings">Ver rankings completos ⟶</a>
                        </div>
                        <div className="home-categorias" aria-label="Categorías de ranking">
                            <button className="seleccionada" type="button">3x3x3</button>
                            <button type="button">3x3 OH</button>
                            <button type="button">2x2x2</button>
                            <button type="button">4x4x4</button>
                            <button type="button">Pyraminx</button>
                            <button type="button">Megaminx</button>
                            <button type="button">Square-1</button>
                        </div>
                        <ol className="home-ranking-lista">
                            {competidores.map((competidor, i) => (
                                <li key={competidor.nombre}>
                                    <span className="ranking-puesto">{i + 1}</span>
                                    <span className="ranking-avatar"><img src={competidor.avatar} alt={competidor.nombre} /></span>
                                    <strong>{competidor.nombre}</strong>
                                    <span className="ranking-pais">{competidor.pais}</span>
                                    <span className="ranking-bandera"><img src={competidor.bandera} alt={competidor.pais}/></span>
                                    <b>{competidor.tiempo}</b>
                                </li>
                            ))}
                        </ol>
                        <a className="home-ranking-link" href="#rankings">Ver ranking de 3x3 ⟶</a>
                    </section>

                    <section className="home-panel home-estadisticas" id="estadisticas">
                        <div className="home-section-heading">
                            <h2><span className="home-estadisticas-icon"><img src={estadisticasIcon} alt="Estadísticas" /></span> Estadísticas</h2>
                        </div>
                        <div className="home-estadisticas-grid">
                            {estadisticas.map((dato) => (
                                <article className="home-estadistica" key={dato.texto}>
                                    <span className={`home-estadistica-icono ${dato.color}`}>
                                        <img src={dato.icono} alt={dato.texto} />
                                    </span>
                                    <div><strong>{dato.valor}</strong><small>{dato.texto}</small></div>
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
