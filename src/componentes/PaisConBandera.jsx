import 'flag-icons/css/flag-icons.min.css';
import './PaisConBandera.css';

function normalizarPais(valor) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es')
        .replace(/[^a-z0-9]/g, '');
}

const nombresPorCodigo = new Map();
for (const locale of ['es', 'en']) {
    const nombresRegion = new Intl.DisplayNames([locale], { type: 'region' });
    for (let primero = 65; primero <= 90; primero += 1) {
        for (let segundo = 65; segundo <= 90; segundo += 1) {
            const codigo = String.fromCharCode(primero, segundo);
            const nombre = nombresRegion.of(codigo);
            if (nombre && nombre !== codigo) nombresPorCodigo.set(normalizarPais(nombre), codigo.toLowerCase());
        }
    }
}

const aliasPais = {
    eeuu: 'us', usa: 'us', unitedstatesofamerica: 'us', estadosunidosdeamerica: 'us',
    uk: 'gb', greatbritain: 'gb', england: 'gb', coreadelsur: 'kr', southkorea: 'kr',
    republicofkorea: 'kr', coreadelnorte: 'kp', northkorea: 'kp', rusia: 'ru',
    republicacheca: 'cz', chequia: 'cz', ivorycoast: 'ci', costademarfil: 'ci',
    taiwan: 'tw', hongkong: 'hk', macao: 'mo', palestina: 'ps',
};

function obtenerCodigoPais(pais) {
    const normalizado = normalizarPais(pais);
    if (/^[a-z]{2}$/.test(normalizado)) return normalizado;
    return aliasPais[normalizado] || nombresPorCodigo.get(normalizado) || '';
}

export default function PaisConBandera({ pais, fallback = '—', className = '', soloBandera = false }) {
    const nombre = String(pais ?? '').trim();
    const codigo = obtenerCodigoPais(nombre);
    const clases = ['pais-con-bandera', className].filter(Boolean).join(' ');

    if (!nombre) return soloBandera ? null : <span className={clases}>{fallback}</span>;
    if (soloBandera) {
        return codigo ? (
            <span className={clases} role="img" aria-label={`Bandera de ${nombre}`}>
                <span className={`fi fi-${codigo} pais-con-bandera-icono`} aria-hidden="true" />
            </span>
        ) : null;
    }

    return (
        <span className={clases}>
            {codigo && <span className={`fi fi-${codigo} pais-con-bandera-icono`} aria-hidden="true" />}
            <span>{nombre}</span>
        </span>
    );
}