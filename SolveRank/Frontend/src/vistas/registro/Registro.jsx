import { useState } from 'react';
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

function Registro() {
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    return (
        <main className="registro-page">
            <section className="registro-card" aria-label="Formulario de registro">
                <img src={logo} alt="SolveRank" className="registro-logo" />
                <h1 className="registro-titulo">BIENVENIDO A SOLVERANK</h1>

                <form className="registro-form">
                    <div className="registro-campos">
                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-email">
                                <img src={mailIcon} alt="" />
                                Correo electrónico
                            </label>
                            <input id="registro-email" type="email" placeholder="user@email.com" />
                        </div>

                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-pais">
                                <img src={paisIcon} alt="" />
                                Tu país
                            </label>
                            <div className="registro-control-con-icono">
                                <input id="registro-pais" type="text" placeholder="Ingresa tu país de origen" />
                                <span className="registro-chevron" aria-hidden="true" />
                            </div>
                        </div>

                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-contrasena">
                                <img src={passwordIcon} alt="" />
                                Contraseña
                            </label>
                            <div className="registro-control-con-icono">
                                <input
                                    id="registro-contrasena"
                                    type={mostrarContrasena ? 'text' : 'password'}
                                    placeholder="Contraseña..."
                                />
                                <button
                                    className="registro-mostrar-contrasena"
                                    type="button"
                                    aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                >
                                    <img src={ocultarIcon} alt="" />
                                </button>
                            </div>
                        </div>

                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-fecha">
                                <img src={calendarIcon} alt="" />
                                Fecha de Nacimiento
                            </label>
                            <input id="registro-fecha" type="date" lang="es" />
                        </div>

                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-confirmar">
                                <img src={passwordIcon} alt="" />
                                Confirmar contraseña
                            </label>
                            <div className="registro-control-con-icono">
                                <input
                                    id="registro-confirmar"
                                    type={mostrarConfirmacion ? 'text' : 'password'}
                                    placeholder="Contraseña..."
                                />
                                <button
                                    className="registro-mostrar-contrasena"
                                    type="button"
                                    aria-label={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                                >
                                    <img src={ocultarIcon} alt="" />
                                </button>
                            </div>
                        </div>

                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-wca">
                                <img src={wcaIcon} alt="" />
                                WCA ID (opcional)
                            </label>
                            <input id="registro-wca" type="text" placeholder="Ingresa tu ID de la WCA (si tienes)" />
                        </div>

                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-nombre">
                                <img src={nombreIcon} alt="" />
                                Nombre completo
                            </label>
                            <input id="registro-nombre" type="text" placeholder="Nombre Apellido" />
                        </div>

                        <div className="registro-campo">
                            <label className="registro-label" htmlFor="registro-genero">
                                <img src={generoIcon} alt="" />
                                Género
                            </label>
                            <div className="registro-control-con-icono">
                                <select id="registro-genero" defaultValue="Masculino">
                                    <option>Masculino</option>
                                    <option>Femenino</option>
                                </select>
                                <span className="registro-chevron" aria-hidden="true" />
                            </div>
                        </div>
                    </div>

                    <button className="registro-boton" type="button">Registrarse</button>
                </form>
            </section>
        </main>
    );
}

export default Registro;
