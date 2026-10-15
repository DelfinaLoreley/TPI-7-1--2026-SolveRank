import { useState } from 'react';
import './CreacionTorneo.css';

const pasos = [
    'Información general',
    'Categorías',
    'Cronograma',
    'Inscripción',
    'Revisión'
];

const categoriasDisponibles = [
    '3x3x3',
    '2x2x2',
    '4x4x4',
    '5x5x5',
    '6x6x6',
    '7x7x7',
    '3x3x3 Una mano',
    '3x3x3 a ciegas',
    'Clock',
    'Megaminx',
    'Pyraminx',
    'Skewb'
];

const formularioInicial = {
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    ciudad: '',
    sede: '',
    descripcion: '',
    categorias: [],
    actividades: [{ nombre: '', fecha: '', hora: '' }],
    aperturaInscripcion: '',
    cierreInscripcion: '',
    cupoMaximo: '100'
};

function IndicadorPasos({ pasoActual, onCambiarPaso }) {
    return (
        <nav className="creacion-pasos" aria-label="Pasos de creación">
            {pasos.map((nombre, indice) => {
                const completado = indice < pasoActual;
                const actual = indice === pasoActual;
                const habilitado = indice <= pasoActual;

                return (
                    <button
                        className={`creacion-paso${actual ? ' actual' : ''}${completado ? ' completado' : ''}`}
                        type="button"
                        key={nombre}
                        onClick={() => habilitado && onCambiarPaso(indice)}
                        disabled={!habilitado}
                        aria-current={actual ? 'step' : undefined}
                    >
                        <span className="creacion-paso-numero">
                            {completado ? '✓' : indice + 1}
                        </span>
                        <span className="creacion-paso-nombre">{nombre}</span>
                    </button>
                );
            })}
        </nav>
    );
}

function Campo({ etiqueta, ayuda, error, className = '', ...props }) {
    return (
        <label className={`creacion-campo ${className}`}>
            <span className="creacion-etiqueta">{etiqueta}</span>
            <input className="creacion-input" {...props} />
            {ayuda && <span className="creacion-ayuda">{ayuda}</span>}
            {error && <span className="creacion-error">{error}</span>}
        </label>
    );
}

function PasoInformacion({ formulario, onCambio, error }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <span className="creacion-kicker">PASO 1 DE 5</span>
                <h2>Empecemos por lo principal</h2>
                <p>Completá los datos que van a identificar y presentar tu torneo.</p>
            </div>

            <div className="creacion-form-grid">
                <Campo
                    etiqueta="Nombre del torneo"
                    placeholder="Ej.: Nacionales Argentinas SDE 2026"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={onCambio}
                    maxLength={100}
                    autoComplete="off"
                    className="campo-ancho"
                    error={error.nombre}
                />
                <Campo
                    etiqueta="Fecha de inicio"
                    type="date"
                    name="fechaInicio"
                    value={formulario.fechaInicio}
                    onChange={onCambio}
                    error={error.fechaInicio}
                />
                <Campo
                    etiqueta="Fecha de finalización"
                    type="date"
                    name="fechaFin"
                    value={formulario.fechaFin}
                    onChange={onCambio}
                    error={error.fechaFin}
                />
                <Campo
                    etiqueta="Ciudad y provincia"
                    placeholder="Ej.: Santiago del Estero, Argentina"
                    name="ciudad"
                    value={formulario.ciudad}
                    onChange={onCambio}
                    className="campo-ancho"
                    error={error.ciudad}
                />
                <Campo
                    etiqueta="Sede"
                    placeholder="Nombre del lugar donde se realizará"
                    name="sede"
                    value={formulario.sede}
                    onChange={onCambio}
                    className="campo-ancho"
                    error={error.sede}
                />
                <label className="creacion-campo campo-ancho">
                    <span className="creacion-etiqueta">Descripción</span>
                    <textarea
                        className="creacion-input creacion-textarea"
                        name="descripcion"
                        value={formulario.descripcion}
                        onChange={onCambio}
                        placeholder="Contales a los competidores qué pueden esperar del torneo."
                        rows="4"
                        maxLength="1000"
                    />
                    <span className="creacion-ayuda">
                        {formulario.descripcion.length}/1000 caracteres
                    </span>
                </label>
            </div>
        </>
    );
}

