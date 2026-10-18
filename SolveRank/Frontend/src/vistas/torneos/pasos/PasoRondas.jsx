import { useState } from 'react';
import rondasIcon from '/src/assets/torneos/rondas-icon.svg';
import { Campo, CampoSelect } from './CamposTorneo';
import { etiquetaCategoria } from './datosCategorias';

const configuracionPredeterminada = {
    cantidad: 3,
    formato: 'Ao5',
    rondas: {}
};

const detallePredeterminado = {
    avance: '20%',
    cutoff: '1:30.00',
    limite: '10:00.00'
};

function obtenerConfiguracion(configuraciones, categoria) {
    return configuraciones[categoria] || configuracionPredeterminada;
}

export function PasoRondas({ categorias, configuraciones, onCambioConfiguracion, catalogo = [] }) {
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categorias[0] || '');
    const [rondaActiva, setRondaActiva] = useState('1');
    const categoriaActiva = categorias.includes(categoriaSeleccionada)
        ? categoriaSeleccionada
        : categorias[0] || '';
    const configuracion = obtenerConfiguracion(configuraciones, categoriaActiva);
    const cantidadRondas = Math.max(1, Number(configuracion.cantidad) || 1);
    const numeroRondaActiva = rondaActiva === 'final' ? 'final' : String(Math.min(Number(rondaActiva), cantidadRondas));
    const detalle = configuracion.rondas?.[numeroRondaActiva] || detallePredeterminado;

    function cambiarCantidad(event) {
        const cantidad = Math.max(1, Math.min(10, Number(event.target.value) || 1));
        onCambioConfiguracion(categoriaActiva, {
            ...configuracion,
            cantidad
        });
    }

    function cambiarDetalle(event) {
        onCambioConfiguracion(categoriaActiva, {
            ...configuracion,
            rondas: {
                ...configuracion.rondas,
                [numeroRondaActiva]: {
                    ...detalle,
                    [event.target.name]: event.target.value
                }
            }
        });
    }

    return (
        <>
            <div className="creacion-seccion-intro">
                <div className="creacion-titulo-h2">
                    <img className="icon" src={rondasIcon} alt="" />
                    <h2>Rondas</h2>
                </div>
                <p>Elegí la cantidad de rondas y el formato de cada una.</p>
            </div>

            {categorias.length === 0 ? (
                <p className="creacion-nota">Primero seleccioná al menos una categoría para configurar sus rondas.</p>
            ) : (
                <div className="creacion-rondas-layout">
                    <section className="creacion-rondas-configuracion" aria-label="Configuración de rondas">
                        <CampoSelect
                            etiqueta="Seleccioná la categoría"
                            opciones={categorias.map((categoria) => ({
                                value: categoria,
                                label: etiquetaCategoria(categoria, catalogo)
                            }))}
                            value={categoriaActiva}
                            onChange={(event) => {
                                setCategoriaSeleccionada(event.target.value);
                                setRondaActiva('1');
                            }}
                        />
                        <Campo
                            etiqueta="Cantidad de rondas"
                            type="number"
                            min="1"
                            max="10"
                            value={configuracion.cantidad}
                            onChange={cambiarCantidad}
                        />
                        <CampoSelect
                            etiqueta="Formato"
                            opciones={['AO5', 'MO3', 'BO3', 'BO1']}
                            value={configuracion.formato || 'AO5'}
                            onChange={(event) => onCambioConfiguracion(categoriaActiva, {
                                ...configuracion,
                                formato: event.target.value
                            })}
                        />
                        <CampoSelect
                            etiqueta="Seleccioná la ronda a configurar"
                            opciones={[
                                ...Array.from({ length: cantidadRondas }, (_, indice) => `Ronda ${indice + 1}`),
                                'Final'
                            ]}
                            value={numeroRondaActiva === 'final' ? 'Final' : `Ronda ${numeroRondaActiva}`}
                            onChange={(event) => setRondaActiva(
                                event.target.value === 'Final'
                                    ? 'final'
                                    : event.target.value.replace('Ronda ', '')
                            )}
                        />
                        <div className="creacion-rondas-detalle">
                            <Campo
                                etiqueta="Avanzan a la siguiente ronda"
                                placeholder="Ej.: 20%"
                                name="avance"
                                value={detalle.avance}
                                onChange={cambiarDetalle}
                                disabled={numeroRondaActiva === 'final'}
                            />
                            <Campo
                                etiqueta="Cutoff"
                                placeholder="Ej.: 1:30.00"
                                name="cutoff"
                                value={detalle.cutoff}
                                onChange={cambiarDetalle}
                            />
                        </div>
                        <Campo
                            etiqueta="Tiempo límite"
                            placeholder="Ej.: 5:00.00"
                            name="limite"
                            value={detalle.limite}
                            onChange={cambiarDetalle}
                        />
                    </section>

                    <section className="creacion-rondas-vista-previa" aria-label="Vista previa de las rondas">
                        <h3>Vista previa de las rondas</h3>
                        <ol>
                            {[...Array.from({ length: cantidadRondas }, (_, indice) => ({
                                id: String(indice + 1),
                                nombre: `Ronda ${indice + 1}`,
                                final: false
                            })), { id: 'final', nombre: 'Final', final: true }].map((ronda) => {
                                const datos = configuracion.rondas?.[ronda.id] || detallePredeterminado;
                                return (
                                    <li key={ronda.id}>
                                        <span className="creacion-ronda-icono" aria-hidden="true">◴</span>
                                        <div className="creacion-ronda-detalle">
                                            <strong>{ronda.nombre}</strong>
                                            <div>
                                <span>Formato: {configuracion.formato || 'AO5'}</span>
                                                <span>Límite: {datos.limite || '—'}</span>
                                                <span>Cutoff: {datos.cutoff || '—'}</span>
                                                <span>Avanzan: {ronda.final ? '—' : datos.avance || '—'}</span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                </div>
            )}
        </>
    );
}
