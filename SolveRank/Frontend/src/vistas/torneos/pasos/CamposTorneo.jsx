import plusIcon from '/src/assets/torneos/plus-circle-icon.svg';

export function Campo({ etiqueta, ayuda, error, className = '', ...props }) {
    return (
        <label className={`creacion-campo ${className}`}>
            <span className="creacion-etiqueta">{etiqueta}</span>
            <input className="creacion-input" {...props} />
            {ayuda && <span className="creacion-ayuda">{ayuda}</span>}
            {error && <span className="creacion-error">{error}</span>}
        </label>
    );
}

export function CampoSelect({ etiqueta, opciones, className = '', error, ...props }) {
    return (
        <label className={`creacion-campo ${className}`}>
            <span className="creacion-etiqueta">{etiqueta}</span>
            <select className="creacion-input creacion-select" {...props}>
                <option value="">Seleccioná una opción</option>
                {opciones.map((opcion) => {
                    const valor = typeof opcion === 'string' ? opcion : opcion.value;
                    const texto = typeof opcion === 'string' ? opcion : opcion.label;
                    return <option key={valor} value={valor}>{texto}</option>;
                })}
            </select>
            {error && <span className="creacion-error">{error}</span>}
        </label>
    );
}

export function CampoEquipo({ etiqueta, nombre, opciones, formulario, onCambio, onAgregar, onQuitar }) {
    return (
        <div className="creacion-campo">
            <span className="creacion-etiqueta">{etiqueta}</span>
            <div className="creacion-equipo-control">
                <select
                    className="creacion-input creacion-select"
                    name={nombre}
                    value={formulario[nombre]}
                    onChange={onCambio}
                    aria-label={etiqueta}
                >
                    <option value="">Seleccioná una persona</option>
                    {opciones.map((persona) => (
                        <option key={persona} value={persona}>{persona}</option>
                    ))}
                </select>
                <button
                    className="creacion-equipo-agregar"
                    type="button"
                    onClick={() => onAgregar(nombre)}
                    aria-label={`Agregar ${etiqueta.toLowerCase()}`}
                >
                    <img src={plusIcon} alt="" />
                </button>
            </div>
            {formulario[`${nombre}Seleccionados`].length > 0 && (
                <ul className="creacion-equipo-lista">
                    {formulario[`${nombre}Seleccionados`].map((persona) => (
                        <li key={persona}>
                            {persona}
                            <button
                                type="button"
                                onClick={() => onQuitar(nombre, persona)}
                                aria-label={`Quitar a ${persona}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
