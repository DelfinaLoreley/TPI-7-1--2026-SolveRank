import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';

import paginaAnteriorIcon from '/src/assets/icons/triflecha-izq-icon.png';
import paginaSiguienteIcon from '/src/assets/icons/triflecha-der-icon.png';
import cuboBanner from '/src/assets/img-cubo-banner.png';

import './ListadoTorneo.css';
import FiltrosTorneo from './listado/FiltrosTorneo.jsx';
import TarjetaTorneo from './listado/TarjetaTorneo.jsx';
import useTorneosFavoritos from '../../hooks/useTorneosFavoritos.js';

const pestanas = ['Próximos', 'Recientes', 'Anteriores', 'En curso'];
const diasRecientes = 90;

function fechaLocal(fecha) {
    if (!fecha) return null;
    const texto = String(fecha).slice(0, 10);
    const [anio, mes, dia] = texto.split('-').map(Number);
    if (!anio || !mes || !dia) return null;
    const valor = new Date(anio, mes - 1, dia);
    return Number.isNaN(valor.getTime()) ? null : valor;
}

function filtrarPorPestana(torneo, pestana, hoy) {
    const inicio = fechaLocal(torneo.fecha_Inicio);
    const fin = fechaLocal(torneo.fecha_fin) ?? inicio;
    if (!inicio) return false;

    if (pestana === 'Próximos') return inicio > hoy;
    if (pestana === 'En curso') return inicio <= hoy && (!fin || fin >= hoy);
    if (pestana === 'Recientes') {
        const limite = new Date(hoy);
        limite.setDate(limite.getDate() - diasRecientes);
        return fin < hoy && fin >= limite;
    }
    return fin < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diasRecientes);
}

function inscripcionAbierta(torneo, hoy) {
    const apertura = fechaLocal(torneo.Fecha_Inicio_Inscripcion);
    const cierre = fechaLocal(torneo.Fecha_fin_Inscripcion);
    if (!apertura || !cierre) return false;
    cierre.setHours(23, 59, 59, 999);
    return apertura <= hoy && hoy <= cierre;
}

