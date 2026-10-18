function Selector({ etiqueta, valor, opciones, placeholder, onChange, disabled = false }) {
    return (
        <label className="listado-filtro-select">
            <span className="listado-filtro-solo-lectores">{etiqueta}</span>
            <select value={valor} onChange={(evento) => onChange(evento.target.value)} disabled={disabled}>
                {placeholder && <option value="">{placeholder}</option>}
                {opciones.map((opcion) => (
                    <option value={opcion.valor} key={opcion.valor}>{opcion.etiqueta}</option>
                ))}
            </select>
        </label>
    );
}

function FiltrosTorneo({
    busqueda,
    onCambiarBusqueda,
    paises,
    paisSeleccionado,
    onCambiarPais,
    cargandoPaises,
    errorPaises,
    anios,
    anioSeleccionado,
    onCambiarAnio,
    categorias,
    categoriaSeleccionada,
    onCambiarCategoria,
}) {
    const aniosOpciones = anios.map((anio) => ({
        valor: String(anio),
        etiqueta: anio === new Date().getFullYear() ? 'Este año' : String(anio),
    }));
    return (
        <div className="listado-torneos-filtros">
            <label className="listado-filtro-busqueda">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="10.8" cy="10.8" r="6.3" />
                    <path d="m15.5 15.5 4.3 4.3" />
                </svg>
                <span className="listado-filtro-solo-lectores">Buscar torneos</span>
                <input
                    type="search"
                    value={busqueda}
                    onChange={(evento) => onCambiarBusqueda(evento.target.value)}
                    placeholder="Buscar el nombre, ciudad o país..."
                />
            </label>

            <div className="listado-filtros-selectores">
                <Selector
                    etiqueta="País"
                    valor={paisSeleccionado}
                    opciones={paises.map((pais) => ({ valor: pais, etiqueta: pais }))}
                    placeholder={cargandoPaises ? 'Cargando países…' : 'Todos los países'}
                    onChange={onCambiarPais}
                    disabled={cargandoPaises || Boolean(errorPaises)}
                />
                <Selector etiqueta="Año" valor={anioSeleccionado} opciones={aniosOpciones} placeholder="Todos los años" onChange={onCambiarAnio} />
                <Selector etiqueta="Categoría" valor={categoriaSeleccionada} opciones={categorias.map((categoria) => ({ valor: categoria, etiqueta: categoria }))} placeholder="Todas las categorías" onChange={onCambiarCategoria} />
            </div>
            {errorPaises && <p className="listado-filtros-error" role="alert">{errorPaises}</p>}
        </div>
    );
}

export default FiltrosTorneo;
