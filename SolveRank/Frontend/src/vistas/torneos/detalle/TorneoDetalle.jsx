
import calendarIcon from '/src/assets/torneos/calendar-violeta-icon.svg';
import ubicacionIcon from '/src/assets/torneos/ubicacion-violeta-icon.svg';
import competidoresLimIcon from '/src/assets/home/iconos/competidores-violeta-icon.png';
import enVivoIcon from '/src/assets/torneos/en-vivo-icon.svg';
import Inscripcion from './Inscripcion.jsx';
import './TorneoDetalle.css';

function fechaLegible(fecha) {
    if (!fecha) return 'Fecha por confirmar';
    const dia = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(dia.getTime())) return 'Fecha por confirmar';
    return dia.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function TorneoDetalle({ torneo, usuario, onSalir }) {
    const esCompetidor = usuario?.rol === 'Competidor';
    if (!torneo) return null;

    const inscriptos = Number(torneo.inscriptos) || 0;
    const limite = Number(torneo.limite_participantes) || 0;
    const cuposRestantes = Math.max(limite - inscriptos, 0);
    const lugar = [torneo.ciudad, torneo.pais].filter(Boolean).join(', ') || torneo.Lugar_Venue || 'Ubicación por confirmar';
    const inscripcionesAbiertas = torneo.estado === 'Inscripciones abiertas';

    return (
        <main className="torneo-detalle-page">
            <div className="torneo-detalle-contenedor">
                <header className="torneo-detalle-encabezado">
                    {onSalir && (
                        <button className="torneo-detalle-volver" type="button" onClick={onSalir}>
                            ← Volver a torneos
                        </button>
                    )}
                    <div className="torneo-detalle-hero">
                        <h1>{torneo.nombre}</h1>
                        <div className="torneo-detalle-resumen">
                            <div className="torneo-detalle-resumen-div">
                                <img src={calendarIcon} alt="" />
                                <span>{fechaLegible(torneo.fecha_Inicio)} - {fechaLegible(torneo.fecha_fin)}</span>
                                <p>Fecha del torneo</p>
                            </div>
                            <div className="torneo-detalle-resumen-div">
                                <img src={ubicacionIcon} alt="" />
                                <span>{torneo.ciudad || torneo.Lugar_Venue || 'Sede por confirmar'}</span>
                                <p>{torneo.pais || lugar}</p>
                            </div>
                            <div className="torneo-detalle-resumen-div">
                                <img src={competidoresLimIcon} alt="" />
                                <span>{limite} competidores</span>
                                <p>Límite de inscripción</p>
                            </div>

                            <div className="torneo-detalle-tags">
                                <span className={inscripcionesAbiertas ? 'tag-inscripciones' : 'tag-estado-torneo'}>{torneo.estado}</span>
                                <span className="tag-cupos-restantes">Quedan {cuposRestantes} cupos</span>
                            </div>

                            <div className="torneo-detalle-btns">
                                {esCompetidor && inscripcionesAbiertas && cuposRestantes > 0 && (
                                    <button
                                        className="btn-inscribirme"
                                        type="button"
                                        onClick={() => document.getElementById('seccion-inscripcion')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Inscribirme →
                                    </button>
                                )}
                                <button className="btn-ver-resultados" type="button"><img src={enVivoIcon} alt="" />Ver resultados en vivo</button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="navbar-torneo-detalle">
                        <span>General</span>
                        <span>Categorías</span>
                        <span>Cronograma</span>
                        {esCompetidor && <span className="activo">Inscripción</span>}
                        <span>Competidores</span>
                        <span>Importante</span>
                </div>

                {esCompetidor && (
                    <div id="seccion-inscripcion">
                        <Inscripcion torneo={torneo} />
                    </div>
                )}
        
            </div>
        </main>

    );
}

export default TorneoDetalle;