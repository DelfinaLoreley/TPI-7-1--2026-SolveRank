import { useCallback, useEffect, useState } from 'react';
import axios from '../../axiosApi';
import { categorias as catalogoCategorias } from '../torneos/pasos/datosCategorias.js';
import avatarPredeterminado from '/src/assets/home/iconos/user-pfp-icon.png';
import './MiPerfil.css';

function formatearTiempo(valor) {
    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) return '—';
    const centesimas = Math.round(Number(valor) * 100);
    const minutos = Math.floor(centesimas / 6000);
    const resto = centesimas % 6000;
    const segundos = `${String(Math.floor(resto / 100)).padStart(2, '0')}.${String(resto % 100).padStart(2, '0')}`;
    return minutos ? `${minutos}:${segundos}` : segundos;
}

function fechaInput(fecha) {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const fechaLocal = new Date(fecha);
    return Number.isNaN(fechaLocal.getTime()) ? '' : fechaLocal.toISOString().slice(0, 10);
}

function fechaVisible(fecha) {
    const valor = fechaInput(fecha);
    if (!valor) return 'No informada';
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR');
}

function iconoCategoria(nombre) {
    const etiqueta = String(nombre || '').toLocaleLowerCase('es');
    return catalogoCategorias.find(({ id, etiqueta: nombreCatalogo }) =>
        String(id).toLocaleLowerCase('es') === etiqueta
        || String(nombreCatalogo).toLocaleLowerCase('es') === etiqueta
    )?.icono;
}

const formularioInicial = (perfil) => ({
    nombre: perfil?.nombre || '',
    apellido: perfil?.apellido || '',
    idPais: perfil?.idPais ? String(perfil.idPais) : '',
    idGenero: perfil?.idGenero ? String(perfil.idGenero) : '',
    fechaNacimiento: fechaInput(perfil?.fecha_Nacimiento),
    wcaid: perfil?.wcaid || '',
});

