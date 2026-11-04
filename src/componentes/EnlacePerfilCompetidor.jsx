import './EnlacePerfilCompetidor.css';

export default function EnlacePerfilCompetidor({ idUsuario, children, className = '', ...props }) {
    const idValido = Number.isSafeInteger(Number(idUsuario)) && Number(idUsuario) > 0;
    if (!idValido) return <span className={className}>{children}</span>;

    function abrirPerfil(evento) {
        evento.preventDefault();
        window.dispatchEvent(new CustomEvent('solverank:abrir-perfil-publico', {
            detail: { idUsuario: Number(idUsuario) }
        }));
    }

    return (
        <a
            {...props}
            className={`enlace-perfil-competidor ${className}`.trim()}
            href={`#perfil-${idUsuario}`}
            onClick={abrirPerfil}
        >
            {children}
        </a>
    );
}
