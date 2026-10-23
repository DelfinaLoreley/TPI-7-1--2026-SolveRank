import cubeBanner from '../../assets/img-cubo-banner.png';
import importantIcon from '../../assets/torneos/importante-icon.svg';
import youtubeIcon from '../../assets/torneos/yt-icon.svg';
import './InfoExtraTorneo.css';

function InfoExtraTorneo() {
    return (
        <main className="info-extra-page">
            <div className="info-extra-contenedor">
                <header className="info-extra-hero" style={{ '--info-extra-banner': `url(${cubeBanner})` }}>
                    <h1>Información importante<br />sobre los torneos</h1>
                </header>

                <article className="info-extra-panel">
                    <h2 className="info-extra-titulo-panel">
                        <img src={importantIcon} alt="" />
                        IMPORTANTE
                    </h2>

                    <section className="info-extra-seccion">
                        <h3>Sobre el registro</h3>
                        <ul>
                            <li>Los registros se aceptarán por orden de llegada del e-mail con el comprobante de pago.</li>
                            <li>Quienes no lo hagan quedarán en lista de espera y podrán ingresar por orden según disponibilidad.</li>
                            <li>Recomendamos pagar tras registrarse para asegurar el lugar.</li>
                            <li>Los competidores en espera serán notificados por e-mail si obtienen un lugar.</li>
                        </ul>
                        <p>Dudas y consultas a <a href="mailto:natssantiago2026@googlegroups.com">natssantiago2026@googlegroups.com</a></p>
                    </section>

                    <section className="info-extra-seccion">
                        <h3>Sobre el torneo</h3>
                        <ul>
                            <li>Es de extrema importancia la puntualidad respecto al evento, sugerimos presentarse al menos 15 minutos antes del inicio de cada ronda.</li>
                            <li>Es obligación de los competidores estar familiarizados con el <a href="https://www.worldcubeassociation.org/regulations/">Reglamento de la WCA</a>.</li>
                            <li>Es necesario que <strong>todos los competidores</strong> conozcan el reglamento y se <strong>involucren</strong> ya sea colaborando como <strong>jueces, runners y/o scramblers.</strong></li>
                            <li>De lo contrario no es posible llevar la competencia a tiempo. De negarse a hacerlo se puede incurrir en alguna penalización.</li>
                        </ul>
                        <div className="info-extra-recursos">
                            <a href="https://www.youtube.com/results?search_query=World+Cube+Association+competition+rules+basics" target="_blank" rel="noreferrer">
                                <img src={youtubeIcon} alt="" />
                                Click aquí para un video con reglas básicas sobre cómo competir.
                            </a>
                            <ul>
                                <li><a href="https://documents.worldcubeassociation.org/edudoc/competitor-tutorial/es/tutorial.pdf" target="_blank" rel="noreferrer">Manual de la WCA para COMPETIDORES</a></li>
                                <li><a href="https://documents.worldcubeassociation.org/edudoc/judge-tutorial/judge-tutorial-es.pdf" target="_blank" rel="noreferrer">Manual de la WCA para JUECES NOVATOS</a></li>
                            </ul>
                        </div>
                    </section>

                    <section className="info-extra-seccion">
                        <h3>Términos técnicos</h3>
                        <ul>
                            <li>Tiempo límite: Si alcanzas el tiempo límite durante tu resolución, el juez te detendrá y tu resultado será DNF (<a href="https://www.worldcubeassociation.org/regulations/#A1a4">Regla A1a4</a>).<br />Un Tiempo límite acumulativo puede ser aplicado (Regla A1a2).</li>
                            <li>Formato: El formato describe como determinar la clasificación de los competidores basándose en sus resultados. La lista de formatos permitidos está descrita en <a href="https://www.worldcubeassociation.org/regulations/#9b">Regla 9b</a>. Ver <a href="https://www.worldcubeassociation.org/regulations/#9f">Regla 9f</a> para una descripción de cada formato.</li>
                        </ul>
                    </section>
                </article>
            </div>
        </main>
    );
}

export default InfoExtraTorneo;