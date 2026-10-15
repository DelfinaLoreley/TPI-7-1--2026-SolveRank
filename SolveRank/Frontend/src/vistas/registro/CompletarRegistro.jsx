import { useEffect, useState } from 'react';
import '/src/vistas/login/Login.css';
import logo from '/src/assets/login/logo.svg';
import paisIcon from '/src/assets/registro/pais-icon.svg';
import generoIcon from '/src/assets/registro/genero-icon.png';
import calendarIcon from '/src/assets/registro/calendar-icon.svg';
import axios from '../../axiosApi';

function CompletarRegistro({ onCompletado }) {
    const [paises, setPaises] = useState([]);
    const [generos, setGeneros] = useState([]);
    const [formulario, setFormulario] = useState({ idPais: '', idgenero: '', fechaNacimiento: '' });
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;
        Promise.all([axios.get('/paises'), axios.get('/generos')])
            .then(([paisesRespuesta, generosRespuesta]) => {
                if (!activo) return;
                setPaises(paisesRespuesta.data.paises ?? []);
                setGeneros(generosRespuesta.data.generos ?? []);
            })
            .catch((err) => {
                console.error('No se pudieron cargar países y géneros:', err);
                if (activo) setError('No se pudieron cargar los países y géneros. Intentá nuevamente.');
            })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, []);

    function manejarCambio(event) {
        setFormulario(actual => ({ ...actual, [event.target.name]: event.target.value }));
    }

    async function manejarEnvio(event) {
        event.preventDefault();
        setError('');
        if (!formulario.idPais || !formulario.idgenero || !formulario.fechaNacimiento) {
            setError('Completá país, género y fecha de nacimiento.');
            return;
        }
        if (formulario.fechaNacimiento > new Date().toISOString().slice(0, 10)) {
            setError('La fecha de nacimiento no puede ser futura.');
            return;
        }

        setEnviando(true);
        try {
            await axios.patch('/auth/completar-registro-google', {
                idPais: Number(formulario.idPais),
                idgenero: Number(formulario.idgenero),
                fechaNacimiento: formulario.fechaNacimiento
            });
            await onCompletado();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudo guardar tu perfil. Intentá nuevamente.');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="container">
            <section className="Card" aria-label="Completar registro">
                <form className="CardInfo" onSubmit={manejarEnvio}>
                    <img src={logo} alt="SolveRank" className="logo" />
                    <span className="Titulo">UN PASO MÁS</span>

                    <label className="input-group" htmlFor="completar-pais">
                        <img src={paisIcon} alt="" className="img-icon" />
                        <span>País</span>
                    </label>
                    <select id="completar-pais" className="caja" name="idPais" value={formulario.idPais} onChange={manejarCambio} required disabled={cargando}>
                        <option value="">Seleccioná tu país</option>
                        {paises.map(pais => <option key={pais.idPais} value={pais.idPais}>{pais.pais}</option>)}
                    </select>

                    <label className="input-group" htmlFor="completar-genero">
                        <img src={generoIcon} alt="" className="img-icon" />
                        <span>Género</span>
                    </label>
                    <select id="completar-genero" className="caja" name="idgenero" value={formulario.idgenero} onChange={manejarCambio} required disabled={cargando}>
                        <option value="">Seleccioná tu género</option>
                        {generos.map(genero => <option key={genero.id} value={genero.id}>{genero.genero}</option>)}
                    </select>

                    <label className="input-group" htmlFor="completar-fecha">
                        <img src={calendarIcon} alt="" className="img-icon" />
                        <span>Fecha de nacimiento</span>
                    </label>
                    <input id="completar-fecha" className="caja" type="date" name="fechaNacimiento" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={formulario.fechaNacimiento} onChange={manejarCambio} required />

                    {error && <p role="alert" className="completar-registro-error">{error}</p>}
                    <button className="boton-iniciar" type="submit" disabled={cargando || enviando}>
                        {enviando ? 'Guardando…' : 'Continuar'}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default CompletarRegistro;
