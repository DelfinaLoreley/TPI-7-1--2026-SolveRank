import { useState } from 'react';
import './Navbar.css';

import logo from '/src/assets/login/logo.svg';
import inicioSeleccionado from '/src/assets/home/iconos/Home-selected.svg';
import inicioBlanco from '/src/assets/home/iconos/Home-blanco.svg';
import torneosIcon from '/src/assets/home/iconos/torneos-icon.png';
import torneosIconSeleccionado from '/src/assets/home/iconos/torneos-icon-seleccionado.png';
import torneosMundiales from '/src/assets/home/iconos/todos-torneos-blanco-icon.png';
import resultadosIcon from '/src/assets/home/iconos/resultados-icon.png';
import resultadosIconSeleccionado from '/src/assets/home/iconos/resultados-icon-selected.png';
import rankingIcon from '/src/assets/home/iconos/rankings-icon.png';
import recordsIcon from '/src/assets/home/iconos/records-icon.png';
import recordsIconSeleccionado from '/src/assets/home/iconos/records-icon-selected.png';
import liveIcon from '/src/assets/home/iconos/solverank-live-icon.png';
import liveIconSeleccionado from '/src/assets/home/iconos/solverank-live-azul-icon.png';
import searchIcon from '/src/assets/home/iconos/search-icon.png';
import chevronIcon from '/src/assets/home/iconos/chevron-icon.png';
import userNotLogged from '/src/assets/home/iconos/icon-user.png';

const menuItems = {
    torneos: [
        { etiqueta: 'Todos', href: '#torneos', icono: torneosMundiales },
        { etiqueta: 'Mis torneos', href: '#mis-torneos', icono: torneosIcon },
    ],
    resultados: [
        { etiqueta: 'Rankings', href: '#rankings', icono: rankingIcon },
        { etiqueta: 'Récords', href: '#records', icono: recordsIcon },
        { etiqueta: 'Mis resultados', href: '#mis-resultados', icono: resultadosIcon },
    ],
};

function Navbar({ vistaActiva, onInicio, onIniciarSesion }) {
    const [menuAbierto, setMenuAbierto] = useState(null);

    function alternarMenu(menu) {
        setMenuAbierto(menuAbierto === menu ? null : menu);
    }

    function cerrarMenu() {
        setMenuAbierto(null);
    }

    function irAInicio(event) {
        event.preventDefault();
        cerrarMenu();
        onInicio();
    }

    return (
        <header className="site-navbar">
            <a className="site-navbar-logo" href="#inicio" onClick={irAInicio} aria-label="SolveRank, Inicio">
                <img src={logo} alt="SolveRank" />
            </a>

            <nav className="site-navbar-links" aria-label="Navegación principal">
                <a
                    className={`site-navbar-link${vistaActiva === 'home' ? ' activo' : ''}`}
                    href="#inicio"
                    onClick={irAInicio}
                >
                    <img src={vistaActiva === 'home' ? inicioSeleccionado : inicioBlanco} alt="" />
                    <span>Inicio</span>
                </a>

                <div className="site-navbar-menu">
                    <button
                        className={`site-navbar-link site-navbar-toggle${menuAbierto === 'torneos' ? ' activo' : ''}`}
                        type="button"
                        aria-expanded={menuAbierto === 'torneos'}
                        onClick={() => alternarMenu('torneos')}
                    >
                        <img src={menuAbierto === 'torneos' || vistaActiva === 'torneos' ? torneosIconSeleccionado : torneosIcon} alt="" />
                        <span>Torneos</span>
                        <img className="site-navbar-chevron" src={chevronIcon} alt="" />
                    </button>
                    {menuAbierto === 'torneos' && (
                        <div className="site-navbar-dropdown">
                            {menuItems.torneos.map((item) => (
                                <a href={item.href} key={item.etiqueta} onClick={cerrarMenu}>
                                    <img src={item.icono} alt="" />
                                    {item.etiqueta}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="site-navbar-menu">
                    <button
                        className={`site-navbar-link site-navbar-toggle${menuAbierto === 'resultados' ? ' activo' : ''}`}
                        type="button"
                        aria-expanded={menuAbierto === 'resultados'}
                        onClick={() => alternarMenu('resultados')}
                    >
                        <img src={menuAbierto === 'resultados' || vistaActiva === 'resultados' ? resultadosIconSeleccionado : resultadosIcon} alt="" />
                        <span>Resultados</span>
                        <img className="site-navbar-chevron" src={chevronIcon} alt="" />
                    </button>
                    {menuAbierto === 'resultados' && (
                        <div className="site-navbar-dropdown">
                            {menuItems.resultados.map((item) => (
                                <a href={item.href} key={item.etiqueta} onClick={cerrarMenu}>
                                    <img src={item.icono} alt="" />
                                    {item.etiqueta}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <a className="site-navbar-link" href="#records">
                    <img src={vistaActiva === 'records' ? recordsIconSeleccionado : recordsIcon} alt="" />
                    <span>Récords</span>
                </a>
                <a className="site-navbar-link" href="#estadisticas">
                    <img src={vistaActiva === 'live' ? liveIconSeleccionado : liveIcon} alt="" />
                    <span>SolveRank LIVE</span>
                </a>
            </nav>

            <div className="site-navbar-actions">
                <button className="site-navbar-search" type="button" aria-label="Buscar"> <img src={searchIcon} alt="" /> </button> 
                <button className="site-navbar-login" type="button" onClick={onIniciarSesion}>
                    <span className="site-navbar-user-icon"><img src={userNotLogged}/></span>
                    Iniciar sesión
                </button>
            </div>
        </header>
    );
}

export default Navbar;
