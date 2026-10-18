import { useEffect, useMemo, useState } from 'react';
import axios from '../../axiosApi';
import cuboBanner from '/src/assets/img-cubo-banner.png';
import './CargaResultadosTorneo.css';
import resultadosIcon from '/src/assets/home/iconos/resultados-icon-selected.png';
import formIcon from '/src/assets/torneos/info-general-icon.svg';

function fechaLegible(fecha) {
    if (!fecha) return 'Fecha por confirmar';
    const valor = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(valor.getTime())) return 'Fecha por confirmar';
    return valor.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function mensajeErrorResultados(error, mensajePredeterminado) {
    if (error?.response?.data?.mensaje) return error.response.data.mensaje;
    if (!error?.response) return 'No se pudo conectar con el backend en localhost:3000. Verificá que esté iniciado.';
    return mensajePredeterminado;
}

function milisegundos(tiempo) {
    if (['DNF', 'DNS'].includes(String(tiempo || '').trim().toUpperCase())) return null;
    const coincidencia = String(tiempo || '').match(/^(?:(\d{1,2}):)?([0-5]?\d)\.(\d{1,3})(\+2)?$/);
    if (!coincidencia) return null;
    const fraccionMs = Number(coincidencia[3].padEnd(3, '0'));
    return ((Number(coincidencia[1] || 0) * 60 + Number(coincidencia[2])) * 1000)
        + fraccionMs + (coincidencia[4] ? 2000 : 0);
}

function tiempoLegible(valor) {
    if (!Number.isFinite(valor)) return 'DNF';
    const minutos = Math.floor(valor / 60000);
    const segundos = Math.floor((valor % 60000) / 1000);
    const milisegundosRestantes = valor % 1000;
    const fraccion = String(milisegundosRestantes).padStart(3, '0').replace(/0+$/, '').padEnd(2, '0');
    const parteSegundos = `${String(segundos).padStart(2, '0')}.${fraccion}`;
    return minutos ? `${String(minutos).padStart(2, '0')}:${parteSegundos}` : parteSegundos;
}

function tiempoPromedioLegible(sumaMilisegundos, cantidad) {
    const divisor = cantidad * 1000;
    const totalSegundos = Math.floor(sumaMilisegundos / divisor);
    const milisegundosRestantes = sumaMilisegundos - totalSegundos * divisor;
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    let resto = milisegundosRestantes;
    let fraccion = '';
    const posicionesResto = new Map();
    let ciclo = -1;

    while (resto && fraccion.length < 12) {
        if (posicionesResto.has(resto)) {
            ciclo = posicionesResto.get(resto);
            break;
        }
        posicionesResto.set(resto, fraccion.length);
        resto *= 10;
        fraccion += Math.floor(resto / divisor);
        resto %= divisor;
    }

    if (ciclo >= 0) {
        fraccion = `${fraccion.slice(0, ciclo)}(${fraccion.slice(ciclo)})`;
    } else if (resto) {
        fraccion += '…';
    }
    fraccion = fraccion.replace(/0+$/, '');

    const parteSegundos = `${String(segundos).padStart(2, '0')}.${fraccion.padEnd(2, '0')}`;
    return minutos ? `${String(minutos).padStart(2, '0')}:${parteSegundos}` : parteSegundos;
}

function estadisticasCompetidor(competidor, formato, cantidadIntentosFormato) {
    const cantidad = Number(cantidadIntentosFormato) || 0;
    const valores = (competidor.intentos ?? []).slice(0, cantidad);
    const tiempos = valores.map(milisegundos);
    const validos = tiempos.filter((tiempo) => tiempo !== null);
    const mejor = validos.length ? Math.min(...validos) : null;
    const completo = cantidad > 0 && valores.length === cantidad && valores.every((tiempo) => tiempo !== '');
    let promedio = null;
    let resultado = null;

    if (completo) {
        if (String(formato).toUpperCase().startsWith('BO')) {
            resultado = mejor ?? Infinity;
        } else if (String(formato).toUpperCase() === 'AO5') {
            const promediar = [...tiempos].sort((a, b) => (a ?? Infinity) - (b ?? Infinity)).slice(1, -1);
            if (promediar.some((tiempo) => tiempo === null)) {
                promedio = Infinity;
            } else {
                const sumaPromedio = promediar.reduce((suma, tiempo) => suma + tiempo, 0);
                promedio = sumaPromedio / promediar.length;
            }
            resultado = promedio;
        } else {
            promedio = tiempos.some((tiempo) => tiempo === null)
                ? Infinity
                : tiempos.reduce((suma, tiempo) => suma + tiempo, 0) / tiempos.length;
            resultado = promedio;
        }
    }

    const valoresPromedio = String(formato).toUpperCase() === 'AO5'
        ? [...tiempos].sort((a, b) => (a ?? Infinity) - (b ?? Infinity)).slice(1, -1)
        : tiempos;
    const promedioSuma = valoresPromedio.every((tiempo) => tiempo !== null)
        ? valoresPromedio.reduce((suma, tiempo) => suma + tiempo, 0)
        : null;
    return { mejor, promedio, resultado, completo, promedioSuma, promedioCantidad: valoresPromedio.length };
}