function ListadoTorneo({ onVerTorneo, usuario, onIniciarSesion }) {
    const [torneos, setTorneos] = useState([]);
    const [paises, setPaises] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoPaises, setCargandoPaises] = useState(true);
    const [error, setError] = useState('');
    const [errorPaises, setErrorPaises] = useState('');
    const [pestanaActiva, setPestanaActiva] = useState('Próximos');
    const [busqueda, setBusqueda] = useState('');
    const [paisSeleccionado, setPaisSeleccionado] = useState('');
    const [anioSeleccionado, setAnioSeleccionado] = useState(String(new Date().getFullYear()));
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [soloInscripcionesAbiertas, setSoloInscripcionesAbiertas] = useState(false);
    const [orden, setOrden] = useState('fecha-ascendente');
    const [pagina, setPagina] = useState(1);
    const [torneosPorPagina, setTorneosPorPagina] = useState(
        () => window.matchMedia('(max-width: 700px)').matches ? 10 : 12
    );
    const { favoritos, actualizando, errorFavoritos, alternarFavorito } = useTorneosFavoritos(usuario);

    function actualizarFiltro(actualizar, valor) {
        actualizar(valor);
        setPagina(1);
    }

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

    useEffect(() => {
        let activo = true;
        axios.get('/paises')
            .then(({ data }) => {
                if (activo) setPaises(data.paises ?? []);
            })
            .catch((err) => {
                if (activo) setErrorPaises(err?.response?.data?.mensaje || 'No se pudieron cargar los países.');
            })
            .finally(() => {
                if (activo) setCargandoPaises(false);
            });
        return () => { activo = false; };
    }, []);

    useEffect(() => {
        const consulta = window.matchMedia('(max-width: 700px)');
        const actualizarCantidad = (evento) => setTorneosPorPagina(evento.matches ? 10 : 12);
        actualizarCantidad(consulta);
        consulta.addEventListener('change', actualizarCantidad);
        return () => consulta.removeEventListener('change', actualizarCantidad);
    }, []);

    const hoy = useMemo(() => {
        const valor = new Date();
        valor.setHours(0, 0, 0, 0);
        return valor;
    }, []);

    const anios = useMemo(
        () => [...new Set(torneos.map((torneo) => fechaLocal(torneo.fecha_Inicio)?.getFullYear()).filter(Boolean))].sort((a, b) => b - a),
        [torneos]
    );
    const categorias = useMemo(
        () => [...new Set(torneos.flatMap((torneo) => String(torneo.categoriasLista ?? '').split('|').filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es')),
        [torneos]
    );

    const torneosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase('es');
        const filtrados = torneos.filter((torneo) => {
            const fecha = fechaLocal(torneo.fecha_Inicio);
            const texto = [torneo.nombre, torneo.ciudad, torneo.provincia, torneo.pais, torneo.Lugar_Venue]
                .filter(Boolean).join(' ').toLocaleLowerCase('es');
            const nombresCategorias = String(torneo.categoriasLista ?? '').split('|');

            return filtrarPorPestana(torneo, pestanaActiva, hoy)
                && (!soloInscripcionesAbiertas || inscripcionAbierta(torneo, hoy))
                && (!termino || texto.includes(termino))
                && (!paisSeleccionado || torneo.pais === paisSeleccionado)
                && (!anioSeleccionado || (
                    fecha?.getFullYear() === (anioSeleccionado === 'actual' ? hoy.getFullYear() : Number(anioSeleccionado))
                ))
                && (!categoriaSeleccionada || nombresCategorias.includes(categoriaSeleccionada));
        });

        filtrados.sort((a, b) => {
            if (orden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
            const fechaA = fechaLocal(a.fecha_Inicio)?.getTime() ?? 0;
            const fechaB = fechaLocal(b.fecha_Inicio)?.getTime() ?? 0;
            return orden === 'fecha-descendente' ? fechaB - fechaA : fechaA - fechaB;
        });
        return filtrados;
    }, [torneos, pestanaActiva, hoy, soloInscripcionesAbiertas, busqueda, paisSeleccionado, anioSeleccionado, categoriaSeleccionada, orden]);

    const totalPaginas = Math.max(1, Math.ceil(torneosFiltrados.length / torneosPorPagina));
    const paginaActual = Math.min(pagina, totalPaginas);
    const torneosVisibles = torneosFiltrados.slice(
        (paginaActual - 1) * torneosPorPagina,
        paginaActual * torneosPorPagina
    );
    const desde = torneosFiltrados.length ? (paginaActual - 1) * torneosPorPagina + 1 : 0;
    const hasta = Math.min(paginaActual * torneosPorPagina, torneosFiltrados.length);

    return (
        <main className="listado-torneos">
            <div className="listado-torneos-contenido">
                <header className="listado-torneos-hero" style={{ backgroundImage: `url(${cuboBanner})` }}>
                    <div>
                        <h1>TORNEOS</h1>
                        <p>Descubrí los próximos torneos de<br className="listado-desktop-break" /> speedcubing en el mundo.</p>
                    </div>
                </header>

                <section className="listado-torneos-panel" aria-label="Listado de torneos">
                    <div className="listado-torneos-controles">
                        <FiltrosTorneo
                            busqueda={busqueda}
                            onCambiarBusqueda={(valor) => actualizarFiltro(setBusqueda, valor)}
                            paises={paises.map(({ pais }) => pais)}
                            paisSeleccionado={paisSeleccionado}
                            onCambiarPais={(valor) => actualizarFiltro(setPaisSeleccionado, valor)}
                            cargandoPaises={cargandoPaises}
                            errorPaises={errorPaises}
                            anios={anios}
                            anioSeleccionado={anioSeleccionado}
                            onCambiarAnio={(valor) => actualizarFiltro(setAnioSeleccionado, valor)}
                            categorias={categorias}
                            categoriaSeleccionada={categoriaSeleccionada}
                            onCambiarCategoria={(valor) => actualizarFiltro(setCategoriaSeleccionada, valor)}
                        />
                        <div className="listado-torneos-acciones">
                            <nav className="listado-torneos-pestanas" aria-label="Filtrar torneos por fecha">
                                {pestanas.map((pestana) => (
                                    <button
                                        type="button"
                                        key={pestana}
                                        className={pestanaActiva === pestana ? 'activa' : ''}
                                        aria-pressed={pestanaActiva === pestana}
                                        onClick={() => {
                                            setPestanaActiva(pestana);
                                            setPagina(1);
                                        }}
                                    >
                                        {pestana}
                                    </button>
                                ))}
                            </nav>
                            <button
                                type="button"
                                className={`listado-torneos-inscripciones${soloInscripcionesAbiertas ? ' activa' : ''}`}
                                aria-pressed={soloInscripcionesAbiertas}
                                onClick={() => actualizarFiltro(setSoloInscripcionesAbiertas, !soloInscripcionesAbiertas)}
                            >
                                Inscripciones abiertas
                            </button>
                        </div>
                    </div>

                    <div className="listado-torneos-resumen">
                        <label className="listado-orden">
                            <span>Ordenar por:</span>
                            <select className="listado-orden-select" value={orden} onChange={(evento) => actualizarFiltro(setOrden, evento.target.value)}>
                                <option value="fecha-ascendente">Fecha ascendente</option>
                                <option value="fecha-descendente">Fecha descendente</option>
                                <option value="nombre">De la A a la Z</option>
                            </select>
                        </label>
                    </div>

                    {cargando ? (
                        <p className="listado-torneos-mensaje" role="status">Cargando torneos…</p>
                    ) : error ? (
                        <p className="listado-torneos-mensaje" role="alert">{error}</p>
                    ) : torneosVisibles.length ? (
                        <div className="listado-torneos-grid">
                            {torneosVisibles.map((torneo) => (
                                <TarjetaTorneo
                                    key={torneo.idTorneo}
                                    torneo={torneo}
                                    urlBackend={axios.defaults.baseURL.replace(/\/api\/?$/, '')}
                                    guardado={favoritos.has(String(torneo.idTorneo))}
                                    favoritoActualizando={actualizando.has(String(torneo.idTorneo))}
                                    onAlternarGuardado={usuario ? () => alternarFavorito(torneo.idTorneo) : undefined}
                                    onSolicitarLogin={onIniciarSesion}
                                    onVerTorneo={() => onVerTorneo?.(torneo)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="listado-torneos-mensaje">No encontramos torneos que coincidan con estos filtros.</p>
                    )}

                    {errorFavoritos && <p className="listado-torneos-mensaje" role="alert">{errorFavoritos}</p>}

                    {!cargando && !error && (
                        <nav className="listado-torneos-paginacion" aria-label="Paginación de torneos">
                            <span>{torneosFiltrados.length > torneosPorPagina
                                ? `Mostrando ${desde}–${hasta} de ${torneosFiltrados.length} torneos`
                                : `Mostrando ${torneosFiltrados.length} torneos`}</span>
                            <div>
                                <button type="button" aria-label="Página anterior" disabled={paginaActual <= 1 || cargando} onClick={() => setPagina(paginaActual - 1)}><img src={paginaAnteriorIcon} alt="" /></button>
                                <span>{paginaActual}</span>
                                <button type="button" aria-label="Página siguiente" disabled={paginaActual >= totalPaginas || cargando} onClick={() => setPagina(paginaActual + 1)}><img src={paginaSiguienteIcon} alt="" /></button>
                            </div>
                        </nav>
                    )}
                </section>
            </div>
        </main>
    );
}

export default ListadoTorneo;
