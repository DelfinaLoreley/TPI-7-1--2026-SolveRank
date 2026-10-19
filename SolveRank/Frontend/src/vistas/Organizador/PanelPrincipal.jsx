import './PanelPrincipal.css';
import { useEffect, useState } from 'react';
import axios from '../../axiosApi';

import cuboBanner from '/src/assets/cubo-banner.svg';
import torneosIcon from '/src/assets/Organizador/torneos-icon.png';
import competidoresIcon2 from '/src/assets/Organizador/competidores-icon.png';
import competidoresIcon from '/src/assets/home/iconos/competidores-icon.png';
import torneosActivosIcon from '/src/assets/Organizador/torneosactivos-icon.png';
import proxtorneosIcon from '/src/assets/Organizador/proximostorneos-icono.png';
import calendarIcon from '/src/assets/home/iconos/Calendar.png';
import lugarIcon from '/src/assets/home/iconos/ubicacion-icon.png';
import categoriasIcon from '/src/assets/home/iconos/categoria3x3-icon.png';

import GraficoDona from './GraficoDona';
import GraficoBarras from './GraficoBarras';


function convertirFecha(fecha) {
    if (!fecha) return null;
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }
    const valor = fecha instanceof Date ? fecha : new Date(String(fecha).replace(' ', 'T'));
    return Number.isNaN(valor.getTime()) ? null : valor;
}

function estadoInscripcion(torneo, ahora = new Date()) {
    const finTorneo = convertirFecha(torneo.fecha_fin);
    if (finTorneo) {
        finTorneo.setHours(23, 59, 59, 999);
        if (ahora > finTorneo) return 'Torneo finalizado';
    }
    const apertura = convertirFecha(torneo.Fecha_Inicio_Inscripcion);
    const cierre = convertirFecha(torneo.Fecha_fin_Inscripcion);
    if (!apertura || !cierre) return 'Sin fechas de inscripción';
    apertura.setHours(0, 0, 0, 0);
    cierre.setHours(23, 59, 59, 999);
    if (ahora < apertura) return 'Inscripciones próximamente';
    if (ahora <= cierre) return 'Inscripciones abiertas';
    return 'Inscripciones cerradas';
}

function inscripcionFinalizada(torneo, ahora = new Date()) {
    const cierre = convertirFecha(torneo.Fecha_fin_Inscripcion);
    if (!cierre) return false;
    cierre.setHours(23, 59, 59, 999);
    return ahora > cierre;
}

