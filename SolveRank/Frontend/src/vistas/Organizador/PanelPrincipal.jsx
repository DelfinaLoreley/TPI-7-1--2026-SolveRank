import '/PanelPrincipal.css';

import cuboBanner from '/src/assets/cubo-banner.svg';
import torneosIcon from '/src/assets/home/iconos/torneos-icon.png';
import competidoresIcon2 from '/src/assets/home/iconos/competidores-icon.png';
import torneosActivosIcon from '/src/assets/torneos-activo.svg';
import cuboImg from '/src/assets/home/cubo-img-stat.png';
import calendarIcon from '/src/assets/home/iconos/Calendar.png';
import guardarIcon from '/src/assets/home/iconos/guardado.png';
import lugarIcon from '/src/assets/home/iconos/ubicacion-icon.png';
import categoriasIcon from '/src/assets/home/iconos/categoria3x3-icon.png';
import imagenUshuaia from '/src/assets/home/cards-torneos/casa_de_la_cultura_ush.jpeg';
import imagenRioGrande from '/src/assets/home/cards-torneos/club_peon_peon.jfif';
import imagenTella from '/src/assets/home/cards-torneos/Universidad_Torcuato_Di_Tella.jpg';
import imagenMdq from '/src/assets/home/cards-torneos/club_defensores_de_belgrano.jpg';

const torneos = [
    { nombre: 'Ushuaia Open 2027', fecha: ['18', 'SEP'], lugar: 'Ushuaia, Tierra Del Fuego, Argentina', categorias: 6, competidores: 40, estado: 'Inscripciones abiertas', estilo: 'ushuaia', imagen: imagenUshuaia },
    { nombre: 'Río Grande TDF 2026', fecha: ['26', 'SEP'], lugar: 'Río Grande, Tierra Del Fuego, Argentina', categorias: 11, competidores: 30, estado: 'Inscripciones próximamente', estilo: 'rio-grande', imagen: imagenRioGrande },
    { nombre: 'Chau Invierno En El Tella 2026', fecha: ['16', 'SEP'], lugar: 'Buenos Aires, Buenos Aires, Argentina', categorias: 12, competidores: 100, estado: 'Inscripciones cerradas', estilo: 'tella', imagen: imagenTella },
    { nombre: 'MDQ Open 2026', fecha: ['23', 'OCT'], lugar: 'Mar del Plata, Buenos Aires, Argentina', categorias: 7, competidores: 40, estado: 'Inscripciones próximamente', estilo: 'mdq', imagen: imagenMdq },
];

function PanelPrincipal(){
    return(
        <main className="panel-page">
            <div className="panel-contenido">
                <section className="panel-hero" id="inicio">
                    <div className="panel-hero-texto">
                        <h1>Hola, organizador</h1>
                        <p>Aquí tienes un resumen de todos tus torneos.</p>
                        <div className="panel-resumen-container">
                            <div className="panel-resumen-card">
                                <div><span className="resumen-icono azul">
                                    <img src={torneosIcon} alt="Torneos" /></span><strong>3</strong><small>Torneos creados</small>
                                </div>
                            </div>
                            <div className="panel-resumen-card">
                                <div><span className="resumen-icono azul">
                                    <img src={competidoresIcon2} alt="Competidores" /></span><strong>505</strong><small>Competidores</small>
                                </div>
                            </div>
                            <div className="panel-resumen-card">
                                <div><span className="resumen-icono azul">
                                    <img src={torneosActivosIcon} alt="Torneos" /></span><strong>3</strong><small>Torneos activos</small>
                                </div>
                            </div>
                            <div className="panel-resumen-card">
                                <div><span className="resumen-icono azul">
                                    <img src={torneosActivosIcon} alt="Torneos" /></span><strong>9</strong><small>Próximos torneos</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="home-cubo-escena">
                        <img src={cuboBanner} alt="Cubo de Rubik" />
                    </div>
                    <div className="panel-container2">
                        <div className="panel-cta">
                            <div>
                                <h3>¿Listo para crear un nuevo torneo?</h3>
                                <p>Configurá las categorías, cronogramas, rondas y clasificaciones en pocos pasos.</p>
                                <a href="#torneos">Crear torneo ⟶</a>
                            </div>
                            <div className="cubo-img-cta">
                                <img src={cuboImg} alt="" />
                            </div>
                        </div>
                        <div className="accesos-rapidos-container">
                            <button className="acceso-rapido-btn">Crear <br/> Torneo</button>
                            <button className="acceso-rapido-btn">Mis Torneos <br/> en VIVO</button>
                            <button className="acceso-rapido-btn">Cargar <br/> resultados</button>
                        </div>
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

                <section className="panel-estadisticas">

                </section>
            </div>
        </main>
    )
}

export default PanelPrincipal;