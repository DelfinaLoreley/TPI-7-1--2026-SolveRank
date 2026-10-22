import { useEffect, useState } from 'react';
import cuboBanner from '/src/assets/img-cubo-banner.png';
import { PasoCategorias } from './pasos/PasoCategorias';
import { PasoCronograma } from './pasos/PasoCronograma';
import { PasoInformacion } from './pasos/PasoInformacion';
import { PasoInscripcion } from './pasos/PasoInscripcion';
import { PasoRevision } from './pasos/PasoRevision';
import { PasoRondas } from './pasos/PasoRondas';
import { categorias as categoriasBase } from './pasos/datosCategorias';
import { generarCronograma } from './pasos/generarCronograma';
import axios from '../../axiosApi';
import './CreacionTorneo.css';

const pasos = [
    'Información general',
    'Categorías',
    'Rondas',
    'Cronograma',
    'Confirmar'
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
    const [imagenVistaPrevia, setImagenVistaPrevia] = useState('');
    const [catalogos, setCatalogos] = useState({ paises: [], provincias: [], ciudades: [], categorias: [], formatos: [], jueces: [], delegados: [] });
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
    const [errorCatalogos, setErrorCatalogos] = useState('');
    useEffect(() => {
        let activo = true;
        axios.get('/torneos/catalogos').then(({ data }) => { if (activo) setCatalogos(data); })
            .catch((error) => { if (activo) setErrorCatalogos(error?.response?.data?.mensaje || 'No se pudieron cargar los datos del torneo.'); })
            .finally(() => { if (activo) setCargandoCatalogos(false); });
        return () => { activo = false; };
    }, []);
    const categoriasVista = catalogos.categorias.map((categoria) => {
        const base = categoriasBase.find((item) => item.id.toLowerCase() === categoria.categoria.toLowerCase() || item.etiqueta.toLowerCase() === categoria.categoria.toLowerCase());
        return { id: String(categoria.idCategoria), etiqueta: categoria.categoria, icono: base?.icono };
    });
    const cronograma = generarCronograma(
        formulario.fechaInicio,
        formulario.categorias,
        formulario.rondas,
        categoriasVista
    );

    function manejarCambio(event) {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value,
            ...(name === 'pais' ? { provincia: '', ciudad: '' } : {}),
            ...(name === 'provincia' ? { ciudad: '' } : {}) }));
        setErrores((actuales) => ({ ...actuales, [name]: '' }));
        setMensaje('');
    }

    function manejarCambioImagen(event) {
        const archivo = event.target.files?.[0] || null;
        if (archivo && !['image/jpeg', 'image/png'].includes(archivo.type)) {
            setMensaje('La imagen debe estar en formato JPG o PNG.');
            event.target.value = '';
            return;
        }
        if (archivo && archivo.size > 5 * 1024 * 1024) {
            setMensaje('La imagen no puede superar los 5 MB.');
            event.target.value = '';
            return;
        }
        setImagen(archivo);
        if (archivo) {
            const lector = new FileReader();
            lector.onload = () => setImagenVistaPrevia(String(lector.result || ''));
            lector.onerror = () => setImagenVistaPrevia('');
            lector.readAsDataURL(archivo);
        } else {
            setImagenVistaPrevia('');
        }
        setMensaje('');
        setMensaje('');
    }

    function agregarPersona(nombre) {
        const valor = formulario[nombre];
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
        setFormulario((actual) => ({ ...actual, categorias: categoriasVista.map(({ id }) => id) }));
        setErrores((actuales) => ({ ...actuales, categorias: '' }));
    }

    function deseleccionarTodasLasCategorias() {
        setFormulario((actual) => ({ ...actual, categorias: [] }));
    }

    async function publicar() {
        if (!onPublicar) return;
        setEnviando(true);
        setMensaje('');
        try {
            const sqlDateTime = (value) => value ? `${value.replace('T', ' ')}:00` : '';
            const formatos = {};
            const rondas = {};
            formulario.categorias.forEach((id) => {
                const config = formulario.rondas[id] || {};
                const formato = catalogos.formatos.find((item) => item.formato.toUpperCase() === String(config.formato || 'AO5').toUpperCase()) || catalogos.formatos[0];
                if (formato) formatos[id] = formato.idFormato;
                rondas[id] = Array.from({ length: Math.max(1, Number(config.cantidad) || 3) }, (_, index) => {
                    const detalle = config.rondas?.[String(index + 1)] || {};
                    const parseTime = (value, fallback) => {
                        const match = String(value || '').match(/^(\d{1,2}):(\d{2})(?:\.\d+)?$/);
                        return match ? `00:${match[1].padStart(2, '0')}:${match[2]}` : fallback;
                    };
                    const avanceConfigurado = detalle.avance === undefined ? '20%' : detalle.avance;
                    return { nombre: `Ronda ${index + 1}`, cutoff: parseTime(detalle.cutoff, '00:00:00'), tiempoLimite: parseTime(detalle.limite, '00:10:00'), porcentajeAvance: Math.max(0, Math.min(100, parseInt(avanceConfigurado, 10) || 0)) };
                });
            });
            const toSqlTime = (value) => `${value.slice(0, 5)}:00`;
            const cronogramaApi = cronograma.filter((item) => /Ronda \d+|Final/.test(item.nombre)).map((item) => {
                const categoria = formulario.categorias.find((id) => item.nombre.startsWith(categoriasVista.find((c) => c.id === id)?.etiqueta || '\u0000')) || formulario.categorias[0];
                const numero = Number(item.nombre.match(/Ronda (\d+)/)?.[1]) || rondas[categoria]?.length || 1;
                return { idCategoria: Number(categoria), ronda: `Ronda ${numero}`, evento: item.nombre, horaInicio: toSqlTime(item.comienzo), horaFin: toSqlTime(item.fin) };
            });
            const imagenData = imagen ? await new Promise((resolve, reject) => {
                const lector = new FileReader();
                lector.onload = () => resolve(lector.result);
                lector.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada'));
                lector.readAsDataURL(imagen);
            }) : null;
            await onPublicar({
                idPais: Number(formulario.pais), idProvicncia: Number(formulario.provincia), idCiudad: Number(formulario.ciudad),
                fecha_Inicio: sqlDateTime(formulario.fechaInicio), fecha_fin: sqlDateTime(formulario.fechaFin),
                Fecha_Inicio_Inscripcion: formulario.aperturaInscripcion, Fecha_fin_Inscripcion: formulario.cierreInscripcion,
                nombre: formulario.nombre.trim(), Contacto_Organizador: formulario.contacto.trim() || usuario?.email || 'Contacto pendiente',
                descripcion: formulario.descripcion, Lugar_Venue: formulario.sede, direccion: formulario.direccion,
                limite_participantes: Number(formulario.cupoMaximo),
                imagenBase64: imagenData,
                jueces: formulario.juecesSeleccionados.map(Number), delegados: formulario.delegadosSeleccionados.map(Number),
                categorias: formulario.categorias.map(Number), formatos, rondas, cronograma: cronogramaApi
            });
        } catch (error) {
            setMensaje(error?.response?.data?.mensaje || 'No se pudo publicar el torneo. Revisá los datos e intentá nuevamente.');
        } finally { setEnviando(false); }
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
                                    catalogos={catalogos}
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
                                catalogo={categoriasVista}
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
                                catalogo={categoriasVista}
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
                        <PasoRevision
                            formulario={formulario}
                            cronograma={cronograma}
                            catalogo={categoriasVista}
                            catalogos={catalogos}
                            imagenVistaPrevia={imagenVistaPrevia}
                        />
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

                {errorCatalogos && <p className="creacion-error" role="alert">{errorCatalogos}</p>}
                {cargandoCatalogos && <p className="creacion-nota" role="status">Cargando catálogos…</p>}

                {!cargandoCatalogos && !errorCatalogos && renderizarPaso()}

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
                        <button className="creacion-boton-primario" type="button" onClick={avanzar} disabled={cargandoCatalogos || !!errorCatalogos}>
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
