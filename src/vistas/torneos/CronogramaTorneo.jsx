import calendarIcon from '/src/assets/torneos/calendar-icon.svg';
import { categorias as catalogoCategorias } from './pasos/datosCategorias.js';
import { normalizarNombre, formatearTiempoRonda, cutoffConfigurado, avanceLegible } from './rondasTorneo.js';
import './CronogramaTorneo.css';

function fechaCronograma(fecha) {
    if (!fecha) return '';
    const dia = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(dia.getTime())) return '';
    return dia.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function CronogramaTorneo({ actividades = [], categorias = [], torneo }) {
    const inicio = fechaCronograma(torneo.fecha_Inicio);
    const fin = fechaCronograma(torneo.fecha_fin);
    const periodo = inicio && fin && inicio !== fin ? `${inicio} — ${fin}` : inicio || fin;

    return (
        <section className="torneo-detalle-contenido torneo-cronograma" aria-label="Cronograma del torneo">
            <h2><img src={calendarIcon} alt="" />Cronograma</h2>
            {actividades.length ? (
                <>
                    <h3 className="torneo-cronograma-fecha">
                        <span>{periodo ? `Horario del torneo: ${periodo}` : 'Horario del torneo'}</span>
                    </h3>
                    <div className="torneo-cronograma-tabla-contenedor" role="region" aria-label="Horarios y actividades" tabIndex={0}>
                        <table className="torneo-cronograma-tabla" aria-label="Cronograma de actividades del torneo">
                            <thead>
                                <tr>
                                    <th scope="col">Comienzo</th>
                                    <th scope="col">Fin</th>
                                    <th scope="col">Actividad</th>
                                    <th scope="col">Formato</th>
                                    <th scope="col">Tiempo límite</th>
                                    <th scope="col">Tiempo de corte</th>
                                    <th scope="col">Avanzan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actividades.map((actividad, indice) => {
                                    const categoria = categorias.find((item) => String(item.idCategoria) === String(actividad.idCategoria));
                                    const ronda = categoria?.rondas?.find((item) => String(item.idRonda) === String(actividad.idRonda));
                                    const nombre = actividad.categoria || categoria?.categoria;
                                    const icono = catalogoCategorias.find((item) =>
                                        normalizarNombre(item.id) === normalizarNombre(nombre)
                                        || normalizarNombre(item.etiqueta) === normalizarNombre(nombre)
                                    )?.icono;
                                    const nombreRonda = actividad.ronda || ronda?.nombre;
                                    const tieneCutoff = cutoffConfigurado(ronda?.cutoff);
                                    return (
                                        <tr key={`${actividad.idCategoria}-${actividad.idRonda}-${indice}`}>
                                            <td className="torneo-cronograma-hora">{actividad.horaInicio ? String(actividad.horaInicio).slice(0, 5) : '—'}</td>
                                            <td className="torneo-cronograma-hora">{actividad.horaFin ? String(actividad.horaFin).slice(0, 5) : '—'}</td>
                                            <th scope="row">
                                                <span className="torneo-cronograma-actividad">
                                                    {icono && <img src={icono} alt="" />}
                                                    <span>{actividad.evento || [nombre, nombreRonda].filter(Boolean).join(' - ') || 'Actividad por confirmar'}</span>
                                                </span>
                                            </th>
                                            <td>{ronda?.formato || categoria?.formato || '—'}</td>
                                            <td className="torneo-cronograma-tiempo">
                                                {formatearTiempoRonda(ronda?.tiempoLimite)}
                                                {tieneCutoff && <span className="torneo-cronograma-asterisco" aria-label="Con tiempo de corte">*</span>}
                                            </td>
                                            <td className="torneo-cronograma-tiempo">{tieneCutoff ? formatearTiempoRonda(ronda.cutoff) : '—'}</td>
                                            <td>{ronda ? avanceLegible(ronda) : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : <p>El cronograma todavía no está disponible.</p>}
        </section>
    );
}

export default CronogramaTorneo;
