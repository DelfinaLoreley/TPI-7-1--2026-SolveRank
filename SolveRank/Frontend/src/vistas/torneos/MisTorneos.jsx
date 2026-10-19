import { useEffect, useState } from 'react';
import axios from '../../axiosApi';
import cuboBanner from '/src/assets/img-cubo-banner.png';
import infoIcon from '/src/assets/home/iconos/resultados-azul-icon.png';
import TarjetaTorneo from './listado/TarjetaTorneo.jsx';
import './ListadoTorneo.css';
import './MisTorneos.css';

function MisTorneos({ usuario, onVerTorneo, onVerTodosTorneos }) {
    const [proximos, setProximos] = useState([]);
    const [anteriores, setAnteriores] = useState([]);
    const [favoritos, setFavoritos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [errorFavoritos, setErrorFavoritos] = useState('');
    const [actualizando, setActualizando] = useState(() => new Set());
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
        axios.get('/torneos/favoritos').then(({ data }) => {
            if (activo) setFavoritos(data.favoritos ?? []);
        }).catch((err) => {
            if (activo) setErrorFavoritos(err?.response?.data?.mensaje || 'No se pudieron cargar tus torneos guardados.');
        });
        return () => { activo = false; };
    }, [usuario?.idUsuario]);

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
            <div className="mis-torneos-contenedor">
                <header className="mis-torneos-hero" style={{ backgroundImage: `url(${cuboBanner})` }}>
                    <h1>Mis torneos</h1>
                    <p>Aquí se muestran sólo competencias que utilizan el sistema de registro de la WCA.</p>
                </header>

                {error ? <p className="mis-torneos-mensaje" role="alert">{error}</p> : (
                    <div className="mis-torneos-secciones">
                        <section className="mis-torneos-seccion">
                            <div className="mis-torneos-titulo">
                                <h2>Próximos torneos</h2>
                                {proximos.length > 0 && <button type="button" onClick={onVerTodosTorneos}>Ver todos ⟶</button>}
                            </div>
                            {cargando ? <p className="mis-torneos-mensaje" role="status">Cargando torneos…</p>
                                : proximos.length ? <div className="listado-torneos-grid">{renderCards(proximos)}</div>
                                    : <p className="mis-torneos-mensaje">Todavía no tienes próximos torneos asociados a tu cuenta.</p>}
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
                            {cargando ? <p className="mis-torneos-mensaje" role="status">Cargando torneos…</p>
                                : anteriores.length ? <div className="listado-torneos-grid">{renderCards(anteriores)}</div>
                                    : <p className="mis-torneos-mensaje">Todavía no tienes torneos anteriores asociados a tu cuenta.</p>}
                        </section>
                    </div>
                )}
            </div>
        </main>
    );
}

export default MisTorneos;
