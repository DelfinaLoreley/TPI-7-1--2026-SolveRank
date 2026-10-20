import { useState } from 'react';
import './Navbar.css';

import logo from '/src/assets/login/logo.svg';
import inicioSeleccionado from '/src/assets/home/iconos/Home-selected.svg';
import inicioBlanco from '/src/assets/home/iconos/Home-blanco.svg';
import torneosIcon from '/src/assets/home/iconos/torneos-icon.png';
import torneosIconSeleccionado from '/src/assets/home/iconos/torneos-icon-seleccionado.png';
import torneosMundiales from '/src/assets/home/iconos/todos-torneos-blanco-icon.png';
import resultadosIcon from '/src/assets/home/iconos/resultados-icon.png';
import rankingIcon from '/src/assets/home/iconos/rankings-icon.png';
import rankingIconSelected from '/src/assets/home/iconos/ranking-icon-selected.svg';
import recordsIcon from '/src/assets/home/iconos/records-icon.png';
import recordsIconSeleccionado from '/src/assets/home/iconos/records-icon-selected.png';
import liveIcon from '/src/assets/home/iconos/solverank-live-icon.png';
import liveIconSeleccionado from '/src/assets/home/iconos/solverank-live-azul-icon.png';
import searchIcon from '/src/assets/home/iconos/search-icon.png';
import chevronIcon from '/src/assets/home/iconos/chevron-icon.svg';
import chevronIconSelected from '/src/assets/home/iconos/chevron-icon-selected.svg';
import userNotLogged from '/src/assets/home/iconos/icon-user.png';
import userPfp from '/src/assets/home/iconos/user-pfp-icon.png';
import logoutIcon from '/src/assets/home/iconos/logout-icon.png';
import menuCelu from '/src/assets/home/iconos/Menu.png';

