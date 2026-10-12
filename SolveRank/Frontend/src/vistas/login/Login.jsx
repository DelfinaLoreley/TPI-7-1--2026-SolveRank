import '/src/vistas/login/Login.css';

import logo from '/src/assets/login/logo.svg';
import mailicon from '/src/assets/login/iconos/Mail.svg';
import passwordicon from '/src/assets/login/iconos/password.svg';
import googleIcon from '/src/assets/login/iconos/google-icon.svg';

function Login() {
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
                    <button className="boton-iniciar" type="submit">Iniciar Sesión</button>
                    <button className="boton-iniciar-google" type="submit"> <img src={googleIcon} alt="Google Icon" /> Iniciar Sesión con Google</button>
                    <div className="separator">
                        <hr />
                        <p>ó</p>
                        <hr />
                    </div>
                    <button className="boton-registrar" type="button">Registrarse</button>
                </div>
            </div>
        </div>        
    );
}

export default Login;