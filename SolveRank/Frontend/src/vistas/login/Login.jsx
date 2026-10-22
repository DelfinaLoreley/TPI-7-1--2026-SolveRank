import '/src/vistas/login/login.css';

import logo from '/src/assets/login/logo.svg';
import mailicon from '/src/assets/login/iconos/Mail.svg';
import passwordicon from '/src/assets/login/iconos/password.svg';
import googleIcon from '/src/assets/login/iconos/google-icon.svg';

import axios from '../../axiosApi';

function Login({ onRegister, onLogin }) {
    return (
        <div className="container">
            <div className="Card">
                <div className="CardInfo">
                    <img src={logo} alt="Solverank Logo" className="logo" />
                    <span className="Titulo">BIENVENIDO A SOLVERANK</span> 
                    <div className="input-group"> 
                        <img src={mailicon} alt="Mail Icon" className="img-icon" />
                        <span>Correo electrónico</span>
                    </div>
                    <input className="caja" type="email" placeholder="user@mail.com" />
                    <div className="input-group"> 
                        <img src={passwordicon} alt="Password Icon" className="img-icon" />
                        <span>Contraseña</span>
                    </div>
                    <input className="caja" type="password" placeholder="Contraseña..." />
                    <button className="boton-iniciar" type="submit" onClick={(event) => hacerLogin(event, onLogin)}>Iniciar Sesión</button>
                    <button
                        className="boton-iniciar-google"
                        type="button"
                        onClick={() => { window.location.href = `${axios.defaults.baseURL}/auth/google`; }}
                    >
                        <img src={googleIcon} alt="" /> Iniciar Sesión con Google
                    </button>
                    <div className="separator">
                        <hr />
                        <p>ó</p>
                        <hr />
                    </div>
                    <button className="boton-registrar" type="button" onClick={onRegister}>Registrarse</button>
                </div>
            </div>
        </div>        
    );
}

function hacerLogin(event, onLogin) {
    event.preventDefault();

    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    axios.post('/auth/login', { email, password })
        .then(() => {
            onLogin();
        })
        .catch(error => {
            const message =
                error.response?.data?.mensaje ||
                error.response?.data?.message ||
                'No se pudo conectar con el servidor.';

            alert('No se pudo iniciar sesión: ' + message);
        });
}

export default Login;
