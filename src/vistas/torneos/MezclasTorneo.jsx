import { useCallback, useEffect, useState } from 'react';
import axios from '../../axiosApi';
import Swal from 'sweetalert2';
import './MezclasTorneo.css';

function MezclasTorneo({ idTorneo, puedeGestionar = false }) {
    const [mezclas, setMezclas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [eliminando, setEliminando] = useState('');
    const [error, setError] = useState('');

    const cargarMezclas = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const { data } = await axios.get(`/mezclas/torneos/${idTorneo}/listado`);
            setMezclas(data.mezclas || []);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudieron cargar las mezclas.');
        } finally {
            setCargando(false);
        }
    }, [idTorneo]);

    useEffect(() => { cargarMezclas(); }, [cargarMezclas]);

    async function borrarRonda(grupo) {
        const clave = `${grupo.idCategoria}-${grupo.idRonda}`;
        const confirmacion = await Swal.fire({
            title: '¿Borrar todas las mezclas de esta ronda?',
            text: `Se eliminarán las mezclas de ${grupo.categoria}, ${grupo.ronda}, incluidos todos sus grupos. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Borrar mezclas',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            background: '#0a1429',
            color: '#f4f7ff',
        });
        if (!confirmacion.isConfirmed) return;

        setEliminando(clave);
        setError('');
        try {
            const { data } = await axios.delete(
                `/mezclas/torneos/${idTorneo}/categorias/${grupo.idCategoria}/rondas/${grupo.idRonda}`
            );
            await cargarMezclas();
            await Swal.fire({
                title: 'Mezclas borradas',
                text: `${data.eliminadas} mezclas eliminadas de ${grupo.categoria}, ${grupo.ronda}.`,
                icon: 'success',
                background: '#0a1429',
                color: '#f4f7ff',
            });
        } catch (err) {
            const mensaje = err.response?.data?.mensaje || 'No se pudieron borrar las mezclas.';
            setError(mensaje);
            await Swal.fire({ title: 'No se pudieron borrar', text: mensaje, icon: 'error', background: '#0a1429', color: '#f4f7ff' });
        } finally {
            setEliminando('');
        }
    }

    if (cargando) return <section className="torneo-detalle-contenido"><p role="status">Cargando mezclas…</p></section>;
    if (error && !mezclas.length) return <section className="torneo-detalle-contenido"><p role="alert">{error}</p></section>;
    if (!mezclas.length) {
        return <section className="torneo-detalle-contenido"><h2>Mezclas por categoría</h2><p>Todavía no se generaron mezclas para este torneo.</p></section>;
    }

    const grupos = new Map();
    for (const mezcla of mezclas) {
        const clave = `${mezcla.idCategoria}-${mezcla.idRonda}`;
        if (!grupos.has(clave)) {
            grupos.set(clave, {
                clave,
                idCategoria: mezcla.idCategoria,
                idRonda: mezcla.idRonda,
                categoria: mezcla.categoria,
                ronda: mezcla.ronda,
                grupos: new Map(),
            });
        }
        const grupoRonda = grupos.get(clave);
        const nombreGrupo = mezcla.grupo || 'A';
        if (!grupoRonda.grupos.has(nombreGrupo)) grupoRonda.grupos.set(nombreGrupo, []);
        grupoRonda.grupos.get(nombreGrupo).push(mezcla);
    }

    return (
        <section className="mezclas-torneo" aria-labelledby="mezclas-torneo-titulo">
            <header className="mezclas-torneo-encabezado">
                <h2 id="mezclas-torneo-titulo">MEZCLAS</h2>
                <p>Mezclas generadas con un port no oficial de TNoodle.</p>
            </header>
            {error && <p className="mezclas-error" role="alert">{error}</p>}
            {[...grupos.values()].map((grupo) => {
                const clave = grupo.clave;
                return (
                    <section className="mezclas-categoria" key={clave}>
                        <header className="mezclas-ronda-encabezado">
                            <h3>{grupo.categoria} · {grupo.ronda}</h3>
                            {puedeGestionar && <button type="button" className="mezclas-borrar-ronda" onClick={() => borrarRonda(grupo)} disabled={eliminando === clave}>
                                {eliminando === clave ? 'Borrando…' : 'Borrar todas las mezclas de esta ronda'}
                            </button>}
                        </header>
                        {[...grupo.grupos.entries()].map(([nombreGrupo, mezclasGrupo]) => (
                            <div className="mezclas-subgrupo" key={`${clave}-${nombreGrupo}`}>
                                <h4>Grupo {nombreGrupo}</h4>
                                <div className="mezclas-lista">
                                    {mezclasGrupo.map((mezcla) => (
                                        <article className="mezcla-item" key={`${clave}-${nombreGrupo}-${mezcla.numeroMezcla}`}>
                                            <h5>Mezcla {mezcla.numeroMezcla}</h5>
                                            <pre>{mezcla.mezcla}</pre>
                                            {mezcla.svg
                                                ? <img className="mezcla-svg" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(mezcla.svg)}`} alt={`Diagrama de la mezcla ${mezcla.numeroMezcla} de ${grupo.categoria}`} />
                                                : <p className="mezcla-svg-vacio">No hay diagrama disponible para esta mezcla.</p>}
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                );
            })}
        </section>
    );
}

export default MezclasTorneo;
