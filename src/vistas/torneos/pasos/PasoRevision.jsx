import { useState } from 'react';
import { categoriasIcon, etiquetaCategoria } from './datosCategorias';
import iconoInfo from '/src/assets/torneos/info-general-icon.svg';
import iconoInscripcion from '/src/assets/torneos/periodo-inscripcion-azul-icon.svg';
import iconoLugar from '/src/assets/torneos/local-azul-icon.svg';
import iconoUbicacion from '/src/assets/torneos/ubicacion-azul-icon.svg';
import iconoRondas from '/src/assets/torneos/rondas-icon.svg';
import iconoFormato from '/src/assets/torneos/formato-icon.svg';
import iconoFecha from '/src/assets/home/iconos/Calendar.png';
import iconoContacto from '/src/assets/torneos/contacto-icon.svg';
import iconoOrganizador from '/src/assets/icons/organizador-azul-icon.svg';
import imagenPredeterminada from '/src/assets/home/cards-torneos/casa_de_la_cultura_ush.jpeg';

function obtenerNombre(lista, id, claveId, claveNombre) {
    return lista.find((item) => String(item[claveId]) === String(id))?.[claveNombre] || '';
}

function formatearFecha(valor) {
    if (!valor) return '—';
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
        ? valor
        : fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
}

