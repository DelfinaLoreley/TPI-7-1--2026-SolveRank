import './Home.css';
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
import categoriasIcon from '/src/assets/home/iconos/categoria3x3-icon.png';
import competidoresIcon2 from '/src/assets/home/iconos/competidores-icon.png';
import estadisticasIcon from '/src/assets/home/iconos/estadisticas.png';
import cuboImg from '/src/assets/home/cubo-img-stat.png';

const torneos = [
    { nombre: 'Ushuaia Open 2027', fecha: ['18', 'SEP'], lugar: 'Ushuaia, Tierra Del Fuego, Argentina', categorias: 6, competidores: 40, estado: 'Inscripciones abiertas', estilo: 'ushuaia', imagen: imagenUshuaia },
    { nombre: 'Río Grande TDF 2026', fecha: ['26', 'SEP'], lugar: 'Río Grande, Tierra Del Fuego, Argentina', categorias: 11, competidores: 30, estado: 'Inscripciones próximamente', estilo: 'rio-grande', imagen: imagenRioGrande },
    { nombre: 'Chau Invierno En El Tella 2026', fecha: ['16', 'SEP'], lugar: 'Buenos Aires, Buenos Aires, Argentina', categorias: 12, competidores: 100, estado: 'Inscripciones cerradas', estilo: 'tella', imagen: imagenTella },
    { nombre: 'MDQ Open 2026', fecha: ['23', 'OCT'], lugar: 'Mar del Plata, Buenos Aires, Argentina', categorias: 7, competidores: 40, estado: 'Inscripciones próximamente', estilo: 'mdq', imagen: imagenMdq },
];

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

function Home() {
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
                        {torneos.map((torneo) => (
                            <article className="home-torneo-card" key={torneo.nombre}>
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
                                    <div className="home-torneo-meta"><span><img src={categoriasIcon} alt="Categorías"/> {torneo.categorias} categorías</span><span> <img src={competidoresIcon2} alt="Competidores"/> {torneo.competidores} cupos</span></div>
                                </div>
                                <a className="home-torneo-link" href="#torneos">Ver torneo <span>⟶</span></a>
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
