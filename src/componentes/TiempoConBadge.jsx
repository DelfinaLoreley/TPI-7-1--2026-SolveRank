import './TiempoConBadge.css';

function mismoTiempo(a, b) {
    if (a === null || a === undefined || a === '' || b === null || b === undefined || b === '') return false;
    if (!Number.isFinite(Number(a)) || !Number.isFinite(Number(b))) return false;
    return Math.floor(Number(a) * 100 + 1e-8) === Math.floor(Number(b) * 100 + 1e-8);
}

function TiempoConBadge({ valor, tipo = 'single', idCategoria, idUsuario, marcas = {}, marca: marcaDirecta, children }) {
    const marca = marcaDirecta || marcas[`${idCategoria}:${idUsuario}`];
    const wr = marca?.[`wr${tipo === 'media' ? 'Media' : 'Single'}`];
    const pr = marca?.[`pr${tipo === 'media' ? 'Media' : 'Single'}`];
    const insignia = mismoTiempo(valor, wr) ? 'WR' : mismoTiempo(valor, pr) ? 'PR' : null;

    return (
        <span className="tiempo-con-badge">
            {children}
            {insignia && <span className={`tiempo-record-badge tiempo-record-badge-${insignia.toLowerCase()}`} title={insignia === 'WR' ? 'Récord mundial de SolveRank' : 'Récord personal'} aria-label={insignia === 'WR' ? 'Récord mundial de SolveRank' : 'Récord personal'}>{insignia}</span>}
        </span>
    );
}

export default TiempoConBadge;
