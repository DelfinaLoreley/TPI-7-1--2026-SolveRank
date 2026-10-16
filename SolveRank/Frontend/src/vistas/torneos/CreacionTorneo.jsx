import { useState } from 'react';
import cuboBanner from '/src/assets/img-cubo-banner.png';
import { PasoCategorias } from './pasos/PasoCategorias';
import { PasoCronograma } from './pasos/PasoCronograma';
import { PasoInformacion } from './pasos/PasoInformacion';
import { PasoInscripcion } from './pasos/PasoInscripcion';
import { PasoRevision } from './pasos/PasoRevision';
import { PasoRondas } from './pasos/PasoRondas';
import { categoriasDisponibles } from './pasos/datosCategorias';
import { generarCronograma } from './pasos/generarCronograma';
import './CreacionTorneo.css';

const pasos = [
    'Información general',
    'Categorías',
    'Rondas',
    'Cronograma',
    'Confirmar información'
];

const formularioInicial = {
    nombre: '',
    organizador: '',
    contacto: '',
    fechaInicio: '',
    fechaFin: '',
    pais: '',
    provincia: '',
    ciudad: '',
    sede: '',
    direccion: '',
    descripcion: '',
    jueces: '',
    juecesSeleccionados: [],
    delegados: '',
    delegadosSeleccionados: [],
    categorias: [],
    rondas: {},
    aperturaInscripcion: '',
    cierreInscripcion: '',
    cupoMaximo: '100'
};

function IndicadorPasos({ pasoActual, onCambiarPaso }) {
    return (
        <nav className="creacion-pasos" aria-label="Pasos de creación">
            {pasos.map((nombre, indice) => {
                const actual = indice === pasoActual;
                const habilitado = indice <= pasoActual;

                return (
                    <button
                        className={`creacion-paso${actual ? ' actual' : ''}`}
                        type="button"
                        key={nombre}
                        onClick={() => habilitado && onCambiarPaso(indice)}
                        disabled={!habilitado}
                        aria-current={actual ? 'step' : undefined}
                    >
                        <span className="creacion-paso-numero">{indice + 1}</span>
                        <span className="creacion-paso-nombre">{nombre}</span>
                    </button>
                );
            })}
        </nav>
    );
}

