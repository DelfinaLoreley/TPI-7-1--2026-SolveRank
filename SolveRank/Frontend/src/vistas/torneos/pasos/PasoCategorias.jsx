import { categorias, categoriasIcon } from './datosCategorias';

export function PasoCategorias({ seleccionadas, onAlternarCategoria, onSeleccionarTodas, onDeseleccionarTodas, error }) {
    const todasSeleccionadas = seleccionadas.length === categorias.length;
    const ningunaSeleccionada = seleccionadas.length === 0;

    return (
        <>
            <div className="creacion-seccion-intro">
                <div className="creacion-titulo-h2">
                    <img className="icon" src={categoriasIcon} alt="" />
                    <h2>Categorías</h2>
                </div>
                <p>Seleccioná las categorías del torneo.</p>
            </div>

            <div className="creacion-categorias-acciones">
                <button
                    className={todasSeleccionadas ? 'activa' : ''}
                    type="button"
                    onClick={onSeleccionarTodas}
                    aria-pressed={todasSeleccionadas}
                >
                    Todas
                </button>
                <button
                    className={ningunaSeleccionada ? 'activa' : ''}
                    type="button"
                    onClick={onDeseleccionarTodas}
                    aria-pressed={ningunaSeleccionada}
                >
                    Ninguna
                </button>
            </div>

            <div className="creacion-categorias" role="group" aria-label="Categorías del torneo">
                {categorias.map(({ id, etiqueta, icono }) => {
                    const seleccionada = seleccionadas.includes(id);

                    return (
                        <label
                            className={`creacion-categoria${seleccionada ? ' seleccionada' : ''}`}
                            key={id}
                        >
                            <input
                                type="checkbox"
                                checked={seleccionada}
                                onChange={() => onAlternarCategoria(id)}
                                aria-label={etiqueta}
                            />
                            <span className="creacion-categoria-icono" aria-hidden="true">
                                <img src={icono} alt="" />
                            </span>
                            <span className="creacion-categoria-texto">
                                <strong>{etiqueta}</strong>
                            </span>
                            <span className="creacion-categoria-switch" aria-hidden="true" />
                        </label>
                    );
                })}
            </div>
            {error.categorias && (
                <p className="creacion-error" role="alert">{error.categorias}</p>
            )}
        </>
    );
}
