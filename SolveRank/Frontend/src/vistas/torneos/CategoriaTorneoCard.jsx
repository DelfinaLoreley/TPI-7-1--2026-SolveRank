import './CategoriaTorneoCard.css';

function normalizarNombre(valor) {
    return String(valor || '').trim().toLocaleLowerCase('es');
}

function formatearTiempoRonda(valor) {
    if (!valor) return '—';
    const coincidencia = String(valor).match(/^(\d{1,3}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!coincidencia) return String(valor);

    const [, horas, minutos, segundos, fraccion = ''] = coincidencia;
    const minutosTotales = Number(horas) * 60 + Number(minutos);
    const centesimas = fraccion.slice(0, 2).padEnd(2, '0');
    const tiempo = `${String(Number(segundos)).padStart(2, '0')}.${centesimas}`;
    return minutosTotales > 0 ? `${String(minutosTotales).padStart(2, '0')}:${tiempo}` : tiempo;
}

function cutoffConfigurado(valor) {
    if (!valor) return false;
    return !/^0{1,3}:00:00(?:\.0+)?$/.test(String(valor));
}

function avanceLegible(ronda) {
    if (String(ronda.nombre || '').toLocaleLowerCase('es').includes('final')) return '—';
    const porcentaje = Number(ronda.porcentajeAvance);
    return Number.isFinite(porcentaje) && porcentaje > 0 ? `${porcentaje}% mejor` : '—';
}

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
                    <p>Configuración de rondas y tiempos</p>
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
