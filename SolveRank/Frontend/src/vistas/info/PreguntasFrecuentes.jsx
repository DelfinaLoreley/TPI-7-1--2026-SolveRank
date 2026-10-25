import categoriasIcon from '../../assets/torneos/categorias-azul-icon.png';
import faqBanner from '../../assets/home/img-cubo-hom.png';
import './PreguntasFrecuentes.css';

const preguntas = [
    {
        pregunta: '¿Qué es SolveRank?',
        respuesta: <>SolveRank es una plataforma de gestión y seguimiento de competiciones de speedcubing. Permite explorar torneos, consultar eventos, conocer resultados, ver rankings y récords, y acceder a información de competidores. También ofrece herramientas para que los organizadores puedan gestionar sus torneos de manera más sencilla.</>,
    },
    {
        pregunta: '¿SolveRank es una plataforma oficial de la WCA?',
        respuesta: <>No. SolveRank es una plataforma independiente, inspirada en la estructura y las prácticas de la comunidad de speedcubing. No es un sitio oficial de la World Cube Association (WCA) ni está afiliada a ella. Para consultar el reglamento oficial, podés visitar la <a href="https://www.worldcubeassociation.org/" target="_blank" rel="noreferrer">página de la WCA</a>.</>,
    },
    {
        pregunta: '¿Necesito una cuenta para poder ver torneos?',
        respuesta: <>No. Podés explorar los torneos disponibles y consultar la información pública sin crear una cuenta. Sin embargo, algunas funciones, como inscribirte a una competición o acceder a determinadas herramientas de usuario, pueden requerir que inicies sesión.</>,
    },
    {
        pregunta: '¿Es gratuito usar SolveRank?',
        respuesta: <>Sí, consultar la información pública de SolveRank es gratuito. La participación en los torneos puede tener un costo de inscripción establecido por sus organizadores. Si un torneo tiene una tarifa, podrás consultar sus condiciones en la información correspondiente.</>,
    },
    {
        pregunta: '¿Cómo me puedo inscribir a un torneo?',
        respuesta: <>Primero, ingresá a la sección Torneos y elegí la competición en la que querés participar. Revisá las fechas, los eventos disponibles, los requisitos y las condiciones de inscripción. Después, iniciá sesión o creá una cuenta si todavía no tenés una, y seguí los pasos indicados en la página del torneo. Tené en cuenta que algunos torneos pueden requerir aprobación del organizador.</>,
    },
    {
        pregunta: '¿Qué es un evento dentro de una competición?',
        respuesta: <>Un evento es una disciplina específica de speedcubing en la que podés competir. Por ejemplo, 3x3x3, 2x2x2, 4x4x4, Pyraminx o Megaminx. Cada torneo puede ofrecer diferentes eventos y establecer sus propias rondas, horarios y condiciones de participación.</>,
    },
    {
        pregunta: '¿Cómo puedo consultar mis resultados?',
        respuesta: <>Podés acceder a la sección de resultados de un torneo para consultar las posiciones y los tiempos registrados de los competidores. Si tenés una cuenta, también podrás consultar la información asociada a tu perfil, según las funcionalidades disponibles en SolveRank.</>,
    },
    {
        pregunta: '¿Cuál es la diferencia entre un ranking y un récord?',
        respuesta: <><p>Un ranking muestra la posición de un competidor en comparación con otros, según determinados criterios, como el país, el género, el evento o el tipo de resultado.</p><p>Un récord representa una marca destacada obtenida en una disciplina. Puede corresponder a un single —el mejor tiempo de un intento— o a un promedio, calculado a partir de varios intentos según el formato de la competición.</p></>,
    },
    {
        pregunta: '¿Qué significa single y qué significa promedio?',
        respuesta: <><p>El single es el mejor tiempo conseguido en un intento individual.</p><p>El promedio se calcula a partir de varios intentos, siguiendo el formato correspondiente al evento. En el formato habitual de promedio de cinco, se descartan el mejor y el peor tiempo, y se promedian los tres restantes.</p></>,
    },
    {
        pregunta: '¿Cómo puedo organizar un torneo en SolveRank?',
        respuesta: <>Si querés organizar una competición, necesitás acceder a las herramientas de organización disponibles en la plataforma. Desde allí podrás crear un torneo, configurar sus eventos, definir las condiciones de inscripción y gestionar la información de la competición. Las funciones disponibles dependerán de los permisos de tu cuenta.</>,
    },
    {
        pregunta: '¿Cómo puedo participar como juez en un torneo?',
        respuesta: <>Los jueces colaboran durante las competiciones verificando que los intentos se desarrollen correctamente y siguiendo las reglas aplicables. Si SolveRank permite asignaciones de jueces para un torneo, podrás consultar las oportunidades disponibles y seguir las indicaciones del organizador para participar.</>,
    },
    {
        pregunta: '¿Qué hago si encuentro un error en mis resultados o en mi perfil?',
        respuesta: <>Si detectás un dato incorrecto, te recomendamos contactar al organizador del torneo cuando el error esté relacionado con los resultados de una competición. Si el problema corresponde a tu cuenta o a una función de la plataforma, podés comunicarte con el equipo de SolveRank desde la sección Contacto.</>,
    },
    {
        pregunta: '¿Los resultados y rankings se actualizan en tiempo real?',
        respuesta: <>Durante las competiciones, SolveRank puede mostrar resultados en vivo cuando la organización carga y publica los tiempos. La actualización de los rankings y récords dependerá de cómo se procesen y publiquen los resultados en la plataforma.</>,
    },
    {
        pregunta: '¿Puedo consultar el reglamento oficial del speedcubing en SolveRank?',
        respuesta: <>Sí. SolveRank cuenta con una sección destinada a mostrar las reglas oficiales de la World Cube Association como referencia para los competidores. El reglamento puede actualizarse, por lo que recomendamos consultar también la <a href="https://www.worldcubeassociation.org/regulations/" target="_blank" rel="noreferrer">página oficial de Reglamentos de la WCA</a> para asegurarte de estar leyendo la versión vigente.</>,
    },
];

function PreguntasFrecuentes() {
    return (
        <main className="preguntas-frecuentes">
            <div className="preguntas-frecuentes-contenedor">
                <header className="preguntas-frecuentes-hero">
                    <div>
                        <h1>Preguntas Frecuentes</h1>
                        <p>Encontrá respuestas rápidas a dudas comunes sobre SolveRank, los torneos y el sistema.</p>
                    </div>
                    <div className="preguntas-frecuentes-ilustracion" aria-hidden="true">
                        <img src={faqBanner} alt="" />
                        <span>?</span>
                    </div>
                </header>

                <section className="preguntas-frecuentes-lista" aria-label="Preguntas frecuentes">
                    {preguntas.map(({ pregunta, respuesta }, indice) => (
                        <details className="pregunta-frecuente" name="preguntas-solverank" open={indice === 0} key={pregunta}>
                            <summary>
                                <img src={categoriasIcon} alt="" />
                                <span>{pregunta}</span>
                                <span className="pregunta-frecuente-chevron" aria-hidden="true" />
                            </summary>
                            <div className="pregunta-frecuente-respuesta">{respuesta}</div>
                        </details>
                    ))}
                </section>
            </div>
        </main>
    );
}

export default PreguntasFrecuentes;