function PasoCategorias({ formulario, onAlternarCategoria, error }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <span className="creacion-kicker">PASO 2 DE 5</span>
                <h2>¿Qué categorías se van a competir?</h2>
                <p>Seleccioná las disciplinas que estarán disponibles en este torneo.</p>
            </div>

            <div className="creacion-categorias" role="group" aria-label="Categorías del torneo">
                {categoriasDisponibles.map((categoria, indice) => {
                    const seleccionada = formulario.categorias.includes(categoria);

                    return (
                        <label
                            className={`creacion-categoria${seleccionada ? ' seleccionada' : ''}`}
                            key={categoria}
                        >
                            <input
                                type="checkbox"
                                checked={seleccionada}
                                onChange={() => onAlternarCategoria(categoria)}
                            />
                            <span className="creacion-categoria-icono" aria-hidden="true">
                                {indice < 6 ? '▦' : ['3×', '◉', '◷', '⬡', '▲', '◈'][indice - 6]}
                            </span>
                            <span className="creacion-categoria-texto">
                                <strong>{categoria}</strong>
                                <small>Formato y rondas configurables</small>
                            </span>
                            <span className="creacion-categoria-check" aria-hidden="true">
                                {seleccionada ? '✓' : '+'}
                            </span>
                        </label>
                    );
                })}
            </div>
            {error.categorias && (
                <p className="creacion-error" role="alert">{error.categorias}</p>
            )}
            <p className="creacion-nota">
                La configuración de rondas y tiempos podrá completarse para cada categoría.
            </p>
        </>
    );
}

function PasoCronograma({ formulario, onCambioActividad, onAgregarActividad, onQuitarActividad, error }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <span className="creacion-kicker">PASO 3 DE 5</span>
                <h2>Organizá el cronograma</h2>
                <p>Agregá las actividades principales. Vas a poder definir las rondas en cada categoría.</p>
            </div>

            <div className="creacion-actividades">
                {formulario.actividades.map((actividad, indice) => (
                    <article className="creacion-actividad" key={`actividad-${indice}`}>
                        <div className="creacion-actividad-titulo">
                            <span className="creacion-actividad-numero">{String(indice + 1).padStart(2, '0')}</span>
                            <strong>Actividad {indice + 1}</strong>
                            {formulario.actividades.length > 1 && (
                                <button
                                    className="creacion-quitar"
                                    type="button"
                                    onClick={() => onQuitarActividad(indice)}
                                    aria-label={`Quitar actividad ${indice + 1}`}
                                >
                                    Quitar
                                </button>
                            )}
                        </div>
                        <div className="creacion-form-grid">
                            <Campo
                                etiqueta="Actividad o categoría"
                                placeholder="Ej.: Apertura o 3x3x3 - Ronda 1"
                                name="nombre"
                                value={actividad.nombre}
                                onChange={(event) => onCambioActividad(indice, event)}
                                error={error.actividadNombre && indice === 0 ? error.actividadNombre : ''}
                            />
                            <Campo
                                etiqueta="Fecha"
                                type="date"
                                name="fecha"
                                value={actividad.fecha}
                                onChange={(event) => onCambioActividad(indice, event)}
                            />
                            <Campo
                                etiqueta="Hora de inicio"
                                type="time"
                                name="hora"
                                value={actividad.hora}
                                onChange={(event) => onCambioActividad(indice, event)}
                            />
                        </div>
                    </article>
                ))}
            </div>
            <button
                className="creacion-agregar"
                type="button"
                onClick={onAgregarActividad}
            >
                <span aria-hidden="true">+</span> Agregar actividad
            </button>
            <p className="creacion-nota">
                Las actividades son una guía inicial; el orden y los horarios se pueden ajustar después.
            </p>
        </>
    );
}

function PasoInscripcion({ formulario, onCambio, error }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <span className="creacion-kicker">PASO 4 DE 5</span>
                <h2>Configurá la inscripción</h2>
                <p>Definí cuándo podrán anotarse los competidores y cuántos lugares habrá.</p>
            </div>

            <div className="creacion-form-grid">
                <Campo
                    etiqueta="Apertura de inscripción"
                    type="date"
                    name="aperturaInscripcion"
                    value={formulario.aperturaInscripcion}
                    onChange={onCambio}
                    error={error.aperturaInscripcion}
                />
                <Campo
                    etiqueta="Cierre de inscripción"
                    type="date"
                    name="cierreInscripcion"
                    value={formulario.cierreInscripcion}
                    onChange={onCambio}
                    error={error.cierreInscripcion}
                />
                <Campo
                    etiqueta="Cupo máximo de competidores"
                    type="number"
                    name="cupoMaximo"
                    min="1"
                    max="10000"
                    value={formulario.cupoMaximo}
                    onChange={onCambio}
                    error={error.cupoMaximo}
                />
            </div>
            <div className="creacion-info-box">
                <span className="creacion-info-icono" aria-hidden="true">i</span>
                <p>
                    La modalidad de pago, los documentos y otros requisitos de inscripción
                    pueden agregarse cuando se defina esa configuración.
                </p>
            </div>
        </>
    );
}