function formatearTiempoEntrada(valor) {
    const texto = String(valor || '').toUpperCase().trim();
    if (['D', 'DN', 'DNF', 'DS', 'DNS'].includes(texto)) return texto;

    const penalizacion = texto.endsWith('+2') ? '+2' : texto.endsWith('+') ? '+' : '';
    const digitos = texto.replace(/\+2?$/, '').replace(/\D/g, '').slice(-7);
    if (!digitos) return '';

    if (digitos.length <= 4) {
        const tiempo = digitos.padStart(4, '0');
        return `${tiempo.slice(0, 2)}.${tiempo.slice(2)}${penalizacion}`;
    }
    if (digitos.length === 5) {
        return `${digitos.slice(0, 2)}.${digitos.slice(2)}${penalizacion}`;
    }

    const minutos = digitos.slice(0, 2);
    const segundos = digitos.slice(2, 4);
    const fraccion = digitos.slice(4);
    return `${minutos}:${segundos}.${fraccion}${penalizacion}`;
}

function CargaResultadosTorneo({ idTorneo, torneo, rondas, rondaSeleccionada, onVolver }) {
    const idRondaInicial = String(rondaSeleccionada || rondas[0]?.idRonda || '');
    const rondaInicial = rondas.find((ronda) => String(ronda.idRonda) === idRondaInicial);
    const cantidadInicial = Number(rondaInicial?.cantidadIntentos) || 0;
    const [idRonda, setIdRonda] = useState(idRondaInicial);
    const [competidores, setCompetidores] = useState([]);
    const [idCompetidor, setIdCompetidor] = useState('');
    const [busquedaCompetidor, setBusquedaCompetidor] = useState('');
    const [selectorCompetidoresAbierto, setSelectorCompetidoresAbierto] = useState(false);
    const [intentos, setIntentos] = useState(() => Array(cantidadInicial).fill(''));
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const idRondaActiva = idRonda;

    async function cargarResultados() {
        if (!idRondaActiva) return;
        try {
            const { data } = await axios.get(`/torneos/${idTorneo}/resultados/rondas/${idRondaActiva}`);
            setCompetidores(data.competidores ?? []);
            setError('');
        } catch (err) {
            setError(mensajeErrorResultados(err, 'No se pudieron cargar los resultados de la ronda.'));
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        if (!idRondaActiva) return undefined;
        let activo = true;
        const actualizar = async () => {
            try {
                const { data } = await axios.get(`/torneos/${idTorneo}/resultados/rondas/${idRondaActiva}`);
                if (activo) {
                    setCompetidores(data.competidores ?? []);
                    setError('');
                    setCargando(false);
                }
            } catch (err) {
                if (activo) {
                    setError(mensajeErrorResultados(err, 'No se pudieron cargar los resultados de la ronda.'));
                    setCargando(false);
                }
            }
        };
        actualizar();
        const intervalo = window.setInterval(actualizar, 10_000);
        return () => {
            activo = false;
            window.clearInterval(intervalo);
        };
    }, [idTorneo, idRondaActiva]);

    const rondaActiva = rondas.find((ronda) => String(ronda.idRonda) === idRondaActiva);
    const cantidadIntentos = Number(rondaActiva?.cantidadIntentos) || 0;
    const clasificacion = useMemo(() => competidores
        .map((competidor) => ({
            ...competidor,
            ...estadisticasCompetidor(competidor, rondaActiva?.formato, rondaActiva?.cantidadIntentos),
        }))
        .sort((a, b) => {
            if (a.resultado === null) return b.resultado === null
                ? (a.nombre || '').localeCompare(b.nombre || '', 'es')
                : 1;
            if (b.resultado === null) return -1;
            const resultadoA = a.resultado ?? Infinity;
            const resultadoB = b.resultado ?? Infinity;
            return resultadoA - resultadoB || (a.nombre || '').localeCompare(b.nombre || '', 'es');
        }), [competidores, rondaActiva?.cantidadIntentos, rondaActiva?.formato]);

    function seleccionarCompetidor(valor) {
        setBusquedaCompetidor(valor);
        const encontrado = competidores.find((competidor) =>
            String(competidor.idUsuario) === valor
            || `${competidor.nombre}${competidor.wcaid ? ` · ${competidor.wcaid}` : ''}`.toLocaleLowerCase('es') === valor.trim().toLocaleLowerCase('es')
            || competidor.wcaid?.toLocaleLowerCase('es') === valor.trim().toLocaleLowerCase('es')
        );
        setIdCompetidor(encontrado ? String(encontrado.idUsuario) : '');
        setIntentos(encontrado ? Array.from({ length: cantidadIntentos }, (_, indice) => encontrado.intentos?.[indice] || '') : Array(cantidadIntentos).fill(''));
        setSelectorCompetidoresAbierto(false);
        setMensaje('');
        setError('');
    }

    function cambiarTiempo(indice, valor) {
        const tiempo = formatearTiempoEntrada(valor);
        setIntentos((actuales) => actuales.map((actual, posicion) => posicion === indice ? tiempo : actual));
    }

    async function confirmarResultados(evento) {
        evento.preventDefault();
        if (!idCompetidor) {
            setError('Seleccioná un competidor inscripto en esta categoría.');
            return;
        }
        setGuardando(true);
        setError('');
        setMensaje('');
        try {
            const { data } = await axios.post(`/torneos/${idTorneo}/resultados/rondas/${idRondaActiva}`, {
                idUsuario: Number(idCompetidor),
                intentos,
            });
            setMensaje(data.mensaje || 'Resultados guardados correctamente.');
            await cargarResultados();
        } catch (err) {
            setError(mensajeErrorResultados(err, 'No se pudieron guardar los resultados.'));
        } finally {
            setGuardando(false);
        }
    }

    if (!rondas.length) {
        return (
            <section className="carga-resultados-vacia">
                <h2>Cargar resultados</h2>
                <p>Este torneo todavía no tiene rondas configuradas.</p>
            </section>
        );
    }

    return (
        <main className="carga-resultados">
            <header className="carga-resultados-hero">
                <div className="carga-resultados-hero-contenido">
                    <button className="carga-resultados-volver" type="button" onClick={onVolver}>← Volver al torneo</button>
                    <h1>Cargar resultados</h1>
                    <p>
                        <span>{rondaActiva?.categoria}</span>
                        <span aria-hidden="true">·</span>
                        <span>{rondaActiva?.ronda}</span>
                        <span aria-hidden="true">·</span>
                        <span>{fechaLegible(torneo.fecha_Inicio)}</span>
                    </p>
                </div>
                <img src={cuboBanner} alt="" aria-hidden="true" />
            </header>

            <section className="carga-resultados-resumen" aria-label="Información de la ronda">
                <div><span className="carga-resultados-icono">▦</span><span><small>Categoría</small><strong>{rondaActiva?.categoria}</strong></span></div>
                <div><span className="carga-resultados-icono">◴</span><span><small>Ronda</small><strong>{rondaActiva?.ronda}</strong></span></div>
                <div><span className="carga-resultados-icono">▤</span><span><small>Formato</small><strong>{rondaActiva?.formato || 'Formato no configurado'}</strong></span></div>
                <div><span className="carga-resultados-icono">◷</span><span><small>Tiempo límite</small><strong>{rondaActiva?.tiempoLimite || '—'}</strong></span></div>
                <div><span className="carga-resultados-icono">♧</span><span><small>Competidores</small><strong>{competidores.length}</strong></span></div>
                <label className="carga-resultados-selector-ronda">
                    <span>Seleccionar Ronda</span>
                    <select value={idRondaActiva} onChange={(evento) => {
                        const siguienteId = evento.target.value;
                        const siguienteRonda = rondas.find((ronda) => String(ronda.idRonda) === siguienteId);
                        setCargando(true);
                        setIdRonda(siguienteId);
                        setIdCompetidor('');
                        setBusquedaCompetidor('');
                        setIntentos(Array(Number(siguienteRonda?.cantidadIntentos) || 0).fill(''));
                    }}>
                        {rondas.map((ronda) => (
                            <option key={ronda.idRonda} value={ronda.idRonda}>{ronda.categoria} · {ronda.ronda}</option>
                        ))}
                    </select>
                </label>
            </section>

            {!cantidadIntentos && <p className="carga-resultados-error" role="alert">Esta ronda no tiene un formato configurado y no admite carga de resultados.</p>}

            <div className="carga-resultados-columnas">
                <form className="carga-resultados-formulario" onSubmit={confirmarResultados}>
                    <h2><span aria-hidden="true"><img src={formIcon} /></span> Formulario de resultados</h2>
                    <p>Completá todos los intentos del formato seleccionado. Usá MM:SS.CC, +2, DNF o DNS.</p>
                    <div className="carga-resultados-campo carga-resultados-selector-competidor">
                        <label htmlFor="carga-resultados-busqueda-competidor">ID/Nombre del competidor</label>
                        <input
                            id="carga-resultados-busqueda-competidor"
                            type="search"
                            role="combobox"
                            aria-expanded={selectorCompetidoresAbierto}
                            aria-controls="carga-resultados-lista-competidores"
                            aria-autocomplete="list"
                            value={busquedaCompetidor}
                            onFocus={() => setSelectorCompetidoresAbierto(true)}
                            onChange={(evento) => {
                                setBusquedaCompetidor(evento.target.value);
                                setIdCompetidor('');
                                setSelectorCompetidoresAbierto(true);
                            }}
                            onKeyDown={(evento) => {
                                if (evento.key === 'Escape') setSelectorCompetidoresAbierto(false);
                            }}
                            placeholder="Buscar nombre o ID..."
                            required
                        />
                        {selectorCompetidoresAbierto && (
                            <ul className="carga-resultados-lista-competidores" id="carga-resultados-lista-competidores" role="listbox">
                                {competidores
                                    .filter((competidor) => {
                                        const termino = busquedaCompetidor.trim().toLocaleLowerCase('es');
                                        return !termino
                                            || competidor.nombre?.toLocaleLowerCase('es').includes(termino)
                                            || competidor.wcaid?.toLocaleLowerCase('es').includes(termino);
                                    })
                                    .map((competidor) => (
                                        <li key={competidor.idUsuario} role="option" aria-selected={String(competidor.idUsuario) === idCompetidor}>
                                            <button
                                                type="button"
                                                onMouseDown={(evento) => evento.preventDefault()}
                                                onClick={() => seleccionarCompetidor(`${competidor.nombre}${competidor.wcaid ? ` · ${competidor.wcaid}` : ''}`)}
                                            >
                                                <span>{competidor.nombre}</span>
                                                {competidor.wcaid && <small>{competidor.wcaid}</small>}
                                            </button>
                                        </li>
                                    ))}
                                {competidores.length === 0 && (
                                    <li className="carga-resultados-lista-vacia">No hay competidores inscriptos en esta categoría.</li>
                                )}
                            </ul>
                        )}
                    </div>

                    {intentos.map((tiempo, indice) => (
                        <label className="carga-resultados-campo" key={`intento-${indice + 1}`}>
                            <span>Intento {indice + 1}</span>
                            <input
                                type="text"
                                inputMode="text"
                                value={tiempo}
                                onChange={(evento) => cambiarTiempo(indice, evento.target.value)}
                                placeholder="00:00.00"
                                required
                            />
                        </label>
                    ))}

                    {error && <p className="carga-resultados-error" role="alert">{error}</p>}
                    {mensaje && <p className="carga-resultados-mensaje" role="status">{mensaje}</p>}
                    <button className="carga-resultados-confirmar" type="submit" disabled={guardando || !idRondaActiva || !cantidadIntentos}>
                        {guardando ? 'Guardando…' : 'Confirmar'}
                    </button>
                </form>

                <section className="carga-resultados-en-vivo" aria-label="Resultados en vivo">
                    <h2><span aria-hidden="true"><img src={resultadosIcon} /></span> Resultados en vivo</h2>
                    <p>Se actualiza automáticamente al confirmar los resultados.</p>
                    {error && !guardando && <p className="carga-resultados-error" role="alert">{error}</p>}
                    <div className="carga-resultados-tabla-contenedor">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pos.</th>
                                    <th>Nombre</th>
                                    <th>País</th>
                                    <th>Single</th>
                                    <th>{String(rondaActiva?.formato).toUpperCase().startsWith('BO') ? 'Resultado' : 'Promedio'}</th>
                                    {Array.from({ length: cantidadIntentos }, (_, indice) => <th key={indice}>{indice + 1}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr><td colSpan={5 + cantidadIntentos}>Cargando resultados…</td></tr>
                                ) : clasificacion.length ? clasificacion.map((competidor, indice) => (
                                    <tr key={competidor.idUsuario} className={competidor.idUsuario === Number(idCompetidor) ? 'seleccionado' : ''}>
                                        <td>{competidor.resultado !== null ? indice + 1 : '—'}</td>
                                        <td>{competidor.nombre}</td>
                                        <td>{competidor.pais || '—'}</td>
                                        <td>{competidor.mejor === null ? (competidor.completo ? 'DNF' : '—') : tiempoLegible(competidor.mejor)}</td>
                                        <td>{competidor.resultado === null ? '—' : (
                                            Number.isFinite(competidor.resultado)
                                                ? (competidor.promedio !== null
                                                    ? tiempoPromedioLegible(competidor.promedioSuma, competidor.promedioCantidad)
                                                    : tiempoLegible(competidor.resultado))
                                                : 'DNF'
                                        )}</td>
                                        {Array.from({ length: cantidadIntentos }, (_, intento) => <td key={intento}>{competidor.intentos?.[intento] || '—'}</td>)}
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5 + cantidadIntentos}>Todavía no se cargaron resultados para esta ronda.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default CargaResultadosTorneo;
