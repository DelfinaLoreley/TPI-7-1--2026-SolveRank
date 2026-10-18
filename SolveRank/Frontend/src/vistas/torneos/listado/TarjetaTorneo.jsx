import cuboImagen from '/src/assets/home/img-cubo-home.png';
import ubicacionIcon from '/src/assets/home/iconos/ubicacion-icon.png';
import categoriasIcon from '/src/assets/home/iconos/categoria3x3-icon.png';
import competidoresIcon from '/src/assets/home/iconos/competidores-icon.png';
import guardarIcon from '/src/assets/home/iconos/guardado.png';
import sedeUshuaia from '/src/assets/home/cards-torneos/casa_de_la_cultura_ush.jpeg';
import sedeRioGrande from '/src/assets/home/cards-torneos/Universidad_Torcuato_Di_Tella.jpg';
import sedeBuenosAires from '/src/assets/home/cards-torneos/club_defensores_de_belgrano.jpg';
import sedeClub from '/src/assets/home/cards-torneos/club_peon_peon.jfif';

const imagenesPorDefecto = [sedeUshuaia, sedeRioGrande, sedeBuenosAires, sedeClub];

function fechaLocal(fecha) {
    if (!fecha) return null;
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
    if (!anio || !mes || !dia) return null;
    const valor = new Date(anio, mes - 1, dia);
    return Number.isNaN(valor.getTime()) ? null : valor;
}

function obtenerEstadoInscripcion(torneo) {
    const apertura = fechaLocal(torneo.Fecha_Inicio_Inscripcion);
    const cierre = fechaLocal(torneo.Fecha_fin_Inscripcion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (!apertura || !cierre) return 'Inscripciones próximamente';
    if (hoy < apertura) return 'Inscripciones próximamente';
    if (hoy <= cierre) return 'Inscripciones abiertas';
    return 'Inscripciones cerradas';
}

function TarjetaTorneo({ torneo, urlBackend, guardado, onAlternarGuardado, onVerTorneo }) {
    const fecha = fechaLocal(torneo.fecha_Inicio);
    const estado = obtenerEstadoInscripcion(torneo);
    const ubicacion = [torneo.ciudad, torneo.provincia, torneo.pais].filter(Boolean).join(', ')
        || torneo.Lugar_Venue
        || 'Ubicación a confirmar';
    const imagen = torneo.pathImagen
        ? `${urlBackend}${torneo.pathImagen}`
        : imagenesPorDefecto[Math.abs(Number(torneo.idTorneo) || 0) % imagenesPorDefecto.length] || cuboImagen;
    const cupos = Number(torneo.limite_participantes) || 0;

    return (
        <article className="listado-torneo-card">
            <div className="listado-torneo-imagen">
                <img src={imagen} alt={`Sede del torneo ${torneo.nombre}`} />
                <span className={`listado-torneo-estado ${estado === 'Inscripciones abiertas' ? 'abiertas' : estado === 'Inscripciones cerradas' ? 'cerradas' : ''}`}>
                    {estado}
                </span>
                <button
                    type="button"
                    className={`listado-torneo-guardar${guardado ? ' guardado' : ''}`}
                    aria-label={guardado ? `Quitar ${torneo.nombre} de guardados` : `Guardar ${torneo.nombre}`}
                    aria-pressed={guardado}
                    onClick={onAlternarGuardado}
                >
                    <img src={guardarIcon} alt="" />
                </button>
            </div>
            <div className="listado-torneo-info">
                <div className="listado-torneo-fecha">
                    <strong>{fecha ? fecha.toLocaleDateString('es-AR', { day: '2-digit' }) : '—'}</strong>
                    <span>{fecha ? fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase() : '—'}</span>
                </div>
                <div className="listado-torneo-detalle">
                    <h2>{torneo.nombre}</h2>
                    <p><img src={ubicacionIcon} alt="" />{ubicacion}</p>
                </div>
                <div className="listado-torneo-meta">
                    <span><img src={categoriasIcon} alt="" />{Number(torneo.categorias) || 0} categorías</span>
                    <span><img src={competidoresIcon} alt="" />{cupos} cupos</span>
                </div>
                <button className="listado-torneo-ver" type="button" onClick={onVerTorneo} aria-label={`Ver torneo ${torneo.nombre}`}>
                    <span>Ver torneo</span>
                    <span aria-hidden="true">⟶</span>
                </button>
            </div>
        </article>
    );
}

export default TarjetaTorneo;
