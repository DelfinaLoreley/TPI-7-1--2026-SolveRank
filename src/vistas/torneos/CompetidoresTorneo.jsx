import { useCallback, useEffect, useState } from 'react';
import axios from '../../axiosApi';
import Swal from 'sweetalert2';
import './CompetidoresTorneo.css';

function CompetidoresTorneo({ idTorneo, puedeQuitar = false, onInscripcionQuitada }) {
    const [competidores, setCompetidores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [eliminandoId, setEliminandoId] = useState(null);

    const cargarCompetidores = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const { data } = await axios.get(`/torneos/${idTorneo}/competidores`);
            setCompetidores(data.competidores ?? []);
        } catch (err) {
            setError(err?.response?.data?.mensaje || 'No se pudieron cargar los competidores.');
        } finally {
            setCargando(false);
        }
    }, [idTorneo]);

    useEffect(() => { cargarCompetidores(); }, [cargarCompetidores]);

    function abrirPerfil(idUsuario) {
        window.dispatchEvent(new CustomEvent('solverank:abrir-perfil-publico', { detail: { idUsuario } }));
    }

    async function quitarCompetidor(competidor) {
        const nombre = [competidor.nombre, competidor.apellido].filter(Boolean).join(' ');
        const confirmacion = await Swal.fire({
            title: '¿Quitar competidor del torneo?',
            text: `${nombre} dejará de estar inscripto. Los resultados ya cargados se conservarán.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Quitar inscripción',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            background: '#0a1429',
            color: '#f4f7ff',
        });
        if (!confirmacion.isConfirmed) return;

        setEliminandoId(competidor.idUsuario);
        try {
            await axios.delete(`/torneos/${idTorneo}/competidores/${competidor.idUsuario}`);
            setCompetidores((actuales) => actuales.filter((item) => item.idUsuario !== competidor.idUsuario));
            onInscripcionQuitada?.();
            await Swal.fire({ title: 'Inscripción quitada', text: 'Los resultados del competidor se conservaron.', icon: 'success', background: '#0a1429', color: '#f4f7ff' });
        } catch (err) {
            await Swal.fire({
                title: 'No se pudo quitar la inscripción',
                text: err?.response?.data?.mensaje || 'Intentá nuevamente.',
                icon: 'error',
                background: '#0a1429',
                color: '#f4f7ff',
            });
        } finally {
            setEliminandoId(null);
        }
    }

    return (
        <section className="competidores-torneo" aria-labelledby="competidores-torneo-titulo">
            <header className="competidores-torneo-encabezado">
                <div>
                    <h2 id="competidores-torneo-titulo">COMPETIDORES</h2>
                    <p>{competidores.length} inscriptos en el torneo</p>
                </div>
            </header>
            {cargando ? <p role="status">Cargando competidores…</p>
                : error ? <p className="competidores-torneo-error" role="alert">{error}</p>
                    : !competidores.length ? <p className="competidores-torneo-vacio">Todavía no hay competidores inscriptos.</p>
                        : <div className="competidores-torneo-lista">
                            {competidores.map((competidor) => (
                                <article className="competidor-torneo-fila" key={competidor.idUsuario}>
                                    <div className="competidor-torneo-datos">
                                        <button type="button" className="competidor-torneo-perfil" onClick={() => abrirPerfil(competidor.idUsuario)}>
                                            {[competidor.nombre, competidor.apellido].filter(Boolean).join(' ')}
                                        </button>
                                        <span>{[competidor.pais, competidor.wcaid].filter(Boolean).join(' · ') || 'Sin país informado'}</span>
                                        {competidor.categorias && <small>Categorías: {competidor.categorias}</small>}
                                    </div>
                                    {puedeQuitar && <button
                                        type="button"
                                        className="competidor-torneo-quitar"
                                        onClick={() => quitarCompetidor(competidor)}
                                        disabled={eliminandoId === competidor.idUsuario}
                                        aria-label={`Quitar a ${competidor.nombre} ${competidor.apellido} del torneo`}
                                    >
                                        {eliminandoId === competidor.idUsuario ? 'Quitando…' : 'Quitar del torneo'}
                                    </button>}
                                </article>
                            ))}
                        </div>}
        </section>
    );
}

export default CompetidoresTorneo;
