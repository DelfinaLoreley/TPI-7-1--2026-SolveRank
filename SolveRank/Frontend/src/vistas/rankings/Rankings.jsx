import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';
import { categorias as catalogoCategorias } from '../torneos/pasos/datosCategorias.js';
import './Rankings.css';

import cuboBanner from '/src/assets/img-cubo-banner.png';
import competidoresIcon from '/src/assets/home/iconos/competidores-violeta-icon.png';
import paisesIcon from '/src/assets/home/iconos/paises-cuberos-azul-icon.png';
import categoriasIcon from '/src/assets/icons/categorias-amarillo-icon.svg';
import resultadosIcon from '/src/assets/home/iconos/resultados-verde-icon.png';
import usuarioIcon from '/src/assets/home/iconos/user-pfp-icon.png';
import rankingIco from '/src/assets/icons/rankings-icon-azul.svg';
import estadisticasIcon from '/src/assets/icons/estadisticas-icon.svg';
import actualizacionIcon from '/src/assets/icons/ult-actualizacion-icon.svg';
import paginaAnteriorIcon from '/src/assets/icons/triflecha-izq-icon.png';
import paginaSiguienteIcon from '/src/assets/icons/triflecha-der-icon.png';
import lupaIcono from '/src/assets/icons/search-icon.png';

function formatearTiempo(segundos) {
    if (segundos === null || segundos === undefined || !Number.isFinite(Number(segundos))) return 'DNF';
    const centesimas = Math.round(Number(segundos) * 100);
    const minutos = Math.floor(centesimas / 6000);
    const resto = centesimas % 6000;
    const texto = `${String(Math.floor(resto / 100)).padStart(2, '0')}.${String(resto % 100).padStart(2, '0')}`;
    return minutos ? `${String(minutos).padStart(2, '0')}:${texto}` : texto;
}

function obtenerIconoCategoria(nombre) {
    const etiqueta = String(nombre || '').toLocaleLowerCase('es');
    return catalogoCategorias.find(({ id, etiqueta: nombreCatalogo }) =>
        String(id).toLocaleLowerCase('es') === etiqueta
        || String(nombreCatalogo).toLocaleLowerCase('es') === etiqueta
    )?.icono;
}

const iconosEstadisticas = [
    { key: 'competidores', label: 'Competidores', icon: competidoresIcon, className: 'violeta' },
    { key: 'paises', label: 'Países representados', icon: paisesIcon, className: 'azul' },
    { key: 'categorias', label: 'Categorías', icon: categoriasIcon, className: 'dorado' },
    { key: 'resultadosRegistrados', label: 'Resultados registrados', icon: resultadosIcon, className: 'verde' },
];

