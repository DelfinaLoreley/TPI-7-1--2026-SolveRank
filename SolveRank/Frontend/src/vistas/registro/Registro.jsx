import logo from '/src/assets/login/logo.svg';
import mailicon from '/src/assets/login/iconos/Mail.svg';
import passwordicon from '/src/assets/login/iconos/password.svg';
import calendarIcon from 'src/assets/registro/calendar-icon.svg';
import generoIcon from 'src/assets/registro/genero-icon.png';
import wcaIcon from 'src/assets/registro/wca-logo.svg';
import nombreIcon from 'src/assets/registro/nombre-icon.svg';
import paisIcon from 'src/assets/reistro/pais-icon.svg';


function Registro() {
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
                    <div className="input-group"> 
                        <img src={passwordicon} alt="Password Icon" className="img-icon" />
                        <span>Confirmar contraseña</span>
                    </div>
                    <input className="caja" type="password" placeholder="Contraseña..." />
                    <div className="input-group"> 
                        <img src={nombreIcon} alt="Name Icon" className="img-icon" />
                        <span>Nombre completo</span>
                    </div>
                    <input className="caja" type="text" placeholder="Nombre Apellido" />
                    <div className="input-group"> 
                        <img src={paisIcon} alt="Pais Icon" className="img-icon" />
                        <span>Tu país</span>
                    </div>
                    <input className="caja" type="text" placeholder="Ingresa tu país de origen" />
                    <div className="input-group"> 
                        <img src={calendarIcon} alt="Calendar Icon" className="img-icon" />
                        <span>Fecha de nacimiento</span>
                    </div>
                    <input className="caja" type="date" placeholder="DD/MM/YY" />
                    <div className="input-group"> 
                        <img src={wcaIcon} alt="WCA Icon" className="img-icon" />
                        <span>WCA ID (opcional)</span>
                    </div>
                    <input className="caja" type="text" placeholder="Ingresa tu ID de la WCA (si tienes)" />
                    <div className="input-group"> 
                        <img src={generoIcon} alt="Género Icon" className="img-icon" />
                        <span>Género</span>
                    </div>
                    <input className="caja" type="text" placeholder="Masculino" />

                    <button className="boton-iniciar" type="submit">Registrarse</button>
                </div>
            </div>
        </div>        
    );
}

export default Registro;