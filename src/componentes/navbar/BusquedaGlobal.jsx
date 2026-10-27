import { useEffect, useState } from 'react';
import axios from '../../axiosApi';
import avatarPredeterminado from '/src/assets/home/iconos/user-pfp-icon.png';
import './BusquedaGlobal.css';

function fechaCorta(fecha) {
    if (!fecha) return '';
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
    if (!anio || !mes || !dia) return '';
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BusquedaGlobal({ onCerrar, onElegirTorneo, onElegirCompetidor }) {
    const [texto, setTexto] = useState('');
    const [torneos, setTorneos] = useState([]);
    const [competidores, setCompetidores] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const urlBackend = axios.defaults.baseURL.replace(/\/api\/?$/, '');

    useEffect(() => {
        const termino = texto.trim();
        if (termino.length < 2) {
            setTorneos([]);
            setCompetidores([]);
            setCargando(false);
            setError('');
            return undefined;
        }
        let activo = true;
        setCargando(true);
        setError('');
        const temporizador = window.setTimeout(async () => {
            const [respuestaTorneos, respuestaCompetidores] = await Promise.allSettled([
                axios.get('/torneos/buscar', { params: { texto: termino } }),
                axios.get('/usuarios/buscar', { params: { texto: termino } }),
            ]);
            if (!activo) return;
            const falloTorneos = respuestaTorneos.status === 'rejected';
            const falloCompetidores = respuestaCompetidores.status === 'rejected';
            setTorneos(falloTorneos ? [] : respuestaTorneos.value.data.torneos ?? []);
            setCompetidores(falloCompetidores ? [] : respuestaCompetidores.value.data.competidores ?? []);
            if (falloTorneos && falloCompetidores) setError('No se pudo completar la búsqueda. Intentá nuevamente.');
            setCargando(false);
        }, 240);
        return () => {
            activo = false;
            window.clearTimeout(temporizador);
        };
    }, [texto]);

    function manejarTecla(evento) {
        if (evento.key === 'Escape') onCerrar();
    }

    return (
        <div className="busqueda-global" onKeyDown={manejarTecla}>
            <div className="busqueda-global-cabecera">
                <span className="busqueda-global-lupa" aria-hidden="true">⌕</span>
                <input
                    type="search"
                    autoFocus
                    value={texto}
                    onChange={(evento) => setTexto(evento.target.value)}
                    placeholder="Buscar torneos o competidores…"
                    aria-label="Buscar torneos o competidores"
                />
                <button type="button" onClick={onCerrar} aria-label="Cerrar búsqueda">×</button>
            </div>
            <div className="busqueda-global-resultados" aria-live="polite">
                {texto.trim().length < 2 && <p className="busqueda-global-ayuda">Escribí al menos 2 caracteres para buscar.</p>}
                {cargando && <p className="busqueda-global-ayuda">Buscando…</p>}
                {error && <p className="busqueda-global-ayuda error" role="alert">{error}</p>}
                {!cargando && !error && texto.trim().length >= 2 && !torneos.length && !competidores.length && (
                    <p className="busqueda-global-ayuda">No encontramos torneos ni perfiles con esa búsqueda.</p>
                )}
                {!!torneos.length && <section className="busqueda-global-grupo">
                    <h2>Torneos</h2>
                    {torneos.map((torneo) => <button className="busqueda-global-resultado" type="button" key={torneo.idTorneo} onClick={() => onElegirTorneo(torneo)}>
                        {torneo.pathImagen && <img className="busqueda-global-imagen-torneo" src={`${urlBackend}${torneo.pathImagen}`} alt="" />}
                        <span className="busqueda-global-info"><strong>{torneo.nombre}</strong><small>{[torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ')}</small></span>
                        <span className="busqueda-global-meta">{fechaCorta(torneo.fecha_Inicio)}</span>
                    </button>)}
                </section>}
                {!!competidores.length && <section className="busqueda-global-grupo">
                    <h2>Perfiles</h2>
                    {competidores.map((competidor) => <button className="busqueda-global-resultado" type="button" key={competidor.idUsuario} onClick={() => onElegirCompetidor(competidor)}>
                        <img className="busqueda-global-avatar" src={competidor.avatar_url || avatarPredeterminado} alt="" />
                        <span className="busqueda-global-info"><strong>{competidor.nombre} {competidor.apellido}</strong><small>{[competidor.wcaid, competidor.pais, competidor.rol].filter(Boolean).join(' · ')}</small></span>
                        <span className="busqueda-global-flecha" aria-hidden="true">→</span>
                    </button>)}
                </section>}
            </div>
        </div>
    );
}