function PanelPrincipal({ usuario, onCrearTorneo, onVerTorneo }){
    const [torneos, setTorneos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [generandoTorneoId, setGenerandoTorneoId] = useState(null);
    const [mensajesMezclas, setMensajesMezclas] = useState({});
    const [ahora, setAhora] = useState(() => new Date());

    useEffect(() => {
        let activo = true;
        axios.get('/torneos/mis-torneos')
            .then(({ data }) => { if (activo) setTorneos(data.torneos ?? []); })
            .catch((err) => { if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar tus torneos.'); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, []);

    useEffect(() => {
        const intervalo = window.setInterval(() => setAhora(new Date()), 30_000);
        return () => window.clearInterval(intervalo);
    }, []);

    const resumen = torneos.reduce((total, torneo) => {
        const inicio = convertirFecha(torneo.fecha_Inicio);
        const fin = convertirFecha(torneo.fecha_fin);
        const estado = estadoInscripcion(torneo, ahora);
        if (inicio && fin && inicio <= ahora && fin >= ahora) total.enVivo += 1;
        if (inicio && inicio > ahora) total.proximos += 1;
        if (estado === 'Inscripciones abiertas') total.inscripcionesAbiertas += 1;
        if (fin && fin < ahora) total.finalizados += 1;
        total.competidores += Number(torneo.inscriptos) || 0;
        return total;
    }, { enVivo: 0, proximos: 0, inscripcionesAbiertas: 0, finalizados: 0, competidores: 0 });

    const urlBackend = axios.defaults.baseURL.replace(/\/api\/?$/, '');

    async function generarMezclasTorneo(torneo) {
        if (usuario?.rol !== 'Organizador' || !inscripcionFinalizada(torneo)) return;
        setGenerandoTorneoId(torneo.idTorneo);
        setMensajesMezclas((actuales) => ({ ...actuales, [torneo.idTorneo]: 'Buscando rondas pendientes…' }));
        try {
            const { data } = await axios.get(`/torneos/${torneo.idTorneo}/mis-rondas`);
            const rondas = data.rondas ?? [];
            if (!rondas.length) {
                setMensajesMezclas((actuales) => ({ ...actuales, [torneo.idTorneo]: 'Este torneo no tiene rondas configuradas.' }));
                return;
            }

            const pendientes = rondas.filter((ronda) => Number(ronda.mezclasExistentes) === 0);
            if (!pendientes.length) {
                setMensajesMezclas((actuales) => ({ ...actuales, [torneo.idTorneo]: 'Todas las rondas ya tienen mezclas.' }));
                return;
            }

            const generadas = [];
            const fallidas = [];
            for (const ronda of pendientes) {
                try {
                    await axios.post(`/mezclas/torneos/${torneo.idTorneo}/rondas/${ronda.idRonda}/generar`, { grupo: 'A' });
                    generadas.push(`${ronda.categoria} ${ronda.ronda}`);
                } catch (err) {
                    fallidas.push(`${ronda.categoria} ${ronda.ronda}: ${err?.response?.data?.mensaje || 'no se pudieron generar las mezclas'}`);
                }
            }

            const partes = [];
            if (generadas.length) partes.push(`Mezclas generadas para ${generadas.length} ronda${generadas.length === 1 ? '' : 's'}.`);
            if (rondas.length - pendientes.length) partes.push(`${rondas.length - pendientes.length} ronda${rondas.length - pendientes.length === 1 ? '' : 's'} ya tenía mezclas.`);
            if (fallidas.length) partes.push(`No se pudieron generar: ${fallidas.join(' · ')}`);
            setMensajesMezclas((actuales) => ({ ...actuales, [torneo.idTorneo]: partes.join(' ') }));

            if (generadas.length) {
                const actualizados = await axios.get('/torneos/mis-torneos');
                setTorneos(actualizados.data.torneos ?? []);
            }
        } catch (err) {
            setMensajesMezclas((actuales) => ({ ...actuales, [torneo.idTorneo]: err?.response?.data?.mensaje || 'No se pudieron consultar las rondas.' }));
        } finally {
            setGenerandoTorneoId(null);
        }
    }

    return(
        <main className="panel-page">
            <div className="panel-contenido">
                <section className="panel-hero" id="inicio">
                    <div className="panel-hero-texto">
                        <h1>Hola, {usuario?.nombre || 'organizador'}</h1>
                        <p>Aquí tienes un resumen de todos tus torneos.</p>
                        <div className="panel-resumen-container">
                            <div className="panel-resumen-card">
                                <div><span className="panel-resumen-icono">
                                    <img src={torneosIcon} alt="Torneos" /></span><strong>{cargando ? '—' : torneos.length}</strong><small>Torneos creados</small>
                                </div>
                            </div>
                            <div className="panel-resumen-card">
                                <div><span className="panel-resumen-icono">
                                    <img src={competidoresIcon2} alt="Competidores" /></span><strong>{cargando ? '—' : resumen.competidores}</strong><small>Inscripciones</small>
                                </div>
                            </div>
                            <div className="panel-resumen-card">
                                <div><span className="panel-resumen-icono">
                                    <img src={torneosActivosIcon} alt="Torneos" /></span><strong>{cargando ? '—' : resumen.enVivo}</strong><small>Torneos activos</small>
                                </div>
                            </div>
                            <div className="panel-resumen-card">
                                <div><span className="panel-resumen-icono">
                                    <img src={proxtorneosIcon} alt="Torneos" /></span><strong>{cargando ? '—' : resumen.proximos}</strong><small>Próximos torneos</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="home-cubo-escena2">
                        <img src={cuboBanner} alt="Cubo de Rubik" />
                    </div>
                    <div className="panel-container2">
                        <div className="panel-cta">
                            <div>
                                <h3>¿Listo para crear un nuevo torneo?</h3>
                                <p>Configurá las categorías, cronogramas, <br className="panel-hero-br"/> rondas clasificaciones en pocos pasos.</p>
                                <button type="button" onClick={onCrearTorneo}>Crear torneo ⟶</button>
                            </div>
                            <div className="panel-cubo-img-cta">
                                <img src="/src/assets/organizador/img-cubo-hom-removebg-preview.png" alt="" />
                            </div>
                        </div>
                    
                        <div className="accesos-rapidos-container">
                            <button className="acceso-rapido-btn" type="button" onClick={onCrearTorneo}>Crear <br/> Torneo</button>
                            <button className="acceso-rapido-btn mt">Mis Torneos <br/> en VIVO</button>
                            <button className="acceso-rapido-btn">Cargar <br/> resultados</button>
                        </div>
                    </div>
                </section>
        
                <section className="home-panel home-torneos" id="torneos">
                    <div className="home-section-heading">
                        <h2><img src={calendarIcon}/> Mis torneos</h2>
                        <a href="#torneos">Ver todos ⟶</a>
                    </div>
                    <div className="home-torneos-grid">
                        {cargando ? <p className="panel-torneos-mensaje" role="status">Cargando tus torneos…</p>
                            : error ? <p className="panel-torneos-mensaje" role="alert">{error}</p>
                            : torneos.length === 0 ? <p className="panel-torneos-mensaje">Todavía no creaste torneos.</p>
                            : torneos.map((torneo) => {
                                const fecha = convertirFecha(torneo.fecha_Inicio);
                                const estado = estadoInscripcion(torneo, ahora);
                                const lugar = [torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ');
                                const imagen = torneo.pathImagen ? `${urlBackend}${torneo.pathImagen}` : cuboBanner;
                                return <article className="home-torneo-card" key={torneo.idTorneo}>
                                    <div className="home-torneo-imagen">
                                        <img className="home-torneo-foto" src={imagen} alt={`Imagen del torneo ${torneo.nombre}`} />
                                        <span className={`home-estado ${estado === 'Inscripciones abiertas' ? 'abiertas' : estado === 'Inscripciones cerradas' ? 'cerradas' : estado === 'Torneo finalizado' ? 'finalizado' : ''}`}>{estado}</span>
                                    </div>
                                    <div className="home-torneo-info">
                                        <div className="home-fecha"><strong>{fecha ? fecha.toLocaleDateString('es-AR', { day: '2-digit' }) : '—'}</strong><span>{fecha ? fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase() : '—'}</span></div>
                                        <div className="home-torneo-detalle">
                                            <h3>{torneo.nombre}</h3>
                                            <p><img src={lugarIcon} alt="Lugar"/> {lugar || torneo.Lugar_Venue || 'Ubicación a confirmar'}</p>
                                        </div>
                                        <div className="home-torneo-meta"><span><img src={categoriasIcon} alt="Categorías"/> {Number(torneo.categorias) || 0} categorías</span><span><img src={competidoresIcon} alt="Inscripciones"/> {Number(torneo.inscriptos) || 0}/{torneo.limite_participantes} inscriptos</span></div>
                                    </div>
                                    <button className="home-torneo-link" type="button" onClick={() => onVerTorneo?.(torneo)}>Ver torneo <span>⟶</span></button>
                                    {usuario?.rol === 'Organizador' && (
                                        <div className="home-torneo-mezclas-acciones">
                                            <button
                                                className="home-torneo-mezclas-btn"
                                                type="button"
                                                onClick={() => generarMezclasTorneo(torneo)}
                                                disabled={!inscripcionFinalizada(torneo, ahora) || generandoTorneoId !== null ||
                                                    (Number(torneo.rondasTotales) > 0 && Number(torneo.rondasConMezclas) >= Number(torneo.rondasTotales))}
                                                title={!inscripcionFinalizada(torneo, ahora) ? 'Se habilita cuando cierre la inscripción' : undefined}
                                            >
                                                {generandoTorneoId === torneo.idTorneo
                                                    ? 'Generando…'
                                                    : Number(torneo.rondasTotales) > 0 && Number(torneo.rondasConMezclas) >= Number(torneo.rondasTotales)
                                                        ? 'Mezclas generadas'
                                                        : 'Generar mezclas'}
                                            </button>
                                            {mensajesMezclas[torneo.idTorneo] && (
                                                <p className="home-torneo-mezclas-mensaje" role="status">{mensajesMezclas[torneo.idTorneo]}</p>
                                            )}
                                        </div>
                                    )}
                                </article>;
                            })}
                    </div>
                </section>

                <section className="panel-estadisticas">
                    {/* Tarjeta del Gráfico de Barras */}
                    <div className="tarjeta-estadisticas">
                        <h2>Inscripciones por torneo</h2>
                        {/* El gráfico toma automáticamente el ancho de la tarjeta */}
                            <GraficoBarras torneos={torneos} />
                    </div>

                    {/* Tarjeta del Gráfico de Dona */}
                    <div className="tarjeta-estadisticas">
                        <h2>Estado de mis torneos</h2>
                        <div style={{ height: '220px', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <GraficoDona resumen={resumen} total={torneos.length} />
                        </div>

                        <div className="resumen-torneos">
                            <div className="resumen-item"><span>En vivo</span> <span>{cargando ? '—' : resumen.enVivo}</span></div>
                            <div className="resumen-item"><span>Inscripciones abiertas</span> <span>{cargando ? '—' : resumen.inscripcionesAbiertas}</span></div>
                            <div className="resumen-item"><span>Próximos</span> <span>{cargando ? '—' : resumen.proximos}</span></div>
                            <div className="resumen-item"><span>Finalizados</span> <span>{cargando ? '—' : resumen.finalizados}</span></div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default PanelPrincipal;
