import { useEffect, useState } from 'react';
import axios from '../../axiosApi';
import './MezclasTorneo.css';

function MezclasTorneo({ idTorneo }) {
    const [mezclas, setMezclas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;
        setCargando(true);
        setError('');
        axios.get(`/mezclas/torneos/${idTorneo}/listado`)
            .then(({ data }) => { if (activo) setMezclas(data.mezclas || []); })
            .catch((err) => {
                if (activo) setError(err.response?.data?.mensaje || 'No se pudieron cargar las mezclas.');
            })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [idTorneo]);

    if (cargando) return <section className="torneo-detalle-contenido"><p role="status">Cargando mezclas…</p></section>;
    if (error) return <section className="torneo-detalle-contenido"><p role="alert">{error}</p></section>;
    if (!mezclas.length) {
        return <section className="torneo-detalle-contenido"><h2>Mezclas por categoría</h2><p>Todavía no se generaron mezclas para este torneo.</p></section>;
    }

    const grupos = new Map();
    for (const mezcla of mezclas) {
        const clave = `${mezcla.idCategoria}-${mezcla.idRonda}-${mezcla.grupo}`;
        if (!grupos.has(clave)) {
            grupos.set(clave, {
                clave,
                categoria: mezcla.categoria,
                ronda: mezcla.ronda,
                grupo: mezcla.grupo,
                mezclas: []
            });
        }
        grupos.get(clave).mezclas.push(mezcla);
    }

    return (
        <section className="mezclas-torneo" aria-labelledby="mezclas-torneo-titulo">
            <header className="mezclas-torneo-encabezado">
                <h2 id="mezclas-torneo-titulo">Mezclas por categoría</h2>
                <p>Mezclas generadas con un port no oficial de TNoodle.</p>
            </header>
            {[...grupos.values()].map((grupo) => (
                <section className="mezclas-categoria" key={grupo.clave}>
                    <h3>{grupo.categoria} · {grupo.ronda} · Grupo {grupo.grupo}</h3>
                    <div className="mezclas-lista">
                        {grupo.mezclas.map((mezcla) => (
                            <article className="mezcla-item" key={`${grupo.clave}-${mezcla.numeroMezcla}`}>
                                <h4>Mezcla {mezcla.numeroMezcla}</h4>
                                <pre>{mezcla.mezcla}</pre>
                                {mezcla.svg
                                    ? <img className="mezcla-svg" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(mezcla.svg)}`} alt={`Diagrama de la mezcla ${mezcla.numeroMezcla} de ${grupo.categoria}`} />
                                    : <p className="mezcla-svg-vacio">No hay diagrama disponible para esta mezcla.</p>}
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </section>
    );
}

export default MezclasTorneo;
