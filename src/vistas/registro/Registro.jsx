
import { useEffect, useState } from 'react';
import './registro.css';

import logo from '/src/assets/login/logo.svg';
import mailIcon from '/src/assets/login/iconos/Mail.svg';
import passwordIcon from '/src/assets/login/iconos/password.svg';
import calendarIcon from '/src/assets/registro/calendar-icon.svg';
import generoIcon from '/src/assets/registro/genero-icon.png';
import wcaIcon from '/src/assets/registro/wca-logo.svg';
import nombreIcon from '/src/assets/registro/nombre-icon.svg';
import paisIcon from '/src/assets/registro/pais-icon.svg';
import ocultarIcon from '/src/assets/registro/ocultar-icon.svg';

import axios from '../../axiosApi';

function Registro({ onRegistroExitoso, onVolverLogin }) {
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    const [paises, setPaises] = useState([]);
    const [generos, setGeneros] = useState([]);

    const [cargandoListas, setCargandoListas] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    const [formulario, setFormulario] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmarPassword: '',
        idPais: '',
        idgenero: '1',
        fechaNacimiento: '',
        wcaid: ''
    });

    useEffect(() => {
        let activo = true;

        async function cargarListas() {
            try {
                const [respuestaPaises, respuestaGeneros] =
                    await Promise.all([
                        axios.get('/paises'),
                        axios.get('/generos')
                    ]);

                if (!activo) return;

                setPaises(respuestaPaises.data.paises ?? []);
                setGeneros(respuestaGeneros.data.generos ?? []);
            } catch (err) {
                console.error('Error al cargar las listas:', err);

                if (activo) {
                    setError(
                        'No se pudieron cargar los países y géneros. Verificá que el backend esté funcionando.'
                    );
                }
            } finally {
                if (activo) {
                    setCargandoListas(false);
                }
            }
        }

        cargarListas();

        return () => {
            activo = false;
        };
    }, []);

    function manejarCambio(event) {
        const { name, value } = event.target;

        setFormulario(actual => ({
            ...actual,
            [name]: value
        }));
    }

    async function manejarRegistro(event) {
        event.preventDefault();
        setError('');

        const nombre = formulario.nombre.trim();
        const apellido = formulario.apellido.trim();
        const email = formulario.email.trim();
        const wcaid = formulario.wcaid.trim();

        if (!nombre || !apellido || !email ||
            !formulario.password || !formulario.idPais) {
            setError('Completá todos los campos obligatorios.');
            return;
        }

        if (nombre.length > 50 || apellido.length > 50) {
            setError('El nombre y el apellido admiten hasta 50 caracteres.');
            return;
        }

        if (formulario.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (
            new TextEncoder().encode(formulario.password).length > 72
        ) {
            setError('La contraseña supera el máximo permitido.');
            return;
        }

        if (formulario.password !== formulario.confirmarPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (
            formulario.fechaNacimiento &&
            formulario.fechaNacimiento > new Date().toLocaleDateString(
                'en-CA'
            )
        ) {
            setError('La fecha de nacimiento no puede ser futura.');
            return;
        }

        setEnviando(true);

        try {
            await axios.post('/auth/registro', {
                nombre,
                apellido,
                email,
                password: formulario.password,
                idPais: Number(formulario.idPais),
                idgenero: Number(formulario.idgenero),
                fechaNacimiento: formulario.fechaNacimiento || null,
                wcaid: wcaid || null
            });

            // El backend crea la sesión al registrar.
            // App consulta /auth/miusuario y vuelve a Home.
            await onRegistroExitoso();
        } catch (err) {
            console.error('Error al registrar:', err);

            setError(
                err.response?.data?.mensaje ||
                'No se pudo completar el registro. Intentá nuevamente.'
            );
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="registro-page">
            <section
                className="registro-card"
                aria-label="Formulario de registro"
            >
                <img
                    src={logo}
                    alt="SolveRank"
                    className="registro-logo"
                />

                <h1 className="registro-titulo">
                    BIENVENIDO A SOLVERANK
                </h1>

                <form
                    className="registro-form"
                    onSubmit={manejarRegistro}
                >
                    <div className="registro-campos">
                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-nombre"
                            >
                                <img src={nombreIcon} alt="" />
                                Nombre
                            </label>

                            <input
                                id="registro-nombre"
                                name="nombre"
                                type="text"
                                autoComplete="given-name"
                                maxLength={50}
                                placeholder="Tu nombre"
                                value={formulario.nombre}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-apellido"
                            >
                                <img src={nombreIcon} alt="" />
                                Apellido
                            </label>

                            <input
                                id="registro-apellido"
                                name="apellido"
                                type="text"
                                autoComplete="family-name"
                                maxLength={50}
                                placeholder="Tu apellido"
                                value={formulario.apellido}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-email"
                            >
                                <img src={mailIcon} alt="" />
                                Correo electrónico
                            </label>

                            <input
                                id="registro-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                maxLength={100}
                                placeholder="user@email.com"
                                value={formulario.email}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-pais"
                            >
                                <img src={paisIcon} alt="" />
                                Tu país
                            </label>

                            <div className="registro-control-con-icono">
                                <select
                                    id="registro-pais"
                                    name="idPais"
                                    value={formulario.idPais}
                                    onChange={manejarCambio}
                                    required
                                >
                                    <option value="">
                                        Seleccioná tu país
                                    </option>

                                    {paises.map(pais => (
                                        <option
                                            key={pais.idPais}
                                            value={pais.idPais}
                                        >
                                            {pais.pais}
                                        </option>
                                    ))}
                                </select>

                                <span
                                    className="registro-chevron"
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-contrasena"
                            >
                                <img src={passwordIcon} alt="" />
                                Contraseña
                            </label>

                            <div className="registro-control-con-icono">
                                <input
                                    id="registro-contrasena"
                                    name="password"
                                    type={
                                        mostrarContrasena
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                    placeholder="Mínimo 8 caracteres"
                                    value={formulario.password}
                                    onChange={manejarCambio}
                                    required
                                />

                                <button
                                    className="registro-mostrar-contrasena"
                                    type="button"
                                    aria-label={
                                        mostrarContrasena
                                            ? 'Ocultar contraseña'
                                            : 'Mostrar contraseña'
                                    }
                                    onClick={() =>
                                        setMostrarContrasena(v => !v)
                                    }
                                >
                                    <img src={ocultarIcon} alt="" />
                                </button>
                            </div>
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-confirmar"
                            >
                                <img src={passwordIcon} alt="" />
                                Confirmar contraseña
                            </label>

                            <div className="registro-control-con-icono">
                                <input
                                    id="registro-confirmar"
                                    name="confirmarPassword"
                                    type={
                                        mostrarConfirmacion
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete="new-password"
                                    placeholder="Repetí tu contraseña"
                                    value={formulario.confirmarPassword}
                                    onChange={manejarCambio}
                                    required
                                />

                                <button
                                    className="registro-mostrar-contrasena"
                                    type="button"
                                    aria-label={
                                        mostrarConfirmacion
                                            ? 'Ocultar contraseña'
                                            : 'Mostrar contraseña'
                                    }
                                    onClick={() =>
                                        setMostrarConfirmacion(v => !v)
                                    }
                                >
                                    <img src={ocultarIcon} alt="" />
                                </button>
                            </div>
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-fecha"
                            >
                                <img src={calendarIcon} alt="" />
                                Fecha de nacimiento
                            </label>

                            <input
                                id="registro-fecha"
                                name="fechaNacimiento"
                                type="date"
                                autoComplete="bday"
                                max={new Date().toLocaleDateString('en-CA')}
                                value={formulario.fechaNacimiento}
                                onChange={manejarCambio}
                            />
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-genero"
                            >
                                <img src={generoIcon} alt="" />
                                Género
                            </label>

                            <div className="registro-control-con-icono">
                                <select
                                    id="registro-genero"
                                    name="idgenero"
                                    value={formulario.idgenero}
                                    onChange={manejarCambio}
                                    required
                                >
                                    {generos.map(genero => (
                                        <option
                                            key={genero.id}
                                            value={genero.id}
                                        >
                                            {genero.genero}
                                        </option>
                                    ))}
                                </select>

                                <span
                                    className="registro-chevron"
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        <div className="registro-campo">
                            <label
                                className="registro-label"
                                htmlFor="registro-wca"
                            >
                                <img src={wcaIcon} alt="" />
                                WCA ID (opcional)
                            </label>

                            <input
                                id="registro-wca"
                                name="wcaid"
                                type="text"
                                maxLength={20}
                                placeholder="Ej.: 2019GUTI01"
                                value={formulario.wcaid}
                                onChange={manejarCambio}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="registro-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="registro-boton"
                        type="submit"
                        disabled={enviando || cargandoListas}
                    >
                        {enviando
                            ? 'Registrando...'
                            : 'Registrarse'}
                    </button>

                    {onVolverLogin && (
                        <button
                            className="registro-volver-login"
                            type="button"
                            onClick={onVolverLogin}
                        >
                            ¿Ya tenés cuenta? Iniciar sesión
                        </button>
                    )}
                </form>
            </section>
        </main>
    );
}

export default Registro;