function Rankings({ usuario }) {
    const [paises, setPaises] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [generos, setGeneros] = useState([]);
    const [busquedaPais, setBusquedaPais] = useState('');
    const [idPais, setIdPais] = useState('');
    const [idCategoria, setIdCategoria] = useState('');
    const [idGenero, setIdGenero] = useState('');
    const [tipo, setTipo] = useState('media');
    const [pagina, setPagina] = useState(1);
    const [datos, setDatos] = useState(null);
    const [actualizado, setActualizado] = useState(null);
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [errorCatalogos, setErrorCatalogos] = useState('');

    useEffect(() => {
        let activo = true;
        Promise.all([
            axios.get('/paises'),
            axios.get('/torneos/categorias'),
            axios.get('/generos'),
        ]).then(([respuestaPaises, respuestaCategorias, respuestaGeneros]) => {
            if (!activo) return;
            const listaPaises = respuestaPaises.data.paises ?? [];
            const listaCategorias = respuestaCategorias.data.categorias ?? [];
            setPaises(listaPaises);
            setCategorias(listaCategorias);
            setGeneros(respuestaGeneros.data.generos ?? []);
            if (listaCategorias.length) setIdCategoria(String(listaCategorias[0].idCategoria));
        }).catch((err) => {
            if (activo) setErrorCatalogos(err?.response?.data?.mensaje || 'No se pudieron cargar los filtros.');
        }).finally(() => { if (activo) setCargandoCatalogos(false); });
        return () => { activo = false; };
    }, []);

    useEffect(() => {
        if (!idCategoria) return undefined;
        let activo = true;
        setCargando(true);
        setError('');
        const parametros = new URLSearchParams({ idCategoria, tipo, pagina: String(pagina) });
        if (idPais) parametros.set('idPais', idPais);
        if (idGenero) parametros.set('idGenero', idGenero);
        if (usuario?.idUsuario) parametros.set('idUsuario', String(usuario.idUsuario));
        axios.get(`/torneos/rankings?${parametros.toString()}`)
            .then(({ data }) => {
                if (!activo) return;
                setDatos(data);
                setActualizado(new Date());
            }).catch((err) => {
                if (activo) setError(err?.response?.data?.mensaje || 'No se pudo cargar el ranking.');
            }).finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [idCategoria, idPais, idGenero, tipo, pagina, usuario?.idUsuario]);

    const paisesFiltrados = useMemo(() => {
        const texto = busquedaPais.trim().toLocaleLowerCase('es');
        return texto ? paises.filter(({ pais }) => String(pais).toLocaleLowerCase('es').includes(texto)) : paises;
    }, [paises, busquedaPais]);

    const categoriaSeleccionada = categorias.find(({ idCategoria: id }) => String(id) === idCategoria);
    const nombreCategoria = categoriaSeleccionada?.categoria || 'Categoría';
    const iconoCategoria = obtenerIconoCategoria(nombreCategoria);
    const nombreTipo = tipo === 'single' ? 'Single' : 'Media';
    const tituloRanking = `${idPais ? 'Ranking nacional' : 'Ranking mundial'}: ${nombreTipo} - ${nombreCategoria}`;
    const estadisticas = datos?.estadisticas || {};
    const resultados = datos?.resultados || [];
    const paginaActual = datos?.pagina || pagina;
    const paginas = datos?.paginas || 1;

    function cambiarFiltro(setter, valor) {
        setter(valor);
        setPagina(1);
    }

    return (
        <main className="rankings-page">
            <div className="rankings-contenedor">
                <header className="rankings-hero" style={{ backgroundImage: `url(${cuboBanner})` }}>
                    <h1>RANKINGS</h1>
                    <p>Explorá los rankings nacionales y globales de cada categoría del speedcubing. Seleccioná una categoría y aplicá los filtros para ver la clasificación que quieras.</p>
                </header>

                <section className="rankings-panel" aria-label="Rankings de competidores">
                    <div className="rankings-filtros">
                        <label className="rankings-buscar-pais">
                            <span className="rankings-lupa" aria-hidden="true"><img src={lupaIcono} alt=""/></span>
                            <input
                                type="search"
                                value={busquedaPais}
                                onChange={(evento) => setBusquedaPais(evento.target.value)}
                                placeholder="Buscar el país..."
                                aria-label="Buscar país"
                            />
                        </label>
                        <div className="rankings-selectores">
                            <label>
                                <span className="sr-only">País</span>
                                <select value={idPais} onChange={(evento) => cambiarFiltro(setIdPais, evento.target.value)}>
                                    <option value="">Todos los países</option>
                                    {paisesFiltrados.map((pais) => <option key={pais.idPais} value={pais.idPais}>{pais.pais}</option>)}
                                </select>
                            </label>
                            <label className="rankings-select-categoria" style={{ '--rankings-icono-categoria': iconoCategoria ? `url("${iconoCategoria}")` : 'none' }}>
                                <span className="sr-only">Categoría</span>
                                <select value={idCategoria} onChange={(evento) => cambiarFiltro(setIdCategoria, evento.target.value)}>
                                    {categorias.map((categoria) => <option key={categoria.idCategoria} value={categoria.idCategoria}>{categoria.categoria}</option>)}
                                </select>
                            </label>
                            <label>
                                <span className="sr-only">Género</span>
                                <select value={idGenero} onChange={(evento) => cambiarFiltro(setIdGenero, evento.target.value)}>
                                    <option value="">Ambos géneros</option>
                                    {generos.map((genero) => <option key={genero.id} value={genero.id}>{genero.genero}</option>)}
                                </select>
                            </label>
                            <label>
                                <span className="sr-only">Tipo de ranking</span>
                                <select value={tipo} onChange={(evento) => cambiarFiltro(setTipo, evento.target.value)}>
                                    <option value="media">Media</option>
                                    <option value="single">Single</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    {errorCatalogos ? <p className="rankings-mensaje" role="alert">{errorCatalogos}</p>
                        : cargandoCatalogos ? <p className="rankings-mensaje" role="status">Cargando filtros…</p>
                            : <div className="rankings-layout">
                                <section className="rankings-tabla-panel">
                                    <h2><span aria-hidden="true"><img src={rankingIco} alt="" /></span>{tituloRanking}</h2> 
                                    {error ? <p className="rankings-mensaje" role="alert">{error}</p> : (
                                        <>
                                            <div className="rankings-tabla-scroll">
                                                <table className="rankings-tabla">
                                                    <thead><tr><th>Top</th><th>Nombre</th><th>País representado</th><th>{nombreTipo}</th></tr></thead>
                                                    <tbody>
                                                        {cargando ? <tr><td colSpan="4">Cargando ranking…</td></tr>
                                                            : resultados.length ? resultados.map((competidor) => (
                                                                <tr key={competidor.idUsuario}>
                                                                    <td className={`rankings-puesto puesto-${competidor.puesto}`}>{competidor.puesto}</td>
                                                                    <td className="rankings-nombre">{competidor.nombre}</td>
                                                                    <td>{competidor.pais || '—'}</td>
                                                                    <td className="rankings-tiempo">{competidor.dnf ? 'DNF' : formatearTiempo(competidor.valor)}</td>
                                                                </tr>
                                                            )) : <tr><td colSpan="4">No hay resultados para los filtros seleccionados.</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <footer className="rankings-paginacion">
                                                <span>Mostrando {resultados.length} de {datos?.total || 0} competidores</span>
                                                <div>
                                                    <button type="button" aria-label="Página anterior" disabled={paginaActual <= 1 || cargando} onClick={() => setPagina(paginaActual - 1)}><img src={paginaAnteriorIcon} alt="" /></button>
                                                    <span>{paginaActual}</span>
                                                    <button type="button" aria-label="Página siguiente" disabled={paginaActual >= paginas || cargando} onClick={() => setPagina(paginaActual + 1)}><img src={paginaSiguienteIcon} alt="" /></button>
                                                </div>
                                            </footer>
                                        </>
                                    )}
                                </section>

                                <aside className="rankings-lateral">
                                    <section className="rankings-estadisticas">
                                        <h2><span aria-hidden="true"><img src={estadisticasIcon} alt="" /></span>Estadísticas globales</h2>
                                        {iconosEstadisticas.map((item) => (
                                            <article className="rankings-estadistica" key={item.key}>
                                                <span className={`rankings-estadistica-icono ${item.className}`}><img src={item.icon} alt="" /></span>
                                                <div><strong>{Number(estadisticas[item.key] || 0).toLocaleString('es-AR')}</strong><span>{item.label}</span></div>
                                            </article>
                                        ))}
                                    </section>

                                    {usuario && <section className="rankings-tu-posicion">
                                        <h2><img src={usuarioIcon} alt="" />Tu posición</h2>
                                        <h3>{iconoCategoria && <img src={iconoCategoria} alt="" />}Categoría: {nombreCategoria}</h3>
                                        <div className="rankings-mi-resumen">
                                            {datos?.posicionUsuario
                                                ? <><strong>#{datos.posicionUsuario}</strong><span>{nombreTipo} · {idPais ? paises.find((pais) => String(pais.idPais) === idPais)?.pais : 'Mundial'}</span></>
                                                : <span>Sin posición con los filtros seleccionados</span>}
                                        </div>
                                    </section>}

                                    <section className="rankings-actualizacion">
                                        <h2><span aria-hidden="true"><img src={actualizacionIcon} alt="" /></span>Última actualización:</h2>
                                        <p>{actualizado ? actualizado.toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                    </section>
                                </aside>
                            </div>}
                </section>
            </div>
        </main>
    );
}

export default Rankings;
