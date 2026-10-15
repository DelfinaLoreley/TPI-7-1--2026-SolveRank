-- Agrega el rol que falta en el dump inicial, sin duplicarlo si ya fue creado.
INSERT INTO tipos_usuarios (Nombre, observacion)
SELECT 'Administrador', 'Administrador del sistema'
WHERE NOT EXISTS (
    SELECT 1
    FROM tipos_usuarios
    WHERE LOWER(Nombre) = LOWER('Administrador')
);
