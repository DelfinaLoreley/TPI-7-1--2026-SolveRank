import cuboBanner from '../../assets/home/img-cubo-home.png';
import wcaLogo from '../../assets/login/iconos/wca-logo.svg';
import './ReglamentoOficial.css';

const reglamentos = [
    { articulo: 'Artículo 1', nombre: 'Funcionarios', ancla: 'article-1-functions' },
    { articulo: 'Artículo 2', nombre: 'Competidores', ancla: 'article-2-competitors' },
    { articulo: 'Artículo 3', nombre: 'Rompecabezas', ancla: 'article-3-puzzles' },
    { articulo: 'Artículo 4', nombre: 'Lucha', ancla: 'article-4-scrambling' },
    { articulo: 'Artículo 5', nombre: 'Defectos del rompecabezas', ancla: 'article-5-puzzle-defects' },
    { articulo: 'Artículo 7', nombre: 'Medio ambiente', ancla: 'article-7-environment' },
    { articulo: 'Artículo 9', nombre: 'Eventos', ancla: 'article-9-events' },
    { articulo: 'Artículo 10', nombre: 'Estado resuelto', ancla: 'article-10-solved-state' },
    { articulo: 'Artículo 11', nombre: 'Incidentes', ancla: 'article-11-incidents' },
    { articulo: 'Artículo 12', nombre: 'Notación', ancla: 'article-12-notation' },
    { articulo: 'Artículo A', nombre: 'Resolución rápida', ancla: 'article-a-speedsolving' },
    { articulo: 'Artículo B', nombre: 'Resolución con los ojos vendados', ancla: 'article-b-blindfolded-solving' },
    { articulo: 'Artículo C', nombre: 'Resolución con una sola mano', ancla: 'article-c-one-handed-solving' },
    { articulo: 'Artículo E', nombre: 'Menos movimientos resueltos', ancla: 'article-e-fewest-moves-solving' },
    { articulo: 'Artículo H', nombre: 'Resolución multicega', ancla: 'article-h-multiple-blindfolded-solving' },
    { articulo: 'Artículo I', nombre: 'Solución directa', ancla: 'article-i-solution-final' },
];

const urlReglamentoWca = 'https://www.worldcubeassociation.org/regulations/';

function ReglamentoOficial() {
    return (
        <main className="reglamento-oficial">
            <div className="reglamento-oficial-contenedor">
                <header className="reglamento-oficial-hero">
                    <div className="reglamento-oficial-presentacion">
                        <h1>
                            Reglamento oficial de la WCA
                            <img src={wcaLogo} alt="WCA" />
                        </h1>
                        <p>
                            Acá podés consultar el reglamento oficial de la WCA (World Cube Association) que se aplican a todos los torneos oficiales.
                        </p>
                    </div>
                    <img className="reglamento-oficial-cubo" src={cuboBanner} alt="" />
                </header>

                <article className="reglamento-oficial-documento">
                    <h2>Regulaciones de la WCA</h2>
                    <p className="reglamento-oficial-version">Versión: Abr, 2026</p>

                    <p className="reglamento-oficial-introduccion">
                        Las Regulaciones de la WCA contienen el conjunto completo de Regulaciones que se aplican a todas las competencias oficiales sancionadas por la Asociación Mundial del Cubo.
                        <br />
                        Anteriormente, desde la publicación del 1 de enero de 2013 hasta la publicación del 1 de enero de 2025, las Regulaciones de la WCA se dividieron en las Regulaciones de la WCA y las Directrices de la WCA. El contenido anterior de ambos documentos se combinó en las Regulaciones de la WCA para su publicación el 17 de julio de 2025.
                    </p>

                    <section className="reglamento-oficial-internet" aria-labelledby="reglamento-internet-titulo">
                        <h3 id="reglamento-internet-titulo">Información en Internet</h3>
                        <p>
                            Sitio web de la Asociación Mundial del Cubo:{' '}
                            <a href="https://www.worldcubeassociation.org/" target="_blank" rel="noreferrer">www.worldcubeassociation.org</a>
                            <br />
                            Fuente original de las Regulaciones de la WCA:{' '}
                            <a href={urlReglamentoWca} target="_blank" rel="noreferrer">www.worldcubeassociation.org/regulations</a>
                            <br />
                            Regulaciones de la WCA en{' '}
                            <a href="/documentos-wca/Reglamento%20de%20la%20WCA%202026.pdf" target="_blank" rel="noreferrer">formato PDF</a>
                        </p>
                    </section>

                    <section className="reglamento-oficial-contenido" aria-labelledby="reglamento-contenido-titulo">
                        <h3 id="reglamento-contenido-titulo">Contenido</h3>
                        <p>
                            En esta sección facilitamos el acceso a artículos específicos del reglamento para que puedas encontrar las regulaciones sobre temas específicos.
                        </p>
                        <ul>
                            {reglamentos.map(({ articulo, nombre, ancla }) => (
                                <li key={articulo}>
                                    {articulo}:{' '}
                                    <a href={`${urlReglamentoWca}#${ancla}`} target="_blank" rel="noreferrer">{nombre}</a>
                                </li>
                            ))}
                        </ul>
                    </section>
                </article>
            </div>
        </main>
    );
}

export default ReglamentoOficial;
