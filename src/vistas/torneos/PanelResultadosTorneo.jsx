import './PanelResultadosTorneo.css';
import categoriasIcon from '/src/assets/torneos/categorias-azul-icon.png';
import importanteIcon from '/src/assets/torneos/importante-icon.svg';
import { categorias } from './pasos/datosCategorias';

function horaLegible(hora) {
    return hora ? String(hora).slice(0, 5) : '—';
}

function iconoCategoria(categoria) {
    const nombre = String(categoria).trim().toLowerCase();
    return categorias.find(({ id, etiqueta }) =>
        id.toLowerCase() === nombre || etiqueta.toLowerCase() === nombre
    )?.icono;
}

function estadoRonda(ronda, fechaTorneo) {
    const total = Number(ronda.totalCompetidores) || 0;
    const conResultados = Number(ronda.competidoresConResultados) || 0;
    if (total > 0 && conResultados >= total) return 'Finalizada';

    if (ronda.horaInicio && ronda.horaFin && fechaTorneo) {
        const fecha = String(fechaTorneo).slice(0, 10);
        const ahora = new Date();
        const inicio = new Date(`${fecha}T${horaLegible(ronda.horaInicio)}:00`);
        const fin = new Date(`${fecha}T${horaLegible(ronda.horaFin)}:00`);
        if (!Number.isNaN(inicio.getTime()) && ahora >= inicio && ahora <= fin) return 'En curso';
    }
    return 'Pendiente';
}

function PanelResultadosTorneo({ torneo, rondas, cronograma = [], onSeleccionarRonda, soloLectura = false }) {
    return (
        <div className="panel-resultados-torneo">
            <section className="panel-resultados-seccion" aria-labelledby="panel-resultados-titulo">
                <h2 id="panel-resultados-titulo"><span aria-hidden="true"><img src={categoriasIcon}/></span> {soloLectura ? 'Resultados del torneo' : 'Resultados en VIVO'}</h2>
                <p>{soloLectura ? 'Consultá los resultados cargados por categoría y ronda.' : 'Gestioná los resultados de cada categoría y ronda del torneo.'}</p>
                {rondas.length ? ( 
                    <div className="panel-resultados-grid">
                        {rondas.map((ronda) => {
                            const estado = estadoRonda(ronda, torneo.fecha_Inicio);
                            const total = Number(ronda.totalCompetidores) || 0;
                            const conResultados = Number(ronda.competidoresConResultados) || 0;
                            const icono = iconoCategoria(ronda.categoria);
                            return (
                                <article className="panel-resultados-card" key={ronda.idRonda}>
                                    <div className="panel-resultados-icono" aria-hidden="true">
                                        {icono && <img src={icono} alt="" />} 
                                    </div>
                                    <div className="panel-resultados-card-info">
                                        <h3>{ronda.categoria}</h3>
                                        <p>{ronda.ronda} · <span className={`panel-resultados-estado ${estado.toLowerCase().replace(' ', '-')}`}>{estado}</span></p>
                                        <small>{conResultados}/{total} competidores</small>
                                    </div>
                                    {soloLectura ? (
                                        <button
                                            className="panel-resultados-boton-ver"
                                            type="button"
                                            disabled={conResultados === 0}
                                            onClick={() => onSeleccionarRonda(ronda.idRonda)}
                                        >
                                            {conResultados === 0 ? 'Sin resultados' : 'Ver'}
                                        </button>
                                    ) : (
                                        <button
                                            className={estado === 'Finalizada' ? 'panel-resultados-boton-ver' : 'panel-resultados-boton-cargar'}
                                            type="button"
                                            onClick={() => onSeleccionarRonda(ronda.idRonda)}
                                        >
                                            {estado === 'Finalizada' ? 'Ver' : 'Cargar'}
                                        </button>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="panel-resultados-vacio">Este torneo todavía no tiene rondas configuradas.</p>
                )}
            </section>

            <section className="panel-resultados-seccion panel-resultados-cronograma" aria-labelledby="panel-resultados-cronograma-titulo">
                <h2 id="panel-resultados-cronograma-titulo"><span aria-hidden="true"><img src={categoriasIcon}/></span> Próximas Rondas</h2>
                {cronograma.length ? (
                    <div className="panel-resultados-tabla-contenedor">
                        <table>
                            <thead>
                                <tr>
                                    <th>Comienzo</th>
                                    <th>Fin</th>
                                    <th>Actividad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cronograma.map((actividad, indice) => (
                                    <tr key={`${actividad.idRonda}-${indice}`}>
                                        <td>{horaLegible(actividad.horaInicio)}</td>
                                        <td>{horaLegible(actividad.horaFin)}</td>
                                        <td>{actividad.evento || `${actividad.categoria} · ${actividad.ronda}`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="panel-resultados-vacio">El cronograma todavía no está disponible.</p>
                )}
            </section>

            {!soloLectura && <aside className="panel-resultados-importante">
                <strong><span aria-hidden="true"><img src={importanteIcon} alt="Importante"/></span> IMPORTANTE</strong>
                <ul>
                    <li>Revisá que los resultados se carguen en el orden correcto de cada ronda.</li>
                    <li>Los competidores deben presentarse al menos 15 minutos antes de su ronda.</li>
                    <li>Cargá cada solve en orden con centésimas; usá +2 para penalización o DNF cuando corresponda.</li>
                </ul>
            </aside>}
        </div>
    );
}

export default PanelResultadosTorneo;
