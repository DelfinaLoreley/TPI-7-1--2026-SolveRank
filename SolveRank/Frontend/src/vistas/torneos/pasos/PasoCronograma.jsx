import iconoInscripciones from '/src/assets/torneos/inscripcion-azul-icon.svg';
export function PasoCronograma({ actividades }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <div className="creacion-titulo-h2">
                    <img className="icon" src={iconoInscripciones} alt="" />
                    <h2>Cronograma</h2>
                </div>
                <p>Visualizá el cronograma de tu torneo.</p>
            </div>

            {actividades.length > 0 ? (
                <div className="creacion-tabla-cronograma">
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Comienzo</th>
                                <th scope="col">Fin</th>
                                <th scope="col">Actividad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividades.map((actividad) => (
                                <tr key={actividad.id}>
                                    <td>{actividad.comienzo}</td>
                                    <td>{actividad.fin}</td>
                                    <td>
                                        {actividad.icono && <img src={actividad.icono} alt="" />}
                                        {actividad.nombre}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="creacion-nota">
                    Completá la fecha y hora de inicio y seleccioná categorías para generar el cronograma.
                </p>
            )}
            <p className="creacion-nota">
                El cronograma se genera automáticamente a partir del inicio del torneo y las categorías seleccionadas.
            </p>
        </>
    );
}