export default function MiPerfil({ idUsuario, publico = false, onVolver, onPerfilActualizado }) {
    const [datos, setDatos] = useState(null);
    const [paises, setPaises] = useState([]);
    const [generos, setGeneros] = useState([]);
    const [formulario, setFormulario] = useState({});
    const [cargando, setCargando] = useState(true);
    const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);

    const rutaPerfil = publico ? `/usuarios/perfil/${idUsuario}` : '/usuarios/mi-perfil';

    const cargarPerfil = useCallback(async () => {
        const { data } = await axios.get(rutaPerfil);
        setDatos(data);
        return data;
    }, [rutaPerfil]);

    useEffect(() => {
        let activo = true;
        axios.get(rutaPerfil)
            .then(({ data }) => { if (activo) setDatos(data); })
            .catch((err) => { if (activo) setError(err?.response?.data?.mensaje || 'No se pudo cargar tu perfil.'); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [rutaPerfil]);

    async function abrirEdicion() {
        setFormulario(formularioInicial(datos?.perfil));
        setError('');
        setMensaje('');
        setModalAbierto(true);
        if (paises.length && generos.length) return;
        setCargandoCatalogos(true);
        try {
            const [respuestaPaises, respuestaGeneros] = await Promise.all([axios.get('/paises'), axios.get('/generos')]);
            setPaises(respuestaPaises.data.paises ?? []);
            setGeneros(respuestaGeneros.data.generos ?? []);
        } catch (err) {
            setError(err?.response?.data?.mensaje || 'No se pudieron cargar los países y géneros.');
        } finally {
            setCargandoCatalogos(false);
        }
    }

    function cambiarCampo(evento) {
        setFormulario((actual) => ({ ...actual, [evento.target.name]: evento.target.value }));
    }

    async function guardarPerfil(evento) {
        evento.preventDefault();
        setError('');
        setMensaje('');
        if (formulario.fechaNacimiento && formulario.fechaNacimiento > new Date().toISOString().slice(0, 10)) {
            setError('La fecha de nacimiento no puede ser futura.');
            return;
        }
        setGuardando(true);
        try {
            await axios.put('/usuarios/mi-perfil', {
                ...formulario,
                idPais: Number(formulario.idPais),
                idGenero: Number(formulario.idGenero),
                wcaid: formulario.wcaid.trim().toUpperCase(),
            });
            await cargarPerfil();
            await onPerfilActualizado?.();
            setModalAbierto(false);
            setMensaje('Tu perfil se actualizó correctamente.');
        } catch (err) {
            setError(err?.response?.data?.mensaje || 'No se pudo guardar tu perfil.');
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) return <main className="mi-perfil-pagina"><p className="mi-perfil-estado">Cargando perfil…</p></main>;
    if (!datos) return <main className="mi-perfil-pagina"><p className="mi-perfil-estado" role="alert">{error || 'No se pudo cargar tu perfil.'}</p></main>;

    const { perfil, estadisticas, medallero, categorias } = datos;
    const avatar = perfil.avatar_url || avatarPredeterminado;

    return (
        <main className="mi-perfil-pagina">
            <div className="mi-perfil-contenedor">
                <div className="mi-perfil-columnas">
                    <section className="mi-perfil-principal">
                        <article className="mi-perfil-identidad">
                            <img className="mi-perfil-avatar" src={avatar} alt={`Foto de ${perfil.nombre}`} />
                            <div className="mi-perfil-identidad-datos">
                                <h1>{perfil.nombre} {perfil.apellido}</h1>
                                <p>WCA ID: {perfil.wcaid || 'No informado'}</p>
                                <span className="mi-perfil-rol">{perfil.rol}</span>
                            </div>
                            {!publico && <button className="mi-perfil-editar" type="button" onClick={abrirEdicion}>✎ <span>Editar perfil</span></button>}
                        </article>

                        <div className="mi-perfil-estadisticas">
                            <article><span className="mi-perfil-estadistica-icono oro" aria-hidden="true">♜</span><strong>{estadisticas.torneos}</strong><span>Torneos</span></article>
                            <article><span className="mi-perfil-estadistica-icono azul" aria-hidden="true">⬡</span><strong>{estadisticas.soluciones}</strong><span>Soluciones completadas</span></article>
                            <article><span className="mi-perfil-estadistica-icono violeta" aria-hidden="true">☆</span><strong>{estadisticas.podios}</strong><span>Veces en el podio</span></article>
                        </div>

                        <section className="mi-perfil-records">
                            <h2>Récords personales actuales</h2>
                            {error && !modalAbierto && <p className="mi-perfil-error" role="alert">{error}</p>}
                            {mensaje && <p className="mi-perfil-exito" role="status">{mensaje}</p>}
                            <div className="mi-perfil-tabla-scroll">
                                <table className="mi-perfil-tabla">
                                    <thead><tr>
                                        <th scope="col">Categoría</th>
                                        <th scope="col" title="Ranking nacional de single">NR</th>
                                        <th scope="col" title="Ranking mundial de single">WR</th>
                                        <th scope="col">Single</th>
                                        <th scope="col">Media</th>
                                        <th scope="col" title="Ranking nacional de media">NR</th>
                                        <th scope="col" title="Ranking mundial de media">WR</th>
                                    </tr></thead>
                                    <tbody>
                                        {categorias.length ? categorias.map((categoria) => {
                                            const icono = iconoCategoria(categoria.categoria);
                                            return <tr key={categoria.idCategoria}>
                                                <th scope="row" className="mi-perfil-categoria">{icono && <img src={icono} alt="" />}{categoria.categoria}</th>
                                                <td>{categoria.singleNR ?? '—'}</td>
                                                <td>{categoria.singleWR ?? '—'}</td>
                                                <td className="mi-perfil-tiempo">{formatearTiempo(categoria.single)}</td>
                                                <td className="mi-perfil-tiempo">{formatearTiempo(categoria.media)}</td>
                                                <td>{categoria.mediaNR ?? '—'}</td>
                                                <td>{categoria.mediaWR ?? '—'}</td>
                                            </tr>;
                                        }) : <tr><td colSpan="7" className="mi-perfil-vacio">Todavía no hay resultados de torneos finalizados para mostrar.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </section>

                    <aside className="mi-perfil-lateral">
                        <section className="mi-perfil-datos">
                            <h2>País representado</h2>
                            <p>{perfil.pais || 'No informado'}</p>
                            {!publico && <><h2>Fecha de nacimiento</h2><p>{fechaVisible(perfil.fecha_Nacimiento)}</p></>}
                            <h2>Categorías con resultados</h2>
                            <div className="mi-perfil-categorias" aria-label="Categorías donde tiene resultados">
                                {categorias.length ? categorias.map((categoria) => {
                                    const icono = iconoCategoria(categoria.categoria);
                                    return <span key={categoria.idCategoria} title={categoria.categoria}>{icono ? <img src={icono} alt={categoria.categoria} /> : categoria.categoria}</span>;
                                }) : <small>Aún no hay resultados registrados.</small>}
                            </div>
                            <h2>WCA ID</h2>
                            <p>{perfil.wcaid || 'No informado'}</p>
                        </section>

                        <section className="mi-perfil-medallero">
                            <h2>Medallero</h2>
                            <p className="oro"><span aria-hidden="true">♙</span> Oro: <strong>{medallero.oro}</strong></p>
                            <p className="plata"><span aria-hidden="true">♙</span> Plata: <strong>{medallero.plata}</strong></p>
                            <p className="bronce"><span aria-hidden="true">♙</span> Bronce: <strong>{medallero.bronce}</strong></p>
                        </section>
                    </aside>
                </div>
                {onVolver && <button className="mi-perfil-volver" type="button" onClick={onVolver}>← Volver al inicio</button>}
            </div>

            {modalAbierto && <div className="mi-perfil-modal-fondo" onMouseDown={(evento) => evento.target === evento.currentTarget && setModalAbierto(false)}>
                <section className="mi-perfil-modal" role="dialog" aria-modal="true" aria-labelledby="mi-perfil-modal-titulo">
                    <button className="mi-perfil-modal-cerrar" type="button" onClick={() => setModalAbierto(false)} aria-label="Cerrar">×</button>
                    <h2 id="mi-perfil-modal-titulo">Editar perfil</h2>
                    <p>Actualizá tus datos personales. El correo y el rol solo pueden modificarse desde sus opciones correspondientes.</p>
                    {error && <p className="mi-perfil-error" role="alert">{error}</p>}
                    {cargandoCatalogos ? <p>Cargando opciones…</p> : <form onSubmit={guardarPerfil}>
                        <label>Nombre<input name="nombre" value={formulario.nombre || ''} onChange={cambiarCampo} maxLength="50" required /></label>
                        <label>Apellido<input name="apellido" value={formulario.apellido || ''} onChange={cambiarCampo} maxLength="50" required /></label>
                        <label>País<select name="idPais" value={formulario.idPais || ''} onChange={cambiarCampo} required><option value="">Seleccioná tu país</option>{paises.map((pais) => <option key={pais.idPais} value={pais.idPais}>{pais.pais}</option>)}</select></label>
                        <label>Género<select name="idGenero" value={formulario.idGenero || ''} onChange={cambiarCampo} required><option value="">Seleccioná tu género</option>{generos.map((genero) => <option key={genero.id} value={genero.id}>{genero.genero}</option>)}</select></label>
                        <label>Fecha de nacimiento<input type="date" name="fechaNacimiento" value={formulario.fechaNacimiento || ''} onChange={cambiarCampo} max={new Date().toISOString().slice(0, 10)} /></label>
                        <label>WCA ID<input name="wcaid" value={formulario.wcaid || ''} onChange={cambiarCampo} maxLength="10" placeholder="2019WANY36" /></label>
                        <div className="mi-perfil-modal-acciones"><button type="button" onClick={() => setModalAbierto(false)}>Cancelar</button><button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button></div>
                    </form>}
                </section>
            </div>}
        </main>
    );
}