function PasoRevision({ formulario }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <span className="creacion-kicker">PASO 5 DE 5</span>
                <h2>Revisá los datos del torneo</h2>
                <p>Confirmá que la información esté completa antes de continuar.</p>
            </div>

            <div className="creacion-revision">
                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo">
                        <h3>Información general</h3>
                    </div>
                    <dl className="creacion-resumen-grid">
                        <div>
                            <dt>Nombre</dt>
                            <dd>{formulario.nombre || 'Sin completar'}</dd>
                        </div>
                        <div>
                            <dt>Fechas</dt>
                            <dd>{formulario.fechaInicio || '—'} al {formulario.fechaFin || '—'}</dd>
                        </div>
                        <div>
                            <dt>Ubicación</dt>
                            <dd>{[formulario.sede, formulario.ciudad].filter(Boolean).join(', ') || 'Sin completar'}</dd>
                        </div>
                        <div>
                            <dt>Cupo</dt>
                            <dd>{formulario.cupoMaximo || '—'} competidores</dd>
                        </div>
                    </dl>
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
                                <span className="creacion-chip" key={categoria}>{categoria}</span>
                            ))
                            : <span className="creacion-resumen-vacio">Sin categorías seleccionadas</span>}
                    </div>
                </section>

                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo">
                        <h3>Cronograma</h3>
                        <span>{formulario.actividades.length} actividades</span>
                    </div>
                    <ul className="creacion-resumen-actividades">
                        {formulario.actividades.map((actividad, indice) => (
                            <li key={`resumen-${indice}`}>
                                <span>{actividad.nombre || `Actividad ${indice + 1}`}</span>
                                <span>{[actividad.fecha, actividad.hora].filter(Boolean).join(' · ') || 'A coordinar'}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="creacion-resumen-bloque">
                    <div className="creacion-resumen-titulo">
                        <h3>Inscripción</h3>
                    </div>
                    <dl className="creacion-resumen-grid">
                        <div>
                            <dt>Período</dt>
                            <dd>{formulario.aperturaInscripcion || '—'} al {formulario.cierreInscripcion || '—'}</dd>
                        </div>
                        <div>
                            <dt>Cupo máximo</dt>
                            <dd>{formulario.cupoMaximo || '—'} competidores</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </>
    );
}

function CreacionTorneo({ onPublicar, onSalir }) {
    const [pasoActual, setPasoActual] = useState(0);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [errores, setErrores] = useState({});
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);

    function manejarCambio(event) {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
        setErrores((actuales) => ({ ...actuales, [name]: '' }));
        setMensaje('');
    }

    function alternarCategoria(categoria) {
        setFormulario((actual) => ({
            ...actual,
            categorias: actual.categorias.includes(categoria)
                ? actual.categorias.filter((seleccionada) => seleccionada !== categoria)
                : [...actual.categorias, categoria]
        }));
        setErrores((actuales) => ({ ...actuales, categorias: '' }));
    }

    function manejarCambioActividad(indice, event) {
        const { name, value } = event.target;
        setFormulario((actual) => ({
            ...actual,
            actividades: actual.actividades.map((actividad, actividadIndice) =>
                actividadIndice === indice
                    ? { ...actividad, [name]: value }
                    : actividad
            )
        }));
        if (name === 'nombre' && indice === 0) {
            setErrores((actuales) => ({ ...actuales, actividadNombre: '' }));
        }
    }

    function validarPaso() {
        const nuevosErrores = {};

        if (pasoActual === 0) {
            ['nombre', 'fechaInicio', 'fechaFin', 'ciudad', 'sede'].forEach((campo) => {
                if (!formulario[campo].trim()) {
                    nuevosErrores[campo] = 'Este campo es obligatorio.';
                }
            });
            if (
                formulario.fechaInicio &&
                formulario.fechaFin &&
                formulario.fechaFin < formulario.fechaInicio
            ) {
                nuevosErrores.fechaFin = 'La fecha de finalización debe ser posterior al inicio.';
            }
        }

        if (pasoActual === 1 && formulario.categorias.length === 0) {
            nuevosErrores.categorias = 'Seleccioná al menos una categoría.';
        }

        if (pasoActual === 2 && !formulario.actividades[0].nombre.trim()) {
            nuevosErrores.actividadNombre = 'Agregá al menos una actividad.';
        }

        if (pasoActual === 3) {
            if (!formulario.aperturaInscripcion) {
                nuevosErrores.aperturaInscripcion = 'Indicá cuándo abre la inscripción.';
            }
            if (!formulario.cierreInscripcion) {
                nuevosErrores.cierreInscripcion = 'Indicá cuándo cierra la inscripción.';
            }
            if (
                formulario.aperturaInscripcion &&
                formulario.cierreInscripcion &&
                formulario.cierreInscripcion < formulario.aperturaInscripcion
            ) {
                nuevosErrores.cierreInscripcion = 'El cierre debe ser posterior a la apertura.';
            }
            if (!Number(formulario.cupoMaximo) || Number(formulario.cupoMaximo) < 1) {
                nuevosErrores.cupoMaximo = 'Ingresá un cupo mayor a cero.';
            }
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    }

    function avanzar() {
        setMensaje('');
        if (validarPaso()) {
            setPasoActual((actual) => Math.min(actual + 1, pasos.length - 1));
        }
    }

    function volver() {
        setMensaje('');
        setErrores({});
        setPasoActual((actual) => Math.max(actual - 1, 0));
    }

    async function publicar() {
        if (!onPublicar) {
            setMensaje('La maqueta está lista para conectar con la acción de publicación del backend.');
            return;
        }

        setEnviando(true);
        setMensaje('');
        try {
            await onPublicar({
                ...formulario,
                cupoMaximo: Number(formulario.cupoMaximo)
            });
        } catch (error) {
            console.error('No se pudo publicar el torneo:', error);
            setMensaje(
                error?.response?.data?.mensaje ||
                'No se pudo publicar el torneo. Revisá los datos e intentá nuevamente.'
            );
        } finally {
            setEnviando(false);
        }
    }

    function agregarActividad() {
        setFormulario((actual) => ({
            ...actual,
            actividades: [...actual.actividades, { nombre: '', fecha: '', hora: '' }]
        }));
    }

    function quitarActividad(indice) {
        setFormulario((actual) => ({
            ...actual,
            actividades: actual.actividades.filter((_, actividadIndice) => actividadIndice !== indice)
        }));
    }

    return (
        <main className="creacion-torneo">
            <div className="creacion-contenedor">
                <header className="creacion-encabezado">
                    {onSalir && (
                        <button className="creacion-volver" type="button" onClick={onSalir}>
                            <span aria-hidden="true">←</span> Volver al panel
                        </button>
                    )}
                    <div className="creacion-titulo">
                        <span className="creacion-kicker">PANEL DE ORGANIZACIÓN</span>
                        <h1>Crear torneo</h1>
                        <p>Completá los pasos para preparar tu próximo evento.</p>
                    </div>
                </header>

                <IndicadorPasos
                    pasoActual={pasoActual}
                    onCambiarPaso={(paso) => {
                        setPasoActual(paso);
                        setErrores({});
                        setMensaje('');
                    }}
                />

                <section className="creacion-panel" aria-labelledby="creacion-paso-titulo">
                    {pasoActual === 0 && (
                        <div id="creacion-paso-titulo">
                            <PasoInformacion
                                formulario={formulario}
                                onCambio={manejarCambio}
                                error={errores}
                            />
                        </div>
                    )}
                    {pasoActual === 1 && (
                        <div id="creacion-paso-titulo">
                            <PasoCategorias
                                formulario={formulario}
                                onAlternarCategoria={alternarCategoria}
                                error={errores}
                            />
                        </div>
                    )}
                    {pasoActual === 2 && (
                        <div id="creacion-paso-titulo">
                            <PasoCronograma
                                formulario={formulario}
                                onCambioActividad={manejarCambioActividad}
                                onAgregarActividad={agregarActividad}
                                onQuitarActividad={quitarActividad}
                                error={errores}
                            />
                        </div>
                    )}
                    {pasoActual === 3 && (
                        <div id="creacion-paso-titulo">
                            <PasoInscripcion
                                formulario={formulario}
                                onCambio={manejarCambio}
                                error={errores}
                            />
                        </div>
                    )}
                    {pasoActual === 4 && (
                        <div id="creacion-paso-titulo">
                            <PasoRevision formulario={formulario} />
                        </div>
                    )}

                    {mensaje && (
                        <p className="creacion-mensaje" role="status">{mensaje}</p>
                    )}

                    <footer className="creacion-acciones">
                        <button
                            className="creacion-boton-secundario"
                            type="button"
                            onClick={volver}
                            disabled={pasoActual === 0 || enviando}
                        >
                            Atrás
                        </button>
                        <span className="creacion-guardado">
                            Los datos se mantienen mientras completás el formulario.
                        </span>
                        {pasoActual < pasos.length - 1 ? (
                            <button
                                className="creacion-boton-primario"
                                type="button"
                                onClick={avanzar}
                            >
                                Continuar <span aria-hidden="true">→</span>
                            </button>
                        ) : (
                            <button
                                className="creacion-boton-primario"
                                type="button"
                                onClick={publicar}
                                disabled={enviando}
                            >
                                {enviando ? 'Publicando…' : 'Publicar torneo'}
                                {!enviando && <span aria-hidden="true">→</span>}
                            </button>
                        )}
                    </footer>
                </section>
            </div>
        </main>
    );
}

export default CreacionTorneo;
