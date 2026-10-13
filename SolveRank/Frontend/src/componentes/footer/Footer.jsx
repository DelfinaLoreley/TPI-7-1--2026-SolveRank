import './Footer.css';
import logo from '/src/assets/login/logo.svg';

function Footer() {
    return (
        <footer className="site-footer-container">
            <div className="site-footer-content">
                <div className="site-footer">
                    <div className="site-footer-brand">
                        <img src={logo} alt="SolveRank" />
                        <p>Plataforma de gestión de <br />torneos de speedcubing.<br />Hecha por speedcubers,<br />para speedcubers.</p>
                    </div>
                    <div>
                        <h2>Navegación</h2>
                        <a href="#inicio">Inicio</a>
                        <a href="#torneos">Torneos</a>
                        <a href="#rankings">Resultados</a>
                        <a href="#rankings">Récords</a>
                    </div>
                    <div>
                        <h2>Información</h2>
                        <a href="#informacion">Preguntas frecuentes</a>
                        <a href="#informacion">Reglamento oficial de la WCA</a>
                    </div>
                </div>
                <div className="site-footer-copyright">
                    © 2026 SolveRank - TPI 7º1º Delfina Loreley Gutierrez. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
}

export default Footer;
