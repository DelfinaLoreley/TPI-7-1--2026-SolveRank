import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';
import { categorias as catalogoCategorias } from '../torneos/pasos/datosCategorias.js';
import './Records.css';

import cuboBanner from '/src/assets/img-cubo-banner.png';
import competidoresIcon from '/src/assets/home/iconos/competidores-violeta-icon.png';
import paisesIcon from '/src/assets/home/iconos/paises-cuberos-azul-icon.png';
import categoriasIcon from '/src/assets/icons/categorias-amarillo-icon.svg';
import resultadosIcon from '/src/assets/home/iconos/resultados-verde-icon.png';
import lupaIcon from '/src/assets/icons/search-icon.png';
import lineaDecorativaIzq from '/src/assets/icons/linea-izq-decorativa.svg';
import lineaDecorativaDer from '/src/assets/icons/linea-der-decorativa.svg';
import rankingIco from '/src/assets/icons/rankings-icon-azul.svg';
import estadisticasIcon from '/src/assets/icons/estadisticas-icon.svg';
import actualizarIcon from '/src/assets/icons/ult-actualizacion-icon.svg';

const iconosEstadisticas = [
    { key: 'competidores', label: 'Competidores', icon: competidoresIcon, color: 'violeta' },
    { key: 'paises', label: 'Países representados', icon: paisesIcon, color: 'azul' },
    { key: 'categorias', label: 'Categorías', icon: categoriasIcon, color: 'dorado' },
    { key: 'resultadosRegistrados', label: 'Resultados registrados', icon: resultadosIcon, color: 'verde' },
];

function formatearTiempo(centesimas) {
    if (!Number.isFinite(Number(centesimas))) return '—';
    const total = Math.round(Number(centesimas));
    const minutos = Math.floor(total / 6000);
    const resto = total % 6000;
    const segundos = `${String(Math.floor(resto / 100)).padStart(2, '0')}.${String(resto % 100).padStart(2, '0')}`;
    return minutos ? `${String(minutos).padStart(2, '0')}:${segundos}` : segundos;
}

function obtenerIconoCategoria(nombre) {
    const etiqueta = String(nombre || '').toLocaleLowerCase('es');
    return catalogoCategorias.find(({ id, etiqueta: nombreCatalogo }) =>
        String(id).toLocaleLowerCase('es') === etiqueta
        || String(nombreCatalogo).toLocaleLowerCase('es') === etiqueta
    )?.icono;
}

