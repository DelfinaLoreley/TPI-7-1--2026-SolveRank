import { useEffect, useState } from 'react';
import axios from '../../axiosApi';
import cuboBanner from '/src/assets/img-cubo-banner2.png';
import infoIcon from '/src/assets/icons/Info.png';
import TarjetaTorneo from './listado/TarjetaTorneo.jsx';
import './ListadoTorneo.css';
import './MisTorneos.css';

function fechaHoraLocal(fecha) {
    if (!fecha) return null;
    const valor = new Date(String(fecha).replace(' ', 'T'));
    return Number.isNaN(valor.getTime()) ? null : valor;
}

function MisTorneos({ usuario, seccionOrganizador, onVerTorneo, onVerTodosTorneos }) {
    const [proximos, setProximos] = useState([]);
    const [anteriores, setAnteriores] = useState([]);
    const [torneosOrganizador, setTorneosOrganizador] = useState([]);
    const [favoritos, setFavoritos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoOrganizador, setCargandoOrganizador] = useState(false);
    const [error, setError] = useState('');
    const [errorOrganizador, setErrorOrganizador] = useState('');
    const [errorFavoritos, setErrorFavoritos] = useState('');
    const [actualizando, setActualizando] = useState(() => new Set());
    const [ahora, setAhora] = useState(() => new Date());
    const urlBackend = axios.defaults.baseURL.replace(/\/api\/?$/, '');
    const favoritosIds = new Set(favoritos.map(({ idTorneo }) => String(idTorneo)));

    useEffect(() => {
        let activo = true;
        axios.get('/torneos/mi-actividad').then(({ data }) => {
            if (!activo) return;
            setProximos(data.torneosProximos ?? []);
            setAnteriores(data.torneosAnteriores ?? []);
        }).catch((err) => {
            if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar tus torneos.');
        }).finally(() => { if (activo) setCargando(false); });

        if (usuario?.rol === 'Organizador') {
            setCargandoOrganizador(true);
            axios.get('/torneos/mis-torneos').then(({ data }) => {
                if (!activo) return;
                setTorneosOrganizador(data.torneos ?? []);
                if ((data.torneos ?? []).some((torneo) => torneo.intentosRegistrados === undefined)) {
                    setErrorOrganizador('Actualizá el backend para consultar qué torneos todavía no tienen resultados.');
                }
            }).catch((err) => {
                if (activo) setErrorOrganizador(err?.response?.data?.mensaje || 'No se pudieron cargar tus torneos de organizador.');
            }).finally(() => { if (activo) setCargandoOrganizador(false); });
        } else {
            setTorneosOrganizador([]);
            setCargandoOrganizador(false);
            setErrorOrganizador('');
        }

        axios.get('/torneos/favoritos').then(({ data }) => {
            if (activo) setFavoritos(data.favoritos ?? []);
        }).catch((err) => {
            if (activo) setErrorFavoritos(err?.response?.data?.mensaje || 'No se pudieron cargar tus torneos guardados.');
        });
        return () => { activo = false; };
    }, [usuario?.idUsuario, usuario?.rol]);

    useEffect(() => {
        const intervalo = window.setInterval(() => setAhora(new Date()), 30_000);
        return () => window.clearInterval(intervalo);
    }, []);

    useEffect(() => {
        if (cargando || !seccionOrganizador) return undefined;
        const id = seccionOrganizador === 'en-vivo' ? 'mis-torneos-en-vivo' : 'mis-torneos-sin-resultados';
        const frame = window.requestAnimationFrame(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [cargando, seccionOrganizador]);

    const torneosEnVivo = torneosOrganizador.filter((torneo) => {
        const inicio = fechaHoraLocal(torneo.fecha_Inicio);
        const fin = fechaHoraLocal(torneo.fecha_fin);
        return inicio && fin && inicio <= ahora && ahora <= fin;
    });
    const torneosSinResultados = torneosOrganizador.filter((torneo) => Number(torneo.intentosRegistrados) === 0);

    async function alternarFavorito(torneo) {
        const id = String(torneo.idTorneo);
        const guardado = favoritosIds.has(id);
        setErrorFavoritos('');
        setActualizando((actuales) => new Set(actuales).add(id));
        try {
            if (guardado) {
                await axios.delete(`/torneos/favoritos/${id}`);
                setFavoritos((actuales) => actuales.filter((item) => String(item.idTorneo) !== id));
            } else {
                await axios.post(`/torneos/favoritos/${id}`);
                setFavoritos((actuales) => [...actuales, torneo]);
            }
        } catch (err) {
            setErrorFavoritos(err?.response?.data?.mensaje || 'No se pudo actualizar el torneo guardado.');
        } finally {
            setActualizando((actuales) => {
                const siguientes = new Set(actuales);
                siguientes.delete(id);
                return siguientes;
            });
        }
    }

    function renderCards(lista) {
        return lista.map((torneo) => (
            <TarjetaTorneo
                key={torneo.idTorneo}
                torneo={torneo}
                urlBackend={urlBackend}
                guardado={favoritosIds.has(String(torneo.idTorneo))}
                favoritoActualizando={actualizando.has(String(torneo.idTorneo))}
                onAlternarGuardado={() => alternarFavorito(torneo)}
                onVerTorneo={() => onVerTorneo?.(torneo)}
            />
        ));
    }

    return (
        <main className="mis-torneos-page">
            <header className="mis-torneos-hero" style={{ backgroundImage: `url(${cuboBanner})` }}>
                <h1>Mis torneos</h1>
                <p>Aquí se muestran sólo competencias que utilizan el sistema de registro de la WCA.</p>
            </header>

            <div className="mis-torneos-contenedor">
                <div className="mis-torneos-secciones">
                        {usuario?.rol === 'Organizador' && (
                            <>
                                <section className="mis-torneos-seccion" id="mis-torneos-en-vivo">
                                    <h2>MIS TORNEOS EN VIVO</h2>
                                    {cargandoOrganizador ? <p className="mis-torneos-mensaje" role="status">Cargando torneos…</p>
                                        : errorOrganizador ? <p className="mis-torneos-mensaje" role="alert">{errorOrganizador}</p>
                                        : torneosEnVivo.length ? <div className="listado-torneos-grid">{renderCards(torneosEnVivo)}</div>
                                            : <p className="mis-torneos-mensaje">No tienes torneos en vivo en este momento.</p>}
                                </section>

                                <section className="mis-torneos-seccion" id="mis-torneos-sin-resultados">
                                    <h2>Torneos sin resultados cargados</h2>
                                    {cargandoOrganizador ? <p className="mis-torneos-mensaje" role="status">Cargando torneos…</p>
                                        : errorOrganizador ? <p className="mis-torneos-mensaje" role="alert">{errorOrganizador}</p>
                                        : torneosSinResultados.length ? <div className="listado-torneos-grid">{renderCards(torneosSinResultados)}</div>
                                            : <p className="mis-torneos-mensaje">Todos tus torneos tienen resultados cargados.</p>}
                                </section>
                            </>
                        )}

                        <section className="mis-torneos-seccion">
                            <div className="mis-torneos-titulo">
                                <h2>Próximos torneos</h2>
                                {proximos.length > 0 && <button type="button" onClick={onVerTodosTorneos}>Ver todos ⟶</button>}
                            </div>
                            {error ? <p className="mis-torneos-mensaje" role="alert">{error}</p>
                                : cargando ? <p className="mis-torneos-mensaje" role="status">Cargando torneos…</p>
                                : proximos.length ? <div className="listado-torneos-grid">{renderCards(proximos)}</div>
                                    : <div className="mis-torneos-vacio mis-torneos-proximos-vacio">
                                        <img src={infoIcon} alt="" />
                                        <p>No tienes próximos torneos. Puedes buscar más en <button type="button" onClick={onVerTodosTorneos}>Lista de Torneos↗</button></p>
                                    </div>}
                        </section>

                        <section className="mis-torneos-seccion">
                            <h2>Torneos guardados</h2>
                            {errorFavoritos ? <p className="mis-torneos-mensaje" role="alert">{errorFavoritos}</p>
                                : favoritos.length ? <div className="listado-torneos-grid">{renderCards(favoritos)}</div>
                                    : <div className="mis-torneos-vacio">
                                        <img src={infoIcon} alt="" />
                                        <p>No has marcado ninguna competencia como favorita. Haz clic en el ícono de favorito de una tarjeta para verla aquí.</p>
                                    </div>}
                        </section>

                        <section className="mis-torneos-seccion">
                            <div className="mis-torneos-titulo">
                                <h2>Torneos anteriores</h2>
                                {anteriores.length > 0 && <button type="button" onClick={onVerTodosTorneos}>Ver todos ⟶</button>}
                            </div>
                            {error ? <p className="mis-torneos-mensaje" role="alert">{error}</p>
                                : cargando ? <p className="mis-torneos-mensaje" role="status">Cargando torneos…</p>
                                : anteriores.length ? <div className="listado-torneos-grid">{renderCards(anteriores)}</div>
                                    : <p className="mis-torneos-mensaje">Todavía no tienes torneos anteriores asociados a tu cuenta.</p>}
                        </section>
                </div>
            </div>
        </main>
    );
}

export default MisTorneos;
