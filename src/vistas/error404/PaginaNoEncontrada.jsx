import hero404 from '../../assets/hero-404.png';
import './PaginaNoEncontrada.css';

function PaginaNoEncontrada({ onVolverInicio }) {
    return (
        <main className="pagina-no-encontrada">
            <img className="pagina-no-encontrada-hero" src={hero404} alt="Ilustración 404 de SolveRank" />
            <h1>Página <span>no encontrada</span></h1>
            <p>La página que buscás no existe, fue eliminada o tal vez escribiste mal la dirección.</p>
            <button type="button" onClick={onVolverInicio}>
                <span aria-hidden="true">←</span> Volver al Inicio
            </button>
        </main>
    );
}

export default PaginaNoEncontrada;
