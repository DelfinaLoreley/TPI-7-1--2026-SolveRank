const ROLES = Object.freeze({
    COMPETIDOR: 'Competidor',
    JUEZ: 'Juez',
    DELEGADO: 'Delegado',
    ORGANIZADOR: 'Organizador',
    ADMINISTRADOR: 'Administrador'
});

function permitirRoles(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: 'No tenés permisos para realizar esta acción'
            });
        }

        return next();
    };
}

module.exports = { ROLES, permitirRoles };