function formatearFecha(fecha) {
    if (!fecha) return '—';
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Records() {
    const [paises, setPaises] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [generos, setGeneros] = useState([]);
    const [busquedaPais, setBusquedaPais] = useState('');
    const [idPais, setIdPais] = useState('');
    const [idCategoria, setIdCategoria] = useState('');
    const [idGenero, setIdGenero] = useState('');
    const [datos, setDatos] = useState(null);
    const [actualizado, setActualizado] = useState(null);
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;
        Promise.all([axios.get('/paises'), axios.get('/torneos/categorias'), axios.get('/generos')])
            .then(([respuestaPaises, respuestaCategorias, respuestaGeneros]) => {
                if (!activo) return;
                setPaises(respuestaPaises.data.paises ?? []);
                setCategorias(respuestaCategorias.data.categorias ?? []);
                setGeneros(respuestaGeneros.data.generos ?? []);
            })
            .catch((err) => { if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar los filtros.'); })
            .finally(() => { if (activo) setCargandoCatalogos(false); });
        return () => { activo = false; };
    }, []);

    useEffect(() => {
        if (cargandoCatalogos) return undefined;
        let activo = true;
        setCargando(true);
        setError('');
        const parametros = new URLSearchParams();
        if (idPais) parametros.set('idPais', idPais);
        if (idCategoria) parametros.set('idCategoria', idCategoria);
        if (idGenero) parametros.set('idGenero', idGenero);
        axios.get(`/torneos/records?${parametros.toString()}`)
            .then(({ data }) => {
                if (!activo) return;
                setDatos(data);
                setActualizado(new Date());
            })
            .catch((err) => { if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar los récords.'); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [idPais, idCategoria, idGenero, cargandoCatalogos]);

    const paisesFiltrados = useMemo(() => {
        const texto = busquedaPais.trim().toLocaleLowerCase('es');
        return texto ? paises.filter(({ pais }) => String(pais).toLocaleLowerCase('es').includes(texto)) : paises;
    }, [paises, busquedaPais]);
    const categoriaSeleccionada = categorias.find(({ idCategoria: id }) => String(id) === idCategoria);
    const iconoCategoria = obtenerIconoCategoria(categoriaSeleccionada?.categoria);
    const records = datos?.records ?? [];
    const estadisticas = datos?.estadisticas ?? {};

    return (
        <main className="records-page">
            <div className="records-contenedor">
                <header className="records-hero" style={{ backgroundImage: `url(${cuboBanner})` }}>
                    <h1>RÉCORDS</h1>
                    <p>Explorá los récords mundiales y nacionales de cada categoría del speedcubing.</p>
                </header>

                <section className="records-panel" aria-label="Récords de speedcubing">
                    <div className="records-filtros">
                        <label className="records-buscar-pais">
                            <span aria-hidden="true"><img src={lupaIcon} alt="" /></span>
                            <input type="search" value={busquedaPais} onChange={(evento) => setBusquedaPais(evento.target.value)} placeholder="Buscar el país..." aria-label="Buscar país" />
                        </label>
                        <div className="records-selectores">
                            <label><span className="sr-only">País</span>
                                <select value={idPais} onChange={(evento) => setIdPais(evento.target.value)}>
                                    <option value="">Todos los países</option>
                                    {paisesFiltrados.map((pais) => <option key={pais.idPais} value={pais.idPais}>{pais.pais}</option>)}
                                </select>
                            </label>
                            <label className="records-select-categoria" style={{ '--records-icono-categoria': iconoCategoria ? `url("${iconoCategoria}")` : 'none' }}><span className="sr-only">Categoría</span>
                                <select value={idCategoria} onChange={(evento) => setIdCategoria(evento.target.value)}>
                                    <option value="">Todas</option>
                                    {categorias.map((categoria) => <option key={categoria.idCategoria} value={categoria.idCategoria}>{categoria.categoria}</option>)}
                                </select>
                            </label>
                            <label><span className="sr-only">Género</span>
                                <select value={idGenero} onChange={(evento) => setIdGenero(evento.target.value)}>
                                    <option value="">Ambos géneros</option>
                                    {generos.map((genero) => <option key={genero.id} value={genero.id}>{genero.genero}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>

                    {cargandoCatalogos ? <p className="records-mensaje">Cargando filtros…</p> : (
                        <div className="records-layout">
                            <div className="records-data-panel">
                                <section className="records-tabla-panel">
                                    <h2><span aria-hidden="true"><img src={rankingIco} alt="" /></span>Tabla de récords actuales</h2>
                                    {error && <p className="records-mensaje" role="alert">{error}</p>}
                                    {!error && cargando && <p className="records-mensaje" role="status">Cargando récords…</p>}
                                    {!error && !cargando && records.map((categoria) => {
                                        const icono = obtenerIconoCategoria(categoria.categoria);
                                        return (
                                            <section className="records-categoria" key={categoria.idCategoria}>
                                                <h3><span className="records-decoracion" aria-hidden="true"><img src={lineaDecorativaIzq}/></span>{icono && <img className="categoria-icono" src={icono} alt="" />}{categoria.categoria}<span className="records-decoracion" aria-hidden="true"><img src={lineaDecorativaDer}/></span></h3>
                                                <div className="records-tabla-scroll">
                                                    <table className="records-tabla">
                                                        <thead><tr><th>Tipo</th><th>Nombre</th><th>Fecha</th><th>País</th><th>Resultado</th></tr></thead>
                                                        <tbody>
                                                            {['single', 'media'].map((tipo) => {
                                                                const record = categoria[tipo];
                                                                return <tr key={tipo}>
                                                                    <th scope="row">{tipo === 'single' ? 'Single' : 'Media'}</th>
                                                                    <td className="records-nombre">{record?.nombre || '—'}</td>
                                                                    <td>{formatearFecha(record?.fechaTorneo)}</td>
                                                                    <td>{record?.pais || '—'}</td>
                                                                    <td className="records-tiempo">{record ? formatearTiempo(record.valor) : '—'}</td>
                                                                </tr>;
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </section>
                                        );
                                    })}
                                    {!error && !cargando && records.length === 0 && <p className="records-mensaje">No hay categorías para mostrar.</p>}
                                </section>

                                <section className="records-estadisticas">
                                    <h2><span aria-hidden="true"><img src={estadisticasIcon} alt="" /></span>Estadísticas globales</h2>
                                    {iconosEstadisticas.map((item) => <article className="records-estadistica" key={item.key}>
                                        <span className={`records-estadistica-icono ${item.color}`}><img src={item.icon} alt="" /></span>
                                        <div><strong>{Number(estadisticas[item.key] || 0).toLocaleString('es-AR')}</strong><span>{item.label}</span></div>
                                    </article>)}
                                </section>
                            </div>
                            <aside className="records-lateral">
                                <section className="records-actualizacion">
                                    <h2><span aria-hidden="true"><img src={actualizarIcon} /></span>Última actualización:</h2>
                                    <p>{actualizado ? actualizado.toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                </section>
                            </aside>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Records;