function Navbar({
    vistaActiva,
    usuario,
    onInicio,
    onTorneos,
    onMisTorneos,
    onRankings,
    onRecords,
    onPanelOrganizador,
    onIniciarSesion,
    onCerrarSesion,
}) {
    const [menuAbierto, setMenuAbierto] = useState(null);
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
    const sesionIniciada = Boolean(usuario);
    const puedeVerMisTorneos = ['Competidor', 'Juez', 'Delegado', 'Organizador'].includes(usuario?.rol);

    function alternarMenu(menu) {
        setMenuAbierto(menuAbierto === menu ? null : menu);
    }

    function cerrarMenu() {
        setMenuAbierto(null);
        setMenuMovilAbierto(false);
    }

    function irAInicio(event) {
        event.preventDefault();
        cerrarMenu();
        onInicio();
    }

    const menuTorneos = [
        {
            etiqueta: 'Todos',
            href: '#torneos',
            icono: torneosMundiales,
            onClick: onTorneos,
        },
        ...(sesionIniciada && puedeVerMisTorneos
            ? [{
                etiqueta: 'Mis torneos',
                href: '#mis-torneos',
                icono: torneosIcon,
                onClick: onMisTorneos,
            }]
            : []),
    ];

    return (
        <header className={`site-navbar${menuMovilAbierto ? ' menu-movil-abierto' : ''}`}>
            <button
                className="site-navbar-hamburger"
                type="button"
                aria-label={menuMovilAbierto ? 'Cerrar navegación' : 'Abrir navegación'}
                aria-expanded={menuMovilAbierto}
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            >
                <img src={menuCelu} alt="" />
            </button>

            <a
                className="site-navbar-logo"
                href="#inicio"
                onClick={irAInicio}
                aria-label="SolveRank, Inicio"
            >
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
                        className={`site-navbar-link site-navbar-toggle${menuAbierto === 'torneos' || vistaActiva === 'listado-torneos' || vistaActiva === 'mis-torneos' ? ' activo' : ''}`}
                        type="button"
                        aria-expanded={menuAbierto === 'torneos'}
                        onClick={() => alternarMenu('torneos')}
                    >
                        <img
                            src={menuAbierto === 'torneos' || vistaActiva === 'torneos' || vistaActiva === 'listado-torneos' || vistaActiva === 'mis-torneos'
                                ? torneosIconSeleccionado
                                : torneosIcon}
                            alt=""
                        />
                        <span>Torneos</span>
                        <img className="site-navbar-chevron" src={menuAbierto === 'torneos' || vistaActiva === 'torneos' || vistaActiva === 'listado-torneos' || vistaActiva === 'mis-torneos' ? chevronIconSelected : chevronIcon} alt="" />
                    </button>
                    {menuAbierto === 'torneos' && (
                        <div className="site-navbar-dropdown">
                            {menuTorneos.map((item) => (
                                <a href={item.href} key={item.etiqueta} onClick={(evento) => {
                                    if (item.onClick) {
                                        evento.preventDefault();
                                        item.onClick();
                                    }
                                    cerrarMenu();
                                }}>
                                    <img src={item.icono} alt="" />
                                    {item.etiqueta}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <a
                    className={`site-navbar-link${vistaActiva === 'rankings' ? ' activo' : ''}`}
                    href="#rankings"
                    onClick={(evento) => {
                        evento.preventDefault();
                        cerrarMenu();
                        onRankings?.();
                    }}
                >
                    <img src={vistaActiva === 'rankings' ? rankingIconSelected : rankingIcon} alt="" />
                    <span>Rankings</span>
                </a>

                <a className={`site-navbar-link${vistaActiva === 'records' ? ' activo' : ''}`} href="#records" onClick={(evento) => {
                    evento.preventDefault();
                    cerrarMenu();
                    onRecords?.();
                }}>
                    <img src={vistaActiva === 'records' ? recordsIconSeleccionado : recordsIcon} alt="" />
                    <span>Récords</span>
                </a>
                <a className="site-navbar-link" href="#estadisticas" onClick={cerrarMenu}>
                    <img src={vistaActiva === 'live' ? liveIconSeleccionado : liveIcon} alt="" />
                    <span>SolveRank LIVE</span>
                </a>
            </nav>

            <div className="site-navbar-actions">
                <button className="site-navbar-search" type="button" aria-label="Buscar">
                    <img src={searchIcon} alt="" />
                </button>

                {sesionIniciada ? (
                    <div className="site-navbar-user-actions menuPerfil">
                        <button
                            className="PerfilBtn"
                            type="button"
                            aria-expanded={menuAbierto === 'Perfil'}
                            onClick={() => alternarMenu('Perfil')}
                        >
                            <img className="fotoPerfil" src={usuario.avatar_url === null ? userPfp : usuario.avatar_url} alt="" />
                            <img className="site-navbar-chevron chevron-perfil" src={chevronIcon} alt="" />
                        </button>
                        {menuAbierto === 'Perfil' && (
                            <div className="site-navbar-dropdown menuDesplegado">
                                <label>
                                    {usuario.nombre}, {usuario.apellido}
                                </label>
                                <hr className="site-navbar-dropdown-separator" />

                                <a href="#perfil" onClick={cerrarMenu}>
                                    <img src={userNotLogged} alt="" />
                                    Mi Perfil
                                </a>
                                <a href="#configuracion" onClick={cerrarMenu}>
                                    <img src={resultadosIcon} alt="" />
                                    Mis Resultados
                                </a>
                                {puedeVerMisTorneos && <a href="#mis-torneos" onClick={(evento) => {
                                    evento.preventDefault();
                                    cerrarMenu();
                                    onMisTorneos?.();
                                }}>
                                    <img src={torneosIcon} alt="" />
                                    Mis Torneos
                                </a>}
                                {usuario.rol === 'Organizador' && (
                                    <a
                                        href="#panel-organizador"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            cerrarMenu();
                                            onPanelOrganizador?.();
                                        }}
                                    >
                                        <img src={torneosIcon} alt="" />
                                        Panel de organizador
                                    </a>
                                )}

                                <hr className="site-navbar-dropdown-separator" />

                                <button className="site-navbar-logout" onClick={onCerrarSesion}>
                                    <img src={logoutIcon} alt="" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        className="site-navbar-login"
                        type="button"
                        onClick={onIniciarSesion}
                    >
                        <span className="site-navbar-user-icon">
                            <img src={userPfp} alt="" />
                        </span>
                        <span className="site-navbar-login-label">Iniciar sesión</span>
                    </button>
                )}
            </div>
        </header>
    );
}

export default Navbar;
