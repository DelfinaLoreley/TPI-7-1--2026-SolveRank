import '/src/login/Login.css';

import mailicon from '/src/assets/iconos/Mail.svg';
import passwordicon from '/src/assets/iconos/password.svg';

function Login() {
    return (
        <div className="container">
            <div className="Card">
                <div className="CardInfo">
                    <img src="/src/assets/logo.svg" alt="Solverank Logo" className="logo" />
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