function formatearRangoFechas(inicio, fin) {
    if (!inicio && !fin) return '—';
    if (!inicio) return formatearFecha(fin);
    if (!fin) return formatearFecha(inicio);
    return `${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
}

export function PasoRevision({ formulario, cronograma, catalogo = [], catalogos = {}, imagenVistaPrevia }) {
    const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false);
    const pais = obtenerNombre(catalogos.paises || [], formulario.pais, 'idPais', 'pais');
    const provincia = obtenerNombre(catalogos.provincias || [], formulario.provincia, 'idProvincia', 'provincia');
    const ciudad = obtenerNombre(catalogos.ciudades || [], formulario.ciudad, 'idCiudad', 'ciudad');
    const ubicacion = [ciudad, provincia, pais].filter(Boolean).join(', ') || 'Sin completar';
    const categorias = formulario.categorias.map((id) => ({
        id,
        etiqueta: etiquetaCategoria(id, catalogo),
        icono: catalogo.find((categoria) => String(categoria.id) === String(id))?.icono,
        configuracion: formulario.rondas[id] || {}
    }));
    const categoriasVisibles = mostrarTodasCategorias ? categorias : categorias.slice(0, 6);
    const jueces = (formulario.juecesSeleccionados || []).map((id) =>
        obtenerNombre(catalogos.jueces || [], id, 'idUsuario', 'nombreCompleto')
        || [catalogos.jueces?.find((persona) => String(persona.idUsuario) === String(id))?.nombre,
            catalogos.jueces?.find((persona) => String(persona.idUsuario) === String(id))?.apellido].filter(Boolean).join(' ')
    ).filter(Boolean);
    const delegados = (formulario.delegadosSeleccionados || []).map((id) => {
        const persona = catalogos.delegados?.find((item) => String(item.idUsuario) === String(id));
        return [persona?.nombre, persona?.apellido].filter(Boolean).join(' ');
    }).filter(Boolean);

    return (
        <div className="creacion-revision-vista">
            <div className="creacion-seccion-intro">
                <h2><img src={iconoInfo} alt="" /> Confirmar</h2>
                <p>Vista previa de tu torneo.</p>
            </div>

            <div className="revision-resumen-superior">
                <section className="revision-resumen-torneo" aria-label="Resumen del torneo">
                    <img className="revision-imagen-torneo" src={imagenVistaPrevia || imagenPredeterminada} alt="Sede del torneo" />
                    <div className="revision-identidad-torneo">
                        <h3>{formulario.nombre || 'Torneo sin nombre'}</h3>
                        <p><img src={iconoFecha} alt="" />{formatearRangoFechas(formulario.fechaInicio, formulario.fechaFin)}</p>
                        <p><img src={iconoUbicacion} alt="" />{ubicacion}</p>
                        <p><img src={iconoOrganizador} alt="" />{formulario.organizador || 'Organizador pendiente'}</p>
                    </div>
                </section>
                <section className="revision-estadisticas" aria-label="Resumen de categorías e inscripciones">
                    <div>
                        <img src={categoriasIcon} alt="" />
                        <span>Categorías</span>
                        <strong>{categorias.length}</strong>
                    </div>
                    <div>
                        <img src={iconoInscripcion} alt="" />
                        <span>Límite de competidores</span>
                        <strong>{formulario.cupoMaximo || '—'}</strong>
                    </div>
                </section>
            </div>

            <section className="revision-seccion">
                <h3><img src={iconoInfo} alt="" /> Información general</h3>
                <div className="revision-datos-grid">
                    <div className="revision-dato">
                        <img src={iconoFecha} alt="" />
                        <div><span>Fecha</span><strong>{formatearRangoFechas(formulario.fechaInicio, formulario.fechaFin)}</strong></div>
                    </div>
                    <div className="revision-dato">
                        <img src={iconoContacto} alt="" />
                        <div><span>Contacto</span><strong>{formulario.contacto || 'Sin completar'}</strong></div>
                    </div>
                    <div className="revision-dato">
                        <img src={iconoUbicacion} alt="" />
                        <div><span>Ciudad</span><strong>{ubicacion}</strong></div>
                    </div>
                    <div className="revision-dato">
                        <img src={iconoOrganizador} alt="" />
                        <div><span>Organizador principal</span><strong>{formulario.organizador || 'Sin completar'}</strong></div>
                    </div>
                    <div className="revision-dato">
                        <img src={iconoInscripcion} alt="" />
                        <div><span>Inscripciones</span><strong>{formatearRangoFechas(formulario.aperturaInscripcion, formulario.cierreInscripcion)}</strong></div>
                    </div>
                    <div className="revision-dato">
                        <img src={iconoLugar} alt="" />
                        <div><span>Lugar</span><strong>{formulario.sede || 'Sin completar'}</strong></div>
                    </div>
                </div>
                {formulario.descripcion && <p className="revision-descripcion">{formulario.descripcion}</p>}
            </section>

            {jueces.length > 0 && (
                <section className="revision-seccion revision-personas">
                    <h3><img src={iconoOrganizador} alt="" /> Jueces del torneo</h3>
                    <p>{jueces.join(', ')}</p>
                </section>
            )}

            {delegados.length > 0 && (
                <section className="revision-seccion revision-personas">
                    <h3><img src={iconoOrganizador} alt="" /> Delegados de la WCA</h3>
                    <p>{delegados.join(', ')}</p>
                </section>
            )}

            <section className="revision-seccion">
                <h3><img src={categoriasIcon} alt="" /> Categorías</h3>
                {categorias.length ? (
                    <>
                        <div className="revision-categorias">
                            {categoriasVisibles.map(({ id, etiqueta, icono, configuracion }) => {
                                const cantidad = Math.max(1, Number(configuracion.cantidad) || 3);
                                const limite = configuracion.rondas?.final?.limite
                                    || configuracion.rondas?.[String(cantidad)]?.limite
                                    || configuracion.rondas?.['1']?.limite
                                    || '—';
                                return (
                                    <article className="revision-categoria" key={id}>
                                        <span className="revision-categoria-icono"><img src={icono || categoriasIcon} alt="" /></span>
                                        <div>
                                            <strong>{etiqueta}</strong>
                                            <span> Formato: {configuracion.formato || 'Ao5'}</span>
                                            <span> Rondas: {cantidad} + Final</span>
                                            <span> Tiempo límite: {limite}</span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        {categorias.length > 6 && (
                            <button className="revision-mostrar-categorias" type="button" onClick={() => setMostrarTodasCategorias((actual) => !actual)}>
                                {mostrarTodasCategorias ? 'Mostrar menos ↑' : 'Mostrar más ↓'}
                            </button>
                        )}
                    </>
                ) : <p className="revision-vacio">No hay categorías seleccionadas.</p>}
            </section>

            <section className="revision-seccion">
                <h3><img src={iconoLugar} alt="" /> Lugar</h3>
                <p className="revision-lugar-nombre">{formulario.sede || 'Lugar pendiente'}</p>
                <p className="revision-direccion">{[formulario.direccion, ubicacion].filter(Boolean).join(', ')}</p>
            </section>

            <section className="revision-seccion revision-cronograma">
                <h3><img src={iconoFecha} alt="" /> Cronograma</h3>
                {cronograma.length ? (
                    <div className="revision-tabla-contenedor">
                        <table>
                            <thead><tr><th>Comienzo</th><th>Fin</th><th>Actividad</th></tr></thead>
                            <tbody>
                                {cronograma.map((actividad) => (
                                    <tr key={actividad.id}>
                                        <td>{actividad.comienzo}</td>
                                        <td>{actividad.fin}</td>
                                        <td>{actividad.icono && <img src={actividad.icono} alt="" />}{actividad.nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="revision-vacio">Completá la fecha de inicio y seleccioná categorías para generar el cronograma.</p>}
            </section>
        </div>
    );
}
