import { useEffect, useRef, useState } from 'react';
import { categorias as catalogoCategorias, categoriasIcon } from '../pasos/datosCategorias.js';

import lupaIcono from '/src/assets/icons/search-icon.png';

function normalizarCategoria(nombre) {
    return String(nombre).trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function iconoCategoria(nombre) {
    const categoriaNormalizada = normalizarCategoria(nombre);
    return catalogoCategorias.find((categoria) => (
        normalizarCategoria(categoria.id) === categoriaNormalizada
        || normalizarCategoria(categoria.etiqueta) === categoriaNormalizada
    ))?.icono || categoriasIcon;
}

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

function SelectorCategoria({ valor, opciones, placeholder, onChange }) {
    const [abierto, setAbierto] = useState(false);
    const selectorRef = useRef(null);
    const botonRef = useRef(null);
    const seleccionada = opciones.find((opcion) => opcion.valor === valor);
    const opcionesConTodas = [{ valor: '', etiqueta: placeholder }, ...opciones];

    useEffect(() => {
        if (!abierto) return undefined;

        function cerrarFuera(evento) {
            if (!selectorRef.current?.contains(evento.target)) setAbierto(false);
        }

        function cerrarConEscape(evento) {
            if (evento.key === 'Escape') {
                setAbierto(false);
                botonRef.current?.focus();
            }
        }

        document.addEventListener('pointerdown', cerrarFuera);
        document.addEventListener('keydown', cerrarConEscape);
        return () => {
            document.removeEventListener('pointerdown', cerrarFuera);
            document.removeEventListener('keydown', cerrarConEscape);
        };
    }, [abierto]);

    function seleccionar(opcion) {
        onChange(opcion.valor);
        setAbierto(false);
        botonRef.current?.focus();
    }

    return (
        <div className="listado-filtro-select listado-filtro-categoria" ref={selectorRef}>
            <span className="listado-filtro-solo-lectores">Categoría</span>
            <button
                ref={botonRef}
                type="button"
                className="listado-filtro-categoria-trigger"
                aria-haspopup="listbox"
                aria-expanded={abierto}
                aria-label={`Categoría: ${seleccionada?.etiqueta || placeholder}`}
                onClick={() => setAbierto((estadoActual) => !estadoActual)}
            >
                <img src={iconoCategoria(seleccionada?.etiqueta || '')} alt="" />
                <span>{seleccionada?.etiqueta || placeholder}</span>
            </button>
            {abierto && (
                <div className="listado-filtro-categoria-opciones" role="listbox" aria-label="Categorías">
                    {opcionesConTodas.map((opcion) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={opcion.valor === valor}
                            key={opcion.valor || 'todas'}
                            onClick={() => seleccionar(opcion)}
                        >
                            <img src={iconoCategoria(opcion.etiqueta)} alt="" />
                            <span>{opcion.etiqueta}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
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
                <img src={lupaIcono} alt=""/>
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
                <SelectorCategoria
                    valor={categoriaSeleccionada}
                    opciones={categorias.map((categoria) => ({ valor: categoria, etiqueta: categoria }))}
                    placeholder="Todas las categorías"
                    onChange={onCambiarCategoria}
                />
            </div>
            {errorPaises && <p className="listado-filtros-error" role="alert">{errorPaises}</p>}
        </div>
    );
}

export default FiltrosTorneo;
