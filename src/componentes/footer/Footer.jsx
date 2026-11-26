import './Footer.css';
import logo from '/src/assets/login/logo.svg';
import { useEffect, useState } from 'react';

function Footer({ vistaActiva, onInicio, onTorneos, onRankings, onRecords }) {
    const [llegadaDesdeFooter] = useState(
        () => sessionStorage.getItem('solverank-faq-desde-footer') === 'true'
    );
    const esVistaPreguntasFrecuentes = vistaActiva === 'preguntas-frecuentes';
    const enlacePreguntasFrecuentesActivo = esVistaPreguntasFrecuentes && llegadaDesdeFooter;
    const [llegadaAReglamentoDesdeFooter] = useState(
        () => sessionStorage.getItem('solverank-reglamento-desde-footer') === 'true'
    );
    const esVistaReglamentoOficial = vistaActiva === 'reglas-oficiales';
    const enlaceReglamentoActivo = esVistaReglamentoOficial && llegadaAReglamentoDesdeFooter;

    useEffect(() => {
        sessionStorage.removeItem('solverank-faq-desde-footer');
        sessionStorage.removeItem('solverank-reglamento-desde-footer');
    }, []);

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
                        <a href="#inicio" onClick={(evento) => { evento.preventDefault(); onInicio?.(); }}>Inicio</a>
                        <a href="#torneos" onClick={(evento) => { evento.preventDefault(); onTorneos?.(); }}>Torneos</a>
                        <a href="#rankings" onClick={(evento) => { evento.preventDefault(); onRankings?.(); }}>Resultados</a>
                        <a href="#records" onClick={(evento) => { evento.preventDefault(); onRecords?.(); }}>Récords</a>
                    </div>
                    <div>
                        <h2>Información</h2>
                        <a
                            className={enlacePreguntasFrecuentesActivo ? 'site-footer-link-activo' : undefined}
                            href="/?vista=preguntas-frecuentes"
                            onClick={() => sessionStorage.setItem('solverank-faq-desde-footer', 'true')}
                            aria-current={esVistaPreguntasFrecuentes ? 'page' : undefined}
                        >
                            Preguntas frecuentes
                        </a>
                        <a
                            className={enlaceReglamentoActivo ? 'site-footer-link-activo' : undefined}
                            href="/?vista=reglas-oficiales"
                            onClick={() => sessionStorage.setItem('solverank-reglamento-desde-footer', 'true')}
                            aria-current={esVistaReglamentoOficial ? 'page' : undefined}
                        >
                            Reglamento oficial de la WCA
                        </a>
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
