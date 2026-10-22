import { useEffect, useRef, useState } from 'react';
import axios from '../../axiosApi';
import './GestionRoles.css';

function nombreCompleto(usuario) {
    return [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');
}

export default function GestionRoles({ usuario, onVolver }) {
    const [busqueda, setBusqueda] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [roles, setRoles] = useState([]);
    const [rolSeleccionado, setRolSeleccionado] = useState('');
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mostrarOpciones, setMostrarOpciones] = useState(false);
    const temporizador = useRef(null);

    useEffect(() => {
        let activo = true;
        axios.get('/admin/roles')
            .then(({ data }) => {
                if (activo) setRoles(data.roles ?? []);
            })
            .catch((err) => {
                if (activo) setError(err?.response?.data?.mensaje || 'No se pudieron cargar los roles.');
            });
        return () => {
            activo = false;
            window.clearTimeout(temporizador.current);
        };
    }, []);

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
            setUsuarioSeleccionado((actual) => ({ ...actual, idTipoUsuario: Number(rolSeleccionado), rol: data.rol }));
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

    return (
        <main className="gestion-roles-pagina">
            <div className="gestion-roles-cabecera">
                <button className="gestion-roles-volver" type="button" onClick={onVolver}>← Volver al inicio</button>
                <h1>Panel administrativo</h1>
            </div>

            <form className="gestion-roles-panel" onSubmit={confirmarCambio}>
                <div className="gestion-roles-titulo">
                    <span className="gestion-roles-icono" aria-hidden="true">▤</span>
                    <h2>Gestión de roles</h2>
                </div>
                <p className="gestion-roles-descripcion">Ingresá el nombre del usuario y luego seleccioná su rol.</p>

                <div className="gestion-roles-campo gestion-roles-busqueda">
                    <label htmlFor="buscar-usuario">Usuario</label>
                    <div className="gestion-roles-input-con-icono">
                        <span aria-hidden="true">⌕</span>
                        <input
                            id="buscar-usuario"
                            type="search"
                            autoComplete="off"
                            placeholder="Buscar el nombre del usuario"
                            value={busqueda}
                            onChange={(evento) => buscarUsuarios(evento.target.value)}
                            onFocus={() => usuarios.length > 0 && setMostrarOpciones(true)}
                            onBlur={() => window.setTimeout(() => setMostrarOpciones(false), 150)}
                            aria-expanded={mostrarOpciones}
                            aria-controls="gestion-roles-opciones"
                        />
                        {cargando && <span className="gestion-roles-cargando">Buscando…</span>}
                    </div>
                    {mostrarOpciones && (
                        <ul className="gestion-roles-opciones" id="gestion-roles-opciones" role="listbox">
                            {usuarios.length ? usuarios.map((coincidencia) => (
                                <li key={coincidencia.idUsuario} role="option" aria-selected="false">
                                    <button type="button" onMouseDown={() => seleccionarUsuario(coincidencia)}>
                                        <span>{nombreCompleto(coincidencia)}</span>
                                        <small>{coincidencia.email} · {coincidencia.rol}</small>
                                    </button>
                                </li>
                            )) : !cargando && <li className="gestion-roles-sin-resultados">No se encontraron usuarios.</li>}
                        </ul>
                    )}
                    {!usuarioSeleccionado && busqueda.trim().length === 1 && (
                        <small className="gestion-roles-ayuda">Escribí al menos 2 caracteres para buscar.</small>
                    )}
                </div>

                <div className="gestion-roles-campo">
                    <label htmlFor="rol-usuario">Rol de usuario</label>
                    <select
                        id="rol-usuario"
                        value={rolSeleccionado}
                        onChange={(evento) => { setRolSeleccionado(evento.target.value); setMensaje(''); setError(''); }}
                        disabled={!usuarioSeleccionado}
                        required
                    >
                        <option value="" disabled>Seleccioná un rol</option>
                        {roles.map((rol) => <option key={rol.idTipoUsuario} value={rol.idTipoUsuario}>{rol.nombre}</option>)}
                    </select>
                    {usuarioSeleccionado && <small className="gestion-roles-actual">Rol actual: {usuarioSeleccionado.rol}</small>}
                </div>

                {error && <p className="gestion-roles-mensaje error" role="alert">{error}</p>}
                {mensaje && <p className="gestion-roles-mensaje exito" role="status">{mensaje}</p>}

                <button className="gestion-roles-confirmar" type="submit" disabled={!usuarioSeleccionado || !rolSeleccionado || guardando}>
                    {guardando ? 'Guardando…' : 'Confirmar'}
                </button>
            </form>
        </main>
    );
}
