import { useCallback, useEffect, useRef, useState } from 'react';
import axios from '../../axiosApi';
import Swal from 'sweetalert2';
import './GestionRoles.css';

import lupaIcon from '/src/assets/icons/search-icon.png';
import gestionIcon from '/src/assets/torneos/documentacion-azul-icon.svg';

const formularioVacio = {
    nombre: '', apellido: '', email: '', password: '', idPais: '', idGenero: '1',
    fechaNacimiento: '', wcaid: '', idTipoUsuario: '',
};

function nombreCompleto(usuario) {
    return [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');
}

export default function GestionRoles({ usuario, onVolver }) {
    const [seccion, setSeccion] = useState('roles');
    const [busqueda, setBusqueda] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [roles, setRoles] = useState([]);
    const [rolSeleccionado, setRolSeleccionado] = useState('');
    const [paises, setPaises] = useState([]);
    const [generos, setGeneros] = useState([]);
    const [nuevoUsuario, setNuevoUsuario] = useState(formularioVacio);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mostrarOpciones, setMostrarOpciones] = useState(false);
    const temporizador = useRef(null);

    const cargarUsuarios = useCallback(async (termino = '') => {
        setCargando(true);
        try {
            const { data } = await axios.get('/admin/usuarios', { params: termino ? { buscar: termino } : {} });
            setUsuarios(data.usuarios ?? []);
        } catch (err) {
            setError(err?.response?.data?.mensaje || 'No se pudieron cargar los usuarios.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        let activo = true;
        Promise.all([axios.get('/admin/roles'), axios.get('/paises'), axios.get('/generos')])
            .then(([rolesResp, paisesResp, generosResp]) => {
                if (!activo) return;
                setRoles(rolesResp.data.roles ?? []);
                setPaises(paisesResp.data.paises ?? []);
                setGeneros(generosResp.data.generos ?? []);
            })
            .catch((err) => {
                if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar los datos del formulario.');
            });
        return () => {
            activo = false;
            window.clearTimeout(temporizador.current);
        };
    }, []);

    useEffect(() => {
        if (seccion === 'usuarios') cargarUsuarios();
    }, [seccion, cargarUsuarios]);

    function buscarUsuarios(valor) {
        setBusqueda(valor);
        setUsuarioSeleccionado(null);
        setRolSeleccionado('');
        setMensaje('');
        setError('');
        window.clearTimeout(temporizador.current);
        if (valor.trim().length < 2) {
            setUsuarios([]);
            setMostrarOpciones(false);
            setCargando(false);
            return;
        }
        setCargando(true);
        temporizador.current = window.setTimeout(async () => {
            try {
                const { data } = await axios.get('/admin/usuarios', { params: { buscar: valor.trim() } });
                setUsuarios(data.usuarios ?? []);
                setMostrarOpciones(true);
            } catch (err) {
                setError(err?.response?.data?.mensaje || 'No se pudieron buscar usuarios.');
                setUsuarios([]);
            } finally {
                setCargando(false);
            }
        }, 250);
    }

    function seleccionarUsuario(seleccionado) {
        setUsuarioSeleccionado(seleccionado);
        setBusqueda(nombreCompleto(seleccionado));
        setRolSeleccionado(String(seleccionado.idTipoUsuario));
        setMostrarOpciones(false);
        setError('');
        setMensaje('');
    }

    async function confirmarCambio(evento) {
        evento.preventDefault();
        if (!usuarioSeleccionado || !rolSeleccionado) return;
        if (Number(usuarioSeleccionado.idUsuario) === Number(usuario?.idUsuario)) {
            setError('No podés cambiar tu propio rol.');
            return;
        }
        if (Number(rolSeleccionado) === Number(usuarioSeleccionado.idTipoUsuario)) {
            setError('Ese usuario ya tiene el rol seleccionado.');
            return;
        }
        setGuardando(true);
        setError('');
        setMensaje('');
        try {
            const { data } = await axios.put(`/admin/usuarios/${usuarioSeleccionado.idUsuario}/rol`, {
                idTipoUsuario: Number(rolSeleccionado),
            });
            setMensaje(`El rol de ${nombreCompleto(usuarioSeleccionado)} se actualizó a ${data.rol}.`);
            setBusqueda('');
            setUsuarios([]);
            setUsuarioSeleccionado(null);
            setRolSeleccionado('');
        } catch (err) {
            setError(err?.response?.data?.mensaje || 'No se pudo actualizar el rol.');
        } finally {
            setGuardando(false);
        }
    }

    async function crearUsuario(evento) {
        evento.preventDefault();
        setGuardando(true);
        setError('');
        setMensaje('');
        try {
            await axios.post('/admin/usuarios', {
                ...nuevoUsuario,
                idPais: Number(nuevoUsuario.idPais),
                idGenero: Number(nuevoUsuario.idGenero),
                idTipoUsuario: Number(nuevoUsuario.idTipoUsuario),
                fechaNacimiento: nuevoUsuario.fechaNacimiento || null,
            });
            setNuevoUsuario(formularioVacio);
            setMensaje('Usuario creado correctamente.');
            await cargarUsuarios();
        } catch (err) {
            setError(err?.response?.data?.mensaje || 'No se pudo crear el usuario.');
        } finally {
            setGuardando(false);
        }
    }

    async function eliminarUsuario(seleccionado) {
        const confirmacion = await Swal.fire({
            title: '¿Eliminar usuario?',
            text: `Se desactivará la cuenta de ${nombreCompleto(seleccionado)}. Sus registros se conservarán.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar usuario',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            background: '#0a1429',
            color: '#f4f7ff',
        });
        if (!confirmacion.isConfirmed) return;
        try {
            await axios.delete(`/admin/usuarios/${seleccionado.idUsuario}`);
            setUsuarios((actuales) => actuales.filter((item) => item.idUsuario !== seleccionado.idUsuario));
            setMensaje(`La cuenta de ${nombreCompleto(seleccionado)} fue desactivada.`);
            await Swal.fire({ title: 'Usuario eliminado', text: 'La cuenta fue desactivada correctamente.', icon: 'success', background: '#0a1429', color: '#f4f7ff' });
        } catch (err) {
            setError(err?.response?.data?.mensaje || 'No se pudo eliminar el usuario.');
        }
    }

    return (
        <main className="gestion-roles-pagina">
            <div className="gestion-roles-cabecera">
                <button className="gestion-roles-volver" type="button" onClick={onVolver}>← Volver al inicio</button>
                <h1>Panel administrativo</h1>
            </div>

            <nav className="gestion-roles-secciones" aria-label="Herramientas de administración">
                <button type="button" className={seccion === 'roles' ? 'activa' : ''} onClick={() => { setSeccion('roles'); setError(''); setMensaje(''); }}>Gestión de roles</button>
                <button type="button" className={seccion === 'usuarios' ? 'activa' : ''} onClick={() => { setSeccion('usuarios'); setError(''); setMensaje(''); }}>Gestión de usuarios</button>
            </nav>

            {seccion === 'roles' ? (
                <form className="gestion-roles-panel" onSubmit={confirmarCambio}>
                    <div className="gestion-roles-titulo"><span className="gestion-roles-icono" aria-hidden="true"><img src={gestionIcon} alt="" /></span><h2>Gestión de roles</h2></div>
                    <p className="gestion-roles-descripcion">Ingresá el nombre del usuario y luego seleccioná su rol.</p>
                    <div className="gestion-roles-campo gestion-roles-busqueda">
                        <label htmlFor="buscar-usuario">Usuario</label>
                        <div className="gestion-roles-input-con-icono">
                            <span aria-hidden="true"><img src={lupaIcon} alt="" /></span>
                            <input id="buscar-usuario" type="search" autoComplete="off" placeholder="Buscar el nombre del usuario" value={busqueda} onChange={(evento) => buscarUsuarios(evento.target.value)} onFocus={() => usuarios.length > 0 && setMostrarOpciones(true)} onBlur={() => window.setTimeout(() => setMostrarOpciones(false), 150)} aria-expanded={mostrarOpciones} aria-controls="gestion-roles-opciones" />
                            {cargando && <span className="gestion-roles-cargando">Buscando…</span>}
                        </div>
                        {mostrarOpciones && <ul className="gestion-roles-opciones" id="gestion-roles-opciones" role="listbox">{usuarios.length ? usuarios.map((coincidencia) => <li key={coincidencia.idUsuario} role="option" aria-selected="false"><button type="button" onMouseDown={() => seleccionarUsuario(coincidencia)}><span>{nombreCompleto(coincidencia)}</span><small>{coincidencia.email} · {coincidencia.rol}</small></button></li>) : !cargando && <li className="gestion-roles-sin-resultados">No se encontraron usuarios.</li>}</ul>}
                        {!usuarioSeleccionado && busqueda.trim().length === 1 && <small className="gestion-roles-ayuda">Escribí al menos 2 caracteres para buscar.</small>}
                    </div>
                    <div className="gestion-roles-campo">
                        <label htmlFor="rol-usuario">Rol de usuario</label>
                        <select id="rol-usuario" value={rolSeleccionado} onChange={(evento) => { setRolSeleccionado(evento.target.value); setMensaje(''); setError(''); }} disabled={!usuarioSeleccionado} required><option value="" disabled>Seleccioná un rol</option>{roles.map((rol) => <option key={rol.idTipoUsuario} value={rol.idTipoUsuario}>{rol.nombre}</option>)}</select>
                        {usuarioSeleccionado && <small className="gestion-roles-actual">Rol actual: {usuarioSeleccionado.rol}</small>}
                    </div>
                    {error && <p className="gestion-roles-mensaje error" role="alert">{error}</p>}{mensaje && <p className="gestion-roles-mensaje exito" role="status">{mensaje}</p>}
                    <button className="gestion-roles-confirmar" type="submit" disabled={!usuarioSeleccionado || !rolSeleccionado || guardando}>{guardando ? 'Guardando…' : 'Confirmar'}</button>
                </form>
            ) : (
                <section className="gestion-roles-panel">
                    <div className="gestion-roles-titulo"><span className="gestion-roles-icono" aria-hidden="true"><img src={gestionIcon} alt="" /></span><h2>Administrar usuarios</h2></div>
                    <p className="gestion-roles-descripcion">Creá cuentas nuevas o desactivá usuarios conservando sus datos históricos.</p>
                    {error && <p className="gestion-roles-mensaje error" role="alert">{error}</p>}{mensaje && <p className="gestion-roles-mensaje exito" role="status">{mensaje}</p>}
                    <form onSubmit={crearUsuario}>
                        <h3 className="gestion-roles-subtitulo">Agregar usuario</h3>
                        <div className="gestion-roles-form-grid">
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-nombre">Nombre *</label><input id="nuevo-nombre" className="gestion-roles-control" value={nuevoUsuario.nombre} maxLength="50" onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} required /></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-apellido">Apellido *</label><input id="nuevo-apellido" className="gestion-roles-control" value={nuevoUsuario.apellido} maxLength="50" onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })} required /></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-email">Correo electrónico *</label><input id="nuevo-email" className="gestion-roles-control" type="email" autoComplete="off" value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })} required /></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-password">Contraseña inicial *</label><input id="nuevo-password" className="gestion-roles-control" type="password" minLength="8" autoComplete="new-password" value={nuevoUsuario.password} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })} required /><small className="gestion-roles-ayuda">Mínimo 8 caracteres.</small></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-pais">País *</label><select id="nuevo-pais" className="gestion-roles-control" value={nuevoUsuario.idPais} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, idPais: e.target.value })} required><option value="" disabled>Seleccioná un país</option>{paises.map((pais) => <option key={pais.idPais} value={pais.idPais}>{pais.pais}</option>)}</select></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-genero">Género *</label><select id="nuevo-genero" className="gestion-roles-control" value={nuevoUsuario.idGenero} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, idGenero: e.target.value })} required><option value="" disabled>Seleccioná un género</option>{generos.map((genero) => <option key={genero.id} value={genero.id}>{genero.genero}</option>)}</select></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-rol">Rol *</label><select id="nuevo-rol" className="gestion-roles-control" value={nuevoUsuario.idTipoUsuario} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, idTipoUsuario: e.target.value })} required><option value="" disabled>Seleccioná un rol</option>{roles.map((rol) => <option key={rol.idTipoUsuario} value={rol.idTipoUsuario}>{rol.nombre}</option>)}</select></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-nacimiento">Fecha de nacimiento</label><input id="nuevo-nacimiento" className="gestion-roles-control" type="date" value={nuevoUsuario.fechaNacimiento} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, fechaNacimiento: e.target.value })} /></div>
                            <div className="gestion-roles-campo"><label htmlFor="nuevo-wcaid">WCA ID</label><input id="nuevo-wcaid" className="gestion-roles-control" maxLength="10" value={nuevoUsuario.wcaid} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, wcaid: e.target.value })} /></div>
                        </div>
                        <button className="gestion-roles-confirmar" type="submit" disabled={guardando || !paises.length || !roles.length}>{guardando ? 'Guardando…' : 'Crear usuario'}</button>
                    </form>

                    <div className="gestion-roles-listado">
                        <h3 className="gestion-roles-subtitulo">Usuarios activos</h3>
                        <div className="gestion-roles-input-con-icono gestion-roles-filtro-lista"><span aria-hidden="true"><img src={lupaIcon} alt="" /></span><input type="search" placeholder="Filtrar por nombre o correo" value={busqueda} onChange={(e) => { const value = e.target.value; setBusqueda(value); window.clearTimeout(temporizador.current); temporizador.current = window.setTimeout(() => cargarUsuarios(value.trim()), 250); }} /></div>
                        {cargando ? <p className="gestion-roles-ayuda">Cargando usuarios…</p> : <div className="gestion-roles-usuarios-lista">{usuarios.length ? usuarios.map((item) => <article className="gestion-roles-usuario" key={item.idUsuario}><div><strong>{nombreCompleto(item)}</strong><span>{item.email}</span><small>{item.rol}</small></div><button type="button" className="gestion-roles-eliminar" disabled={Number(item.idUsuario) === Number(usuario?.idUsuario)} title={Number(item.idUsuario) === Number(usuario?.idUsuario) ? 'No podés eliminar tu propia cuenta' : 'Desactivar usuario'} onClick={() => eliminarUsuario(item)}>Eliminar</button></article>) : <p className="gestion-roles-ayuda">No hay usuarios para mostrar.</p>}</div>}
                    </div>
                </section>
            )}
        </main>
    );
}
