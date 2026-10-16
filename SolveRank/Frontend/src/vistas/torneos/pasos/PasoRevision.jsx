import { etiquetaCategoria } from './datosCategorias';

export function PasoRevision({ formulario, cronograma }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <h2>Confirmar</h2>
                <p>Confirmá que la información esté completa antes de continuar.</p>
            </div>

            <div className="creacion-revision">
                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo">
                        <h3>Información general</h3>
                    </div>
                    <dl className="creacion-resumen-grid">
                        <div><dt>Nombre</dt><dd>{formulario.nombre || 'Sin completar'}</dd></div>
                        <div><dt>Fechas</dt><dd>{formulario.fechaInicio || '—'} al {formulario.fechaFin || '—'}</dd></div>
                        <div>
                            <dt>Ubicación</dt>
                            <dd>{[
                                formulario.sede,
                                formulario.direccion,
                                formulario.ciudad,
                                formulario.provincia,
                                formulario.pais
                            ].filter(Boolean).join(', ') || 'Sin completar'}</dd>
                        </div>
                        <div><dt>Organizador</dt><dd>{formulario.organizador || 'Sin completar'}</dd></div>
                        <div><dt>Contacto</dt><dd>{formulario.contacto || 'Sin completar'}</dd></div>
                        <div><dt>Cupo</dt><dd>{formulario.cupoMaximo || '—'} competidores</dd></div>
                    </dl>
                    {(formulario.juecesSeleccionados.length > 0 || formulario.delegadosSeleccionados.length > 0) && (
                        <p className="creacion-resumen-descripcion">
                            Jueces: {formulario.juecesSeleccionados.join(', ') || '—'} ·
                            Delegados WCA: {formulario.delegadosSeleccionados.join(', ') || '—'}
                        </p>
                    )}
                    {formulario.descripcion && (
                        <p className="creacion-resumen-descripcion">{formulario.descripcion}</p>
                    )}
                </section>

                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo">
                        <h3>Categorías</h3>
                        <span>{formulario.categorias.length} seleccionadas</span>
                    </div>
                    <div className="creacion-chips">
                        {formulario.categorias.length
                            ? formulario.categorias.map((categoria) => (
                                <span className="creacion-chip" key={categoria}>
                                    {etiquetaCategoria(categoria)}
                                </span>
                            ))
                            : <span className="creacion-resumen-vacio">Sin categorías seleccionadas</span>}
                    </div>
                </section>

                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo"><h3>Rondas</h3></div>
                    <ul className="creacion-resumen-actividades">
                        {formulario.categorias.map((categoria) => (
                            <li key={`ronda-${categoria}`}>
                                <span>{etiquetaCategoria(categoria)}</span>
                                <span>{formulario.rondas[categoria]?.cantidad || 3} rondas</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo">
                        <h3>Cronograma</h3>
                        <span>{cronograma.length} actividades</span>
                    </div>
                    <ul className="creacion-resumen-actividades">
                        {cronograma.map((actividad) => (
                            <li key={actividad.id}>
                                <span>{actividad.nombre}</span>
                                <span>{actividad.comienzo} – {actividad.fin}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo"><h3>Inscripción</h3></div>
                    <dl className="creacion-resumen-grid">
                        <div>
                            <dt>Período</dt>
                            <dd>{formulario.aperturaInscripcion || '—'} al {formulario.cierreInscripcion || '—'}</dd>
                        </div>
                        <div><dt>Cupo máximo</dt><dd>{formulario.cupoMaximo || '—'} competidores</dd></div>
                    </dl>
                </section>
            </div>
        </>
    );
}
