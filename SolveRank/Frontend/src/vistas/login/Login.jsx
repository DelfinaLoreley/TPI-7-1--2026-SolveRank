import '/src/vistas/login/Login.css';

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
                    <button className="boton-iniciar-google" type="submit"> <img src={googleIcon} alt="Google Icon" /> Iniciar Sesión con Google</button>
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
    
    console.log('Email:', email);
    console.log('Password:', password);

    // Realizar la solicitud de inicio de sesión al backend pasando los datos de email y password como json
    axios.post('/auth/login', { email, password })
        .then(response => {
            console.log('Login successful:', response.data);
            onLogin();
        })
        .catch(error => {
            const message = error.response?.data?.message || 'No se pudo conectar con el servidor.';
            console.error('Login failed:', message, error);
            alert('Login failed: ' + message);
        });

}

export default Login;