import { useState } from 'react';
import resultadosIcon from '/src/assets/home/iconos/resultados-icon-selected.png';
import {
    estadisticasCompetidor,
    intentoLegible,
    compararResultados,
    tiempoLegible,
    tiempoPromedioLegible,
} from './utilidadesResultados.js';
import './ResultadosFinalesTorneo.css';

function clasificacionRonda(ronda) {
    return (ronda.competidores ?? [])
        .map((competidor) => ({
            ...competidor,
            ...estadisticasCompetidor(competidor, ronda.formato, ronda.cantidadIntentos),
        }))
        .sort(compararResultados);
}

function valorPromedio(competidor) {
    if (competidor.promedio !== null) {
        return Number.isFinite(competidor.promedio)
            ? tiempoPromedioLegible(competidor.promedioSuma, competidor.promedioCantidad)
            : 'DNF';
    }
    return competidor.resultado === null
        ? '—'
        : tiempoLegible(competidor.resultado);
}

function esFinal(ronda) {
    return /final/i.test(String(ronda.ronda || ''));
}

function ResultadosFinalesTorneo({ datos }) {
    const [vista, setVista] = useState('podios');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
    const categorias = datos.categorias ?? [];
    const categoriasActivas = vista === 'podios'
        ? (categoriaSeleccionada === 'todas'
            ? categorias
            : categorias.filter((categoria) => String(categoria.idCategoria) === categoriaSeleccionada))
        : categorias.filter((categoria) => String(categoria.idCategoria) === (categoriaSeleccionada === 'todas'
            ? String(categorias[0]?.idCategoria ?? '')
            : categoriaSeleccionada));

    function cambiarVista(siguienteVista) {
        setVista(siguienteVista);
        if (siguienteVista === 'todos' && categoriaSeleccionada === 'todas') {
            setCategoriaSeleccionada(String(categorias[0]?.idCategoria ?? ''));
        }
    }

    function renderTabla(ronda, podio = false) {
        const clasificacion = clasificacionRonda(ronda);
        const filas = podio ? clasificacion.slice(0, 3) : clasificacion;
        const cantidadAvanzan = !esFinal(ronda)
            ? Math.ceil(clasificacion.length * Number(ronda.porcentajeAvance || 0) / 100)
            : 0;
        const cantidadIntentos = Number(ronda.cantidadIntentos) || 0;

        return (
            <div className="resultados-finales-tabla-contenedor" key={ronda.idRonda}>
                <table>
                    <thead>
                        <tr>
                            <th>Pos.</th>
                            <th>Nombre</th>
                            <th>País</th>
                            {Array.from({ length: cantidadIntentos }, (_, indice) => (
                                <th key={indice}>{indice + 1}</th>
                            ))}
                            <th>Single</th>
                            <th>{String(ronda.formato).toUpperCase().startsWith('BO') ? 'Resultado' : 'Media'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((competidor, indice) => {
                            const avanza = !podio && competidor.resultado !== null && indice < cantidadAvanzan;
                            const posicion = indice + 1;
                            return (
                                <tr key={competidor.idUsuario}>
                                    <td className={[
                                        avanza ? 'resultados-finales-clasifica' : '',
                                        podio ? `resultados-finales-podio-${posicion}` : '',
                                    ].filter(Boolean).join(' ')}>
                                        {posicion}
                                    </td>
                                    <td>{competidor.nombre}</td>
                                    <td>{competidor.pais || '—'}</td>
                                    {Array.from({ length: cantidadIntentos }, (_, intento) => (
                                        <td key={intento}>{intentoLegible(competidor.intentos?.[intento])}</td>
                                    ))}
                                    <td>{competidor.mejor === null ? 'DNF' : tiempoLegible(competidor.mejor)}</td>
                                    <td>{valorPromedio(competidor)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <section className="resultados-finales" aria-labelledby="resultados-finales-titulo">
            <h2 id="resultados-finales-titulo">
                <span aria-hidden="true"><img src={resultadosIcon} alt="" /></span>
                RESULTADOS
            </h2>
            <div className="resultados-finales-filtros">
                <span>Mostrar por:</span>
                <div className="resultados-finales-vistas" role="group" aria-label="Tipo de resultados">
                    <button
                        type="button"
                        className={vista === 'podios' ? 'activo' : ''}
                        aria-pressed={vista === 'podios'}
                        onClick={() => cambiarVista('podios')}
                    >
                        PODIOS
                    </button>
                    <button
                        type="button"
                        className={vista === 'todos' ? 'activo' : ''}
                        aria-pressed={vista === 'todos'}
                        onClick={() => cambiarVista('todos')}
                    >
                        TODOS
                    </button>
                </div>
                <label className="resultados-finales-selector-categoria">
                    <span className="resultados-finales-solo-lectores">Categoría</span>
                    <select
                        value={vista === 'podios'
                            ? categoriaSeleccionada
                            : (categoriaSeleccionada === 'todas' ? String(categorias[0]?.idCategoria ?? '') : categoriaSeleccionada)}
                        onChange={(evento) => setCategoriaSeleccionada(evento.target.value)}
                        aria-label="Filtrar resultados por categoría"
                    >
                        {vista === 'podios' && <option value="todas">Todas las categorías</option>}
                        {categorias.map((categoria) => (
                            <option key={categoria.idCategoria} value={String(categoria.idCategoria)}>
                                {categoria.categoria}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {vista === 'podios' ? (
                <div className="resultados-finales-grupos">
                    {categoriasActivas.map((categoria) => {
                        const rondaFinal = [...(categoria.rondas ?? [])].reverse().find(esFinal)
                            ?? categoria.rondas?.[categoria.rondas.length - 1];
                        if (!rondaFinal) return null;
                        return (
                            <section className="resultados-finales-grupo" key={categoria.idCategoria}>
                                <h3><span aria-hidden="true">◆</span> {categoria.categoria} <span aria-hidden="true">◆</span></h3>
                                {renderTabla(rondaFinal, true)}
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="resultados-finales-grupos">
                    {categoriasActivas.flatMap((categoria) => (categoria.rondas ?? []).map((ronda) => (
                        <section className="resultados-finales-grupo" key={`${categoria.idCategoria}-${ronda.idRonda}`}>
                            <h3><span aria-hidden="true">◆</span> {categoria.categoria} <span aria-hidden="true">◆</span></h3>
                            <p className="resultados-finales-nombre-ronda">{ronda.ronda}</p>
                            {renderTabla(ronda)}
                        </section>
                    )))}
                </div>
            )}
        </section>
    );
}

export default ResultadosFinalesTorneo;
