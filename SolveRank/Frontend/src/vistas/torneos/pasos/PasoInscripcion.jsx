import iconoInscripciones from '/src/assets/torneos/inscripcion-azul-icon.svg';
import { Campo } from './CamposTorneo';

export function PasoInscripcion({ formulario, onCambio, error }) {
    return (
        <>
            <div className="creacion-seccion-intro">
                <h2>
                    <img src={iconoInscripciones} alt="" />
                    Inscripciones
                </h2>
                <p>Completá datos de la inscripción.</p>
            </div>

            <div className="creacion-inscripcion-grid">
                <Campo
                    etiqueta="Fecha Apertura"
                    type="date"
                    name="aperturaInscripcion"
                    value={formulario.aperturaInscripcion}
                    onChange={onCambio}
                    error={error.aperturaInscripcion}
                />
                <Campo
                    etiqueta="Fecha Cierre"
                    type="date"
                    name="cierreInscripcion"
                    value={formulario.cierreInscripcion}
                    onChange={onCambio}
                    error={error.cierreInscripcion}
                />
                <Campo
                    etiqueta="Límite de competidores"
                    type="number"
                    name="cupoMaximo"
                    min="1"
                    max="10000"
                    placeholder="Ej.: 200"
                    value={formulario.cupoMaximo}
                    onChange={onCambio}
                    error={error.cupoMaximo}
                />
            </div>
        </>
    );
}