function CreacionTorneo({ onPublicar, onSalir, usuario }) {
    const [pasoActual, setPasoActual] = useState(0);
    const nombreOrganizador = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || 'Mi organización';
    const [formulario, setFormulario] = useState(() => ({
        ...formularioInicial,
        organizador: nombreOrganizador
    }));
    const [errores, setErrores] = useState({});
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [imagen, setImagen] = useState(null);
    const cronograma = generarCronograma(
        formulario.fechaInicio,
        formulario.categorias,
        formulario.rondas
    );

    function manejarCambio(event) {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
        setErrores((actuales) => ({ ...actuales, [name]: '' }));
        setMensaje('');
    }

    function manejarCambioImagen(event) {
        setImagen(event.target.files?.[0] || null);
        setMensaje('');
    }

    function agregarPersona(nombre) {
        const valor = formulario[nombre].trim();
        const campoSeleccionados = `${nombre}Seleccionados`;
        if (!valor || formulario[campoSeleccionados].includes(valor)) return;
        setFormulario((actual) => ({
            ...actual,
            [campoSeleccionados]: [...actual[campoSeleccionados], valor],
            [nombre]: ''
        }));
    }

    function quitarPersona(nombre, persona) {
        const campoSeleccionados = `${nombre}Seleccionados`;
        setFormulario((actual) => ({
            ...actual,
            [campoSeleccionados]: actual[campoSeleccionados].filter((seleccionada) => seleccionada !== persona)
        }));
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

    function seleccionarTodasLasCategorias() {
        setFormulario((actual) => ({ ...actual, categorias: categoriasDisponibles }));
        setErrores((actuales) => ({ ...actuales, categorias: '' }));
    }

    function deseleccionarTodasLasCategorias() {
        setFormulario((actual) => ({ ...actual, categorias: [] }));
    }

    function cambiarConfiguracionRonda(categoria, configuracion) {
        setFormulario((actual) => ({
            ...actual,
            rondas: { ...actual.rondas, [categoria]: configuracion }
        }));
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

        if (pasoActual === 1 && formulario.categorias.length === 0) {
            nuevosErrores.categorias = 'Seleccioná al menos una categoría.';
        }

        if (pasoActual === 3 && cronograma.length === 0) {
            nuevosErrores.cronograma = 'Completá la fecha de inicio y seleccioná categorías.';
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
                imagen,
                cronograma,
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

    function renderizarPaso() {
        switch (pasoActual) {
            case 0:
                return (
                    <>
                        <section className="creacion-panel" aria-labelledby="creacion-paso-titulo">
                            <div id="creacion-paso-titulo">
                                <PasoInformacion
                                    formulario={formulario}
                                    onCambio={manejarCambio}
                                    onCambioImagen={manejarCambioImagen}
                                    onAgregarPersona={agregarPersona}
                                    onQuitarPersona={quitarPersona}
                                    error={errores}
                                    organizador={nombreOrganizador}
                                    imagen={imagen}
                                />
                            </div>
                            {mensaje && <p className="creacion-mensaje" role="status">{mensaje}</p>}
                        </section>
                        <section className="creacion-panel creacion-inscripciones-panel" aria-label="Inscripciones">
                            <PasoInscripcion formulario={formulario} onCambio={manejarCambio} error={errores} />
                        </section>
                    </>
                );
            case 1:
                return (
                    <section className="creacion-panel" aria-labelledby="creacion-paso-titulo">
                        <div id="creacion-paso-titulo">
                            <PasoCategorias
                                seleccionadas={formulario.categorias}
                                onAlternarCategoria={alternarCategoria}
                                onSeleccionarTodas={seleccionarTodasLasCategorias}
                                onDeseleccionarTodas={deseleccionarTodasLasCategorias}
                                error={errores}
                            />
                        </div>
                        {mensaje && <p className="creacion-mensaje" role="status">{mensaje}</p>}
                    </section>
                );
            case 2:
                return (
                    <section className="creacion-panel creacion-panel-rondas" aria-labelledby="creacion-paso-titulo">
                        <div id="creacion-paso-titulo">
                            <PasoRondas
                                categorias={formulario.categorias}
                                configuraciones={formulario.rondas}
                                onCambioConfiguracion={cambiarConfiguracionRonda}
                            />
                        </div>
                        {mensaje && <p className="creacion-mensaje" role="status">{mensaje}</p>}
                    </section>
                );
            case 3:
                return (
                    <section className="creacion-panel creacion-panel-cronograma" aria-labelledby="creacion-paso-titulo">
                        <div id="creacion-paso-titulo">
                            <PasoCronograma actividades={cronograma} />
                        </div>
                        {errores.cronograma && <p className="creacion-error" role="alert">{errores.cronograma}</p>}
                        {mensaje && <p className="creacion-mensaje" role="status">{mensaje}</p>}
                    </section>
                );
            default:
                return (
                    <section className="creacion-panel" aria-labelledby="creacion-paso-titulo">
                        <div id="creacion-paso-titulo">
                            <PasoRevision formulario={formulario} cronograma={cronograma} />
                        </div>
                        {mensaje && <p className="creacion-mensaje" role="status">{mensaje}</p>}
                    </section>
                );
        }
    }

    return (
        <main className="creacion-torneo">
            <div className="creacion-contenedor">
                <header className="creacion-encabezado">
                    <img className="creacion-banner" src={cuboBanner} alt="" />
                    {onSalir && (
                        <button className="creacion-volver" type="button" onClick={onSalir}>
                            <span aria-hidden="true"></span> ← Volver al panel
                        </button>
                    )}
                    <div className="creacion-titulo">
                        <h1>Crear torneo</h1>
                        <p>Completá la información paso a paso para crear un nuevo torneo.</p>
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

                {renderizarPaso()}

                <footer className="creacion-acciones">
                    <button
                        className="creacion-boton-secundario"
                        type="button"
                        onClick={volver}
                        disabled={pasoActual === 0 || enviando}
                    >
                        ← Volver
                    </button>
                    <span className="creacion-guardado">Los datos se mantienen mientras completás el formulario.</span>
                    {pasoActual < pasos.length - 1 ? (
                        <button className="creacion-boton-primario" type="button" onClick={avanzar}>
                            Siguiente <span aria-hidden="true">→</span>
                        </button>
                    ) : (
                        <button className="creacion-boton-primario" type="button" onClick={publicar} disabled={enviando}>
                            {enviando ? 'Publicando…' : 'Publicar torneo'}
                            {!enviando && <span aria-hidden="true">→</span>}
                        </button>
                    )}
                </footer>
            </div>
        </main>
    );
}

export default CreacionTorneo;
