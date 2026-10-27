import './CategoriaTorneoCard.css';
import { normalizarNombre, formatearTiempoRonda, cutoffConfigurado, avanceLegible } from './rondasTorneo.js';

function CategoriaTorneoCard({ categoria, catalogo = [] }) {
    const nombre = categoria.categoria || categoria.nombre || 'Categoría';
    const coincidencia = catalogo.find((item) =>
        normalizarNombre(item.etiqueta) === normalizarNombre(nombre)
        || normalizarNombre(item.id) === normalizarNombre(nombre)
    );
    const rondas = categoria.rondas || [];

    return (
        <article className="categoria-rondas-card">
            <header className="categoria-rondas-encabezado">
                <span className="categoria-rondas-icono" aria-hidden="true">
                    {coincidencia?.icono
                        ? <img src={coincidencia.icono} alt="" />
                        : <span>◇</span>}
                </span>
                <div>
                    <h3>{coincidencia?.etiqueta || nombre}</h3>
                </div>
            </header>

            {rondas.length ? (
                <div className="categoria-rondas-tabla-contenedor">
                    <table className="categoria-rondas-tabla">
                        <thead>
                            <tr>
                                <th scope="col">Ronda</th>
                                <th scope="col">Formato</th>
                                <th scope="col">Tiempo límite</th>
                                <th scope="col">Avanzan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rondas.map((ronda) => {
                                const tieneCutoff = cutoffConfigurado(ronda.cutoff);
                                return (
                                    <tr key={ronda.idRonda || ronda.nombre}>
                                        <th scope="row">{ronda.nombre || 'Ronda'}</th>
                                        <td>{ronda.formato || categoria.formato || '—'}</td>
                                        <td>
                                            <span>{formatearTiempoRonda(ronda.tiempoLimite)}{tieneCutoff ? '*' : ''}</span>
                                            {tieneCutoff && (
                                                <small className="categoria-rondas-cutoff">
                                                    Cutoff: {formatearTiempoRonda(ronda.cutoff)}
                                                </small>
                                            )}
                                        </td>
                                        <td>{avanceLegible(ronda)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="categoria-rondas-sin-rondas">La configuración de rondas todavía no está disponible.</p>
            )}
        </article>
    );
}

export default CategoriaTorneoCard;
