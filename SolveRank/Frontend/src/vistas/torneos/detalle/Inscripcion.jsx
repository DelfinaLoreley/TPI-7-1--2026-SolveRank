
import { useState } from 'react';
import inscripcionIcon from '/src/assets/torneos/inscripcion-azul-icon.svg';
import calendarioInscripcionIcon from '/src/assets/torneos/calendar-icon.svg';
import registroIcon from '/src/assets/torneos/documentacion-icon.svg';
import { categorias } from '../pasos/datosCategorias.js';
import axios from '../../../axiosApi';

const pasos = [
    { titulo: 'Requisitos', descripcion: <>Aceptá los términos<br />del torneo</> },
    { titulo: 'Registrarse', descripcion: <>Elegí tus categorías<br />para este torneo</> },
    { titulo: 'Aprobación', descripcion: <>Por los organizadores</> }
];

function fechaPeriodo(fecha) {
    if (!fecha) return 'Por confirmar';
    const valor = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(valor.getTime())) return 'Por confirmar';
    return valor.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Inscripcion({ torneo }) {
    const [pasoActual, setPasoActual] = useState(1);
    const [aceptaRequisitos, setAceptaRequisitos] = useState(false);
    const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
    const [inscripcionConfirmada, setInscripcionConfirmada] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [errorInscripcion, setErrorInscripcion] = useState('');
    const limite = Number(torneo.limite_participantes) || 0;
    const [inscriptos, setInscriptos] = useState(Number(torneo.inscriptos) || 0);
    const cuposRestantes = Math.max(limite - inscriptos, 0);
    const porcentajeInscriptos = limite > 0 ? Math.min((inscriptos / limite) * 100, 100) : 0;

    function cambiarCategoria(id) {
        setCategoriasSeleccionadas((seleccionadas) => (
            seleccionadas.includes(id)
                ? seleccionadas.filter((categoria) => categoria !== id)
                : [...seleccionadas, id]
        ));
    }

    function continuarInscripcion() {
        if (pasoActual === 1 && aceptaRequisitos) {
            setPasoActual(2);
        } else if (pasoActual === 2 && categoriasSeleccionadas.length > 0) {
            setPasoActual(3);
        }
    }

    async function confirmarInscripcion() {
        setProcesando(true);
        setErrorInscripcion('');
        try {
            await axios.post(`/torneos/${torneo.idTorneo}/inscripcion`);
            setInscripcionConfirmada(true);
            setInscriptos((cantidad) => cantidad + 1);
        } catch (error) {
            console.error('No se pudo confirmar la inscripción:', error);
            setErrorInscripcion(error.response?.data?.mensaje || 'No se pudo confirmar la inscripción. Intentá nuevamente.');
        } finally {
            setProcesando(false);
        }
    }

    async function eliminarRegistro() {
        setProcesando(true);
        setErrorInscripcion('');
        try {
            await axios.delete(`/torneos/${torneo.idTorneo}/inscripcion`);
            setInscriptos((cantidad) => Math.max(cantidad - 1, 0));
            setPasoActual(1);
            setAceptaRequisitos(false);
            setCategoriasSeleccionadas([]);
            setInscripcionConfirmada(false);
        } catch (error) {
            console.error('No se pudo cancelar la inscripción:', error);
            setErrorInscripcion(error.response?.data?.mensaje || 'No se pudo cancelar la inscripción. Intentá nuevamente.');
        } finally {
            setProcesando(false);
        }
    }

    return (
        <section className="inscripcion-section" aria-labelledby="inscripcion-titulo">
            <div className="inscripcion-titulo">
                <img src={inscripcionIcon} alt="" />
                <h2 id="inscripcion-titulo">INSCRIPCIÓN</h2>
            </div>

            <div className="inscripcion-resumen">
                <article className="inscripcion-dato">
                    <img className="inscripcion-dato-icono" src={calendarioInscripcionIcon} alt="" />
                    <div>
                        <h3>Periodo de inscripción</h3>
                        <p>{fechaPeriodo(torneo.Fecha_Inicio_Inscripcion)} - {fechaPeriodo(torneo.Fecha_fin_Inscripcion)}</p>
                    </div>
                </article>
                <article className="inscripcion-dato">
                    <img className="inscripcion-dato-icono" src={registroIcon} alt="" />
                    <div>
                        <h3>Info de registro</h3>
                        <p>Límite de competidores: {limite}</p>
                    </div>
                </article>
            </div>

            <section className="inscripcion-estado" aria-labelledby="inscripcion-estado-titulo">
                <h3 id="inscripcion-estado-titulo">
                    <span className="inscripcion-estado-icono" aria-hidden="true" />
                    ESTADO DE LA INSCRIPCIÓN
                </h3>
                <div className="inscripcion-estadisticas">
                    <div
                        className="inscripcion-dona"
                        role="img"
                        aria-label={`${inscriptos} de ${limite} cupos ocupados`}
                        style={{ '--inscripcion-ocupacion': `${porcentajeInscriptos}%` }}
                    >
                        <div>
                            <strong>{limite}</strong>
                            <span>cupos totales</span>
                        </div>
                    </div>
                    <div className="inscripcion-cifra">
                        <strong>{inscriptos}</strong>
                        <span>inscriptos</span>
                    </div>
                    <div className="inscripcion-cifra">
                        <strong>{cuposRestantes}</strong>
                        <span>cupos restantes</span>
                    </div>
                </div>
            </section>

            <section className="inscripcion-proceso" aria-labelledby="inscripcion-proceso-titulo">
                <h3 id="inscripcion-proceso-titulo"><span />Tu inscripción<span /></h3>
                <ol className={`inscripcion-pasos paso-actual-${pasoActual}`}>
                    {pasos.map((paso, indice) => {
                        const numero = indice + 1;
                        const completado = numero < pasoActual;

                        return (
                            <li
                                className={`paso-${numero} ${numero === pasoActual ? 'actual' : ''} ${completado ? 'completado' : ''}`}
                                aria-current={numero === pasoActual ? 'step' : undefined}
                                key={paso.titulo}
                            >
                                {completado
                                    ? <span className="inscripcion-paso-check" aria-label="Completado">✓</span>
                                    : <strong>{numero}</strong>}
                                <div><b>{paso.titulo}</b><span>{paso.descripcion}</span></div>
                            </li>
                        );
                    })}
                </ol>

                {pasoActual === 1 && (
                    <>
                        <label className="inscripcion-aceptacion">
                            <input
                                type="checkbox"
                                checked={aceptaRequisitos}
                                onChange={(evento) => setAceptaRequisitos(evento.target.checked)}
                            />
                            <span>He leído y acepto toda la información de esta pestaña, incluyendo tarifas, políticas de reembolso, y cualquier otro requerimiento que se enumere.</span>
                        </label>
                        <button
                            className="inscripcion-continuar"
                            type="button"
                            disabled={!aceptaRequisitos}
                            onClick={continuarInscripcion}
                        >
                            Continuar <span aria-hidden="true">→</span>
                        </button>
                    </>
                )}

                {pasoActual === 2 && (
                    <>
                        <section className="inscripcion-seleccion" aria-labelledby="inscripcion-categorias-titulo">
                            <h4 id="inscripcion-categorias-titulo">Selección de categorías</h4>
                            <div className="inscripcion-categorias">
                                {categorias.map((categoria) => {
                                    const seleccionada = categoriasSeleccionadas.includes(categoria.id);

                                    return (
                                        <button
                                            className={`inscripcion-categoria ${seleccionada ? 'seleccionada' : ''}`}
                                            type="button"
                                            aria-label={categoria.etiqueta}
                                            aria-pressed={seleccionada}
                                            title={categoria.etiqueta}
                                            key={categoria.id}
                                            onClick={() => cambiarCategoria(categoria.id)}
                                        >
                                            <img src={categoria.icono} alt="" />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="inscripcion-seleccion-acciones">
                                <button
                                    className="seleccion-todas"
                                    type="button"
                                    onClick={() => setCategoriasSeleccionadas(categorias.map(({ id }) => id))}
                                >
                                    Todas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategoriasSeleccionadas([])}
                                >
                                    Ninguna
                                </button>
                            </div>
                            <p className="inscripcion-seleccion-conteo" aria-live="polite">
                                {categoriasSeleccionadas.length} categorías seleccionadas
                            </p>
                        </section>
                        <div className="inscripcion-acciones">
                            <button className="inscripcion-volver" type="button" onClick={() => setPasoActual(1)}>
                                ← Volver
                            </button>
                            <button
                                className="inscripcion-continuar"
                                type="button"
                                disabled={categoriasSeleccionadas.length === 0}
                                onClick={continuarInscripcion}
                            >
                                Continuar <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    </>
                )}

                {pasoActual === 3 && (
                    <>
                        <section className="inscripcion-confirmacion" aria-live="polite">
                            <span className="inscripcion-confirmacion-check" aria-hidden="true">{inscripcionConfirmada ? '✓' : '!'}</span>
                            <div>
                                <h4>{inscripcionConfirmada ? '¡Inscripción confirmada!' : 'Confirmá tu inscripción'}</h4>
                                <p>
                                    {inscripcionConfirmada
                                        ? `Tu inscripción como competidor para ${torneo.nombre} quedó registrada.`
                                        : `Vas a inscribirte como competidor para ${torneo.nombre}. Confirmá para guardar la inscripción.`}
                                </p>
                            </div>
                        </section>
                        <section className="inscripcion-eventos" aria-labelledby="inscripcion-eventos-titulo">
                            <h4 id="inscripcion-eventos-titulo">
                                <img src={registroIcon} alt="" />
                                Tus eventos seleccionados
                            </h4>
                            <div className="inscripcion-eventos-lista">
                                {categorias
                                    .filter(({ id }) => categoriasSeleccionadas.includes(id))
                                    .map((categoria) => (
                                        <span className="inscripcion-evento" key={categoria.id} title={categoria.etiqueta}>
                                            <img src={categoria.icono} alt={categoria.etiqueta} />
                                        </span>
                                    ))}
                            </div>
                            <p className="inscripcion-seleccion-conteo">
                                La selección de eventos se muestra en esta vista; la base de datos registra tu inscripción al torneo.
                            </p>
                        </section>
                        {errorInscripcion && <p className="inscripcion-error" role="alert">{errorInscripcion}</p>}
                        {!inscripcionConfirmada
                            ? (
                                <div className="inscripcion-acciones">
                                    <button className="inscripcion-volver" type="button" onClick={() => setPasoActual(2)} disabled={procesando}>
                                        ← Volver
                                    </button>
                                    <button
                                        className="inscripcion-confirmar"
                                        type="button"
                                        onClick={confirmarInscripcion}
                                        disabled={procesando}
                                    >
                                        {procesando ? 'Guardando...' : 'Confirmar inscripción'}
                                    </button>
                                </div>
                            )
                            : (
                                <div className="inscripcion-acciones">
                                    <button
                                        className="inscripcion-eliminar"
                                        type="button"
                                        onClick={eliminarRegistro}
                                        disabled={procesando}
                                    >
                                        {procesando ? 'Cancelando...' : 'Cancelar inscripción'}
                                    </button>
                                </div>
                            )}
                    </>
                )}
            </section>
        </section>
    );
}

export default Inscripcion;