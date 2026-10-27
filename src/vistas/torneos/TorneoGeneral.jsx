import { useState } from 'react';
import calendarIcon from '/src/assets/torneos/calendar-icon.svg';
import locationIcon from '/src/assets/torneos/ubicacion-azul-icon.svg';
import sedeIcon from '/src/assets/torneos/local-azul-icon.svg';
import contactIcon from '/src/assets/torneos/contacto-icon.svg';
import categoriesIcon from '/src/assets/torneos/categorias-azul-icon.png';
import registrationIcon from '/src/assets/torneos/inscripcion-azul-icon.svg';
import delegatesIcon from '/src/assets/torneos/delegados-azul-icon.svg';
import organizadorIcon from '/src/assets/icons/organizador-azul-icon.svg';
import documentacionIcon from '/src/assets/torneos/documentacion-azul-icon.svg';
import importantIcon from '/src/assets/torneos/importante-icon.svg';
import descIcon from '/src/assets/torneos/desc-icon.svg';
import perdiodoInscIcon from '/src/assets/torneos/periodo-inscripcion-azul-icon.svg';

import { categorias } from './pasos/datosCategorias.js';
import './TorneoGeneral.css';

function fechaLegible(fecha) {
    if (!fecha) return null;
    const valor = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(valor.getTime())) return null;
    return valor.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function periodoFechas(inicio, fin) {
    const fechaInicio = fechaLegible(inicio);
    const fechaFin = fechaLegible(fin);
    if (!fechaInicio && !fechaFin) return 'Fecha por confirmar';
    if (!fechaInicio) return fechaFin;
    if (!fechaFin || fechaInicio === fechaFin) return fechaInicio;
    return `${fechaInicio} - ${fechaFin}`;
}

function normalizarLista(valor) {
    if (Array.isArray(valor)) {
        return valor
            .map((elemento) => typeof elemento === 'string' ? elemento : elemento?.nombre || elemento?.etiqueta)
            .filter(Boolean);
    }
    if (typeof valor === 'string' && valor.trim()) {
        return valor.split(',').map((elemento) => elemento.trim()).filter(Boolean);
    }
    return [];
}

function Tarjeta({ titulo, icono, children, className = '' }) {
    return (
        <section className={`torneo-general-tarjeta ${className}`} aria-label={titulo}>
            <div className="torneo-general-tarjeta-encabezado">
                <h2>
                    {icono && <img src={icono} alt="" />}
                    {titulo}
                </h2>
            </div>
            {children}
        </section>
    );
}

function Dato({ icono, etiqueta, valor }) {
    return (
        <div className="torneo-general-dato">
            <img src={icono} alt="" />
            <div>
                <span>{etiqueta}</span>
                <strong>{valor || 'Por confirmar'}</strong>
            </div>
        </div>
    );
}

function EstadoInscripcion({ torneo }) {
    const limite = Number(torneo.limite_participantes) || 0;
    const inscriptos = Number(torneo.inscriptos) || 0;
    const restantes = Math.max(limite - inscriptos, 0);
    const porcentaje = limite > 0 ? Math.min((inscriptos / limite) * 100, 100) : 0;
    const inicio = fechaLegible(torneo.Fecha_Inicio_Inscripcion);
    const fin = fechaLegible(torneo.Fecha_fin_Inscripcion);

    return (
        <Tarjeta titulo="ESTADO DE LA INSCRIPCIÓN" icono={registrationIcon} className="torneo-general-inscripcion">
            <div className="torneo-general-cupos">
                <div
                    className="torneo-general-dona"
                    role="img"
                    aria-label={`${inscriptos} de ${limite} cupos ocupados`}
                    style={{ '--ocupacion': `${porcentaje}%` }}
                >
                    <div>
                        <strong>{limite}</strong>
                        <span>cupos totales</span>
                    </div>
                </div>
                <div className="torneo-general-cifra">
                    <strong>{inscriptos}</strong>
                    <span>inscriptos</span>
                </div>
                <div className="torneo-general-cifra">
                    <strong>{restantes}</strong>
                    <span>cupos restantes</span>
                </div>
            </div>
            <div className="torneo-general-periodo">
                <img src={perdiodoInscIcon} alt="" />
                <div>
                    <strong>Período de inscripción</strong>
                    <span>{inicio || fin ? `${inicio || 'Por confirmar'} - ${fin || 'Por confirmar'}` : 'Por confirmar'}</span>
                </div>
            </div>
        </Tarjeta>
    );
}

function CategoriasTorneo({ torneo }) {
    const categoriasTorneo = Array.isArray(torneo.categorias)
        ? [...new Map(torneo.categorias.map((categoria) => {
            const nombre = typeof categoria === 'string'
                ? categoria
                : categoria.etiqueta || categoria.categoria || categoria.nombre;
            const clave = typeof categoria === 'string'
                ? categoria
                : categoria.idCategoria ?? categoria.id ?? nombre;
            return [String(clave), { original: categoria, nombre, clave }];
        }).filter(([, categoria]) => categoria.nombre)).values()]
        : [];
    const [mostrarTodas, setMostrarTodas] = useState(false);
    const categoriasVisibles = mostrarTodas ? categoriasTorneo : categoriasTorneo.slice(0, 4);

    return (
        <Tarjeta titulo="CATEGORÍAS" icono={categoriesIcon}>
            {categoriasTorneo.length > 0 ? (
                <>
                    <ul className="torneo-general-categorias">
                    {categoriasVisibles.map(({ original, nombre, clave }) => {
                        const idCategoria = typeof original === 'string'
                            ? original
                            : original.id || original.idCategoria || nombre;
                        const detalle = categorias.find((opcion) => opcion.id === idCategoria || opcion.etiqueta === nombre || opcion.id === nombre);
                        const rondas = typeof original === 'string' ? [] : original.rondas || [];
                        const formatos = [...new Set(rondas.map((ronda) => ronda.formato).filter(Boolean))];
                        const formato = formatos.join(' / ') || (typeof original === 'string' ? '' : original.formato) || 'Por confirmar';
                        const finales = rondas.filter((ronda) => String(ronda.nombre || '').trim().toLocaleLowerCase('es') === 'final').length;
                        const rondasPrevias = rondas.length - finales;
                        const textoRondas = !rondas.length ? 'Por confirmar'
                            : finales ? `${rondasPrevias ? `${rondasPrevias} + ` : ''}Final`
                                : String(rondas.length);

                        return (
                            <li key={clave}>
                                {detalle?.icono && <span className="torneo-general-categoria-icono"><img src={detalle.icono} alt="" /></span>}
                                <div className="torneo-general-categoria-detalle">
                                    <strong>{detalle?.etiqueta || nombre}</strong>
                                    <span>Formato: {formato}</span>
                                    <span>Rondas: {textoRondas}</span>
                                </div>
                            </li>
                        );
                    })}
                    </ul>
                    {categoriasTorneo.length > 4 && (
                        <button
                            className="torneo-general-expandir"
                            type="button"
                            aria-expanded={mostrarTodas}
                            onClick={() => setMostrarTodas((visible) => !visible)}
                        >
                            {mostrarTodas ? 'Ver menos ↑' : 'Ver todas →'}
                        </button>
                    )}
                </>
            ) : (
                <p className="torneo-general-vacio">Las categorías todavía no están disponibles.</p>
            )}
        </Tarjeta>
    );
}

function ListaPersonas({ titulo, personas, icono }) {
    const lista = normalizarLista(personas);
    return (
        <Tarjeta titulo={titulo} icono={icono}>
            {lista.length > 0
                ? <p className="torneo-general-personas">{lista.join(', ')}</p>
                : <p className="torneo-general-vacio">Información por confirmar.</p>}
        </Tarjeta>
    );
}

function Documentacion({ documentos }) {
    const lista = Array.isArray(documentos) ? documentos : [];
    return (
        <Tarjeta titulo="DOCUMENTACIÓN" icono={documentacionIcon}>
            {lista.length > 0 ? (
                <ul className="torneo-general-documentos">
                    {lista.map((documento) => {
                        const nombre = typeof documento === 'string' ? documento : documento.nombre || documento.titulo;
                        const url = typeof documento === 'string' ? null : documento.url || documento.href;
                        if (!nombre) return null;
                        return (
                            <li key={`${nombre}-${url || ''}`}>
                                {url
                                    ? <a href={url} target="_blank" rel="noreferrer">{nombre}</a>
                                    : <span>{nombre}</span>}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="torneo-general-vacio">No hay documentos publicados.</p>
            )}
        </Tarjeta>
    );
}

function TorneoGeneral({ torneo }) {
    const lugar = [torneo.Lugar_Venue, torneo.direccion, torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean);
    const contacto = torneo.Contacto_Organizador || torneo.contacto;
    const organizador = torneo.organizador || torneo.Organizador;
    const jueces = torneo.jueces || torneo.Jueces;
    const delegados = torneo.delegados || torneo.Delegados;
    const importante = normalizarLista(torneo.importante || torneo.requisitos);
    const [leerMas, setLeerMas] = useState(false);
    const requisitosVisibles = leerMas ? importante : importante.slice(0, 4);
    const urlMapa = lugar.length > 0
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar.join(', '))}`
        : null;

    return (
        <section id="seccion-general" className="torneo-general" aria-label="Resumen general del torneo">
            <div className="torneo-general-columna">
                <Tarjeta titulo="INFORMACIÓN GENERAL" icono={documentacionIcon}>
                    <div className="torneo-general-datos">
                        <Dato icono={calendarIcon} etiqueta="Fecha" valor={periodoFechas(torneo.fecha_Inicio, torneo.fecha_fin)} />
                        <Dato icono={contactIcon} etiqueta="Contacto" valor={contacto} />
                        <Dato icono={locationIcon} etiqueta="Ciudad" valor={[torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ')} />
                        <Dato icono={organizadorIcon} etiqueta="Organizador principal" valor={organizador} />
                        <Dato icono={sedeIcon} etiqueta="Sede" valor={torneo.Lugar_Venue} />
                        <Dato icono={delegatesIcon} etiqueta="Delegados de la WCA" valor={normalizarLista(delegados).join(', ')} />
                    </div>
                </Tarjeta>

                <ListaPersonas titulo="JUECES DEL TORNEO" personas={jueces} icono={delegatesIcon} />

                <CategoriasTorneo torneo={torneo} />

                <Tarjeta titulo="IMPORTANTE" icono={importantIcon} className="torneo-general-importante">
                    {importante.length > 0 ? (
                        <>
                            <ul>{requisitosVisibles.map((item) => <li key={item}>{item}</li>)}</ul>
                            {importante.length > 4 && (
                                <button
                                    className="torneo-general-expandir"
                                    type="button"
                                    aria-expanded={leerMas}
                                    onClick={() => setLeerMas((visible) => !visible)}
                                >
                                    {leerMas ? 'Leer menos ↑' : 'Leer más →'}
                                </button>
                            )}
                        </>
                    ) : (
                        <><p className="torneo-general-vacio">Si haces click a esta pestaña, podrás ver información importante y muy útil sobre los torneos, como las reglas básicas y los requisitos.</p>
                        <a className="torneo-general-expandir" href="/?vista=info-extra-torneo" target="_blank" rel="noopener noreferrer">Leer más →</a></>
                    )}
                </Tarjeta>
            </div>

            <div className="torneo-general-columna">
                <EstadoInscripcion torneo={torneo} />

                <Tarjeta titulo="DESCRIPCIÓN" icono={descIcon}>
                    <p className="torneo-general-descripcion">
                        {torneo.descripcion || 'La organización todavía no publicó una descripción para este torneo.'}
                    </p>
                </Tarjeta>

                <Tarjeta titulo="LUGAR" icono={locationIcon}>
                    <p className="torneo-general-lugar">
                        <strong>{torneo.Lugar_Venue || 'Sede por confirmar'}</strong>
                        <span>{[torneo.direccion, torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ') || 'Ubicación por confirmar'}</span>
                    </p>
                    {urlMapa && (
                        <a className="torneo-general-mapa" href={urlMapa} target="_blank" rel="noreferrer">
                            Ver ubicación en el mapa
                        </a>
                    )}
                </Tarjeta>

                <Documentacion documentos={torneo.documentacion || torneo.documentos} />
            </div>
        </section>
    );
}

export default TorneoGeneral;
