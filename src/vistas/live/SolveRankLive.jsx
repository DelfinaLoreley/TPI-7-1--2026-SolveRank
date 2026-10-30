import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';

import cuboBanner from '/src/assets/img-cubo-banner.png';
import categoriasIcon from '/src/assets/home/iconos/categoria3x3-icon.png';
import competidoresIcon from '/src/assets/torneos/competidores-blanco-icon.svg';
import ubicacionIcon from '/src/assets/torneos/ubicacion-violeta-icon.svg';
import searchIcon from '/src/assets/icons/search-icon.png';

import './SolveRankLive.css';

const paisesConBandera = {
    argentina: '🇦🇷',
    alemania: '🇩🇪',
    germany: '🇩🇪',
    nepal: '🇳🇵',
    filipinas: '🇵🇭',
    philippines: '🇵🇭',
};

function fechaLocal(fecha) {
    if (!fecha) return null;
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
    if (!anio || !mes || !dia) return null;
    const valor = new Date(anio, mes - 1, dia);
    return Number.isNaN(valor.getTime()) ? null : valor;
}

function obtenerBandera(pais) {
    return paisesConBandera[String(pais ?? '').trim().toLocaleLowerCase('es')] ?? '🌐';
}

function TarjetaLive({ torneo, onVerTorneo }) {
    const fecha = fechaLocal(torneo.fecha_Inicio);
    const ubicacion = [torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ')
        || torneo.Lugar_Venue
        || 'Ubicación a confirmar';
    const categorias = Number(torneo.categorias) || 0;
    const cupos = Number(torneo.limite_participantes) || 0;

    return (
        <article className="live-torneo-card">
            <span className="live-torneo-bandera" aria-label={torneo.pais || 'Ubicación internacional'}>
                {obtenerBandera(torneo.pais)}
            </span>
            <div className="live-torneo-detalle">
                <div className="live-torneo-fecha" aria-label={fecha ? fecha.toLocaleDateString('es-AR') : 'Fecha a confirmar'}>
                    <strong>{fecha ? fecha.toLocaleDateString('es-AR', { day: '2-digit' }) : '—'}</strong>
                    <span>{fecha ? fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase() : '—'}</span>
                </div>
                <div className="live-torneo-titulo">
                    <h2>{torneo.nombre}</h2>
                    <p><img src={ubicacionIcon} alt="" />{ubicacion}</p>
                </div>
            </div>
            <div className="live-torneo-meta">
                <span><img src={categoriasIcon} alt="" />{categorias} {categorias === 1 ? 'categoría' : 'categorías'}</span>
                <span><img src={competidoresIcon} alt="" />{cupos} cupos</span>
            </div>
            <button type="button" className="live-torneo-ver" onClick={onVerTorneo}>
                <span>Ver torneo</span>
                <span aria-hidden="true">⟶</span>
            </button>
        </article>
    );
}

function SolveRankLive({ onVerTorneo }) {
    const [torneos, setTorneos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [pestanaActiva, setPestanaActiva] = useState('Ahora mismo');

    useEffect(() => {
        let activo = true;
        axios.get('/torneos')
            .then(({ data }) => {
                if (activo) setTorneos(data.torneos ?? []);
            })
            .catch((err) => {
                if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar los torneos.');
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        return () => { activo = false; };
    }, []);

    const torneosFiltrados = useMemo(() => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const termino = busqueda.trim().toLocaleLowerCase('es');

        return torneos
            .filter((torneo) => {
                const inicio = fechaLocal(torneo.fecha_Inicio);
                const fin = fechaLocal(torneo.fecha_fin) ?? inicio;
                if (!inicio) return false;
                const estaEnCurso = inicio <= hoy && fin >= hoy;
                const esProximo = inicio > hoy;
                const coincideConPestana = pestanaActiva === 'Ahora mismo' ? estaEnCurso : esProximo;
                const texto = [torneo.nombre, torneo.ciudad, torneo.provincia, torneo.pais, torneo.Lugar_Venue]
                    .filter(Boolean)
                    .join(' ')
                    .toLocaleLowerCase('es');
                return coincideConPestana && (!termino || texto.includes(termino));
            })
            .sort((a, b) => (fechaLocal(a.fecha_Inicio)?.getTime() ?? 0) - (fechaLocal(b.fecha_Inicio)?.getTime() ?? 0));
    }, [torneos, busqueda, pestanaActiva]);

    return (
        <main className="solverank-live">
            <div className="solverank-live-contenido">
                <header className="solverank-live-hero" style={{ backgroundImage: `url(${cuboBanner})` }}>
                    <div className="solverank-live-hero-texto">
                        <h1>SolveRank LIVE</h1>
                        <p>Descubrí los torneos speedcubing en curso y<br className="live-desktop-break" /> próximos en todo el mundo.</p>
                    </div>
                </header>

                <section className="solverank-live-panel" aria-label="Torneos en curso y próximos">
                    <label className="solverank-live-busqueda">
                        <img src={searchIcon}/>
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(evento) => setBusqueda(evento.target.value)}
                            placeholder="Buscar el nombre, ciudad o país..."
                            aria-label="Buscar por nombre, ciudad o país"
                        />
                    </label>

                    <div className="solverank-live-resultados">
                        <nav className="solverank-live-pestanas" aria-label="Filtrar torneos">
                            {['Ahora mismo', 'Próximos'].map((pestana) => (
                                <button
                                    type="button"
                                    key={pestana}
                                    className={pestanaActiva === pestana ? 'activa' : ''}
                                    aria-pressed={pestanaActiva === pestana}
                                    onClick={() => setPestanaActiva(pestana)}
                                >
                                    {pestana}
                                </button>
                            ))}
                        </nav>

                        {cargando ? (
                            <p className="solverank-live-mensaje" role="status">Cargando torneos…</p>
                        ) : error ? (
                            <p className="solverank-live-mensaje" role="alert">{error}</p>
                        ) : torneosFiltrados.length ? (
                            <div className="solverank-live-grid">
                                {torneosFiltrados.map((torneo) => (
                                    <TarjetaLive
                                        key={torneo.idTorneo}
                                        torneo={torneo}
                                        onVerTorneo={() => onVerTorneo?.(torneo)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="solverank-live-mensaje">
                                {busqueda
                                    ? 'No encontramos torneos que coincidan con tu búsqueda.'
                                    : pestanaActiva === 'Ahora mismo'
                                    ? 'No hay torneos en curso por el momento.'
                                    : 'Todavía no hay próximos torneos para mostrar.'}
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default SolveRankLive;
