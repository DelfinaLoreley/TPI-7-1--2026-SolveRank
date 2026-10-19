-- Elimina las categorías 3x3 FM y 3x3 MBLD y sus registros asociados.
-- Ejecutar una sola vez sobre la base SolveRank.
-- Reconoce las variantes de nombre usadas por la aplicación y por la WCA.

CREATE TEMPORARY TABLE categorias_a_eliminar (
    idCategoria INT PRIMARY KEY
);

INSERT INTO categorias_a_eliminar (idCategoria)
SELECT idCategoria
FROM categorias
WHERE LOWER(TRIM(categoria)) IN (
    '3x3x3 fmc',
    '3x3x3 fewest moves',
    '3x3 fm',
    '3x3x3 multi-blind',
    '3x3x3 multiblind',
    '3x3 mbld'
);

START TRANSACTION;

-- Las mezclas pertenecientes a rondas de estas categorías dejan de ser útiles.
DELETE m
FROM mezclas AS m
INNER JOIN rondas_x_categoria_x_torneo AS rct
    ON rct.idTorneo = m.idTorneo AND rct.idRonda = m.idRonda
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = rct.idCategoria;

DELETE i
FROM intentos_x_competidor AS i
INNER JOIN rondas_x_categoria_x_torneo AS rct
    ON rct.idTorneo = i.idTorneo AND rct.idRonda = i.idRonda
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = rct.idCategoria;

DELETE cx
FROM cronograma_x_torneo AS cx
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = cx.idcategoria;

DELETE fct
FROM formato_x_categoria_x_torneo AS fct
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = fct.idCategoria;

DELETE ci
FROM categorias_x_inscripcion AS ci
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = ci.idCategoria;

DELETE rct
FROM rondas_x_categoria_x_torneo AS rct
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = rct.idCategoria;

DELETE cxt
FROM categorias_x_torneo AS cxt
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = cxt.idCategoria;

DELETE c
FROM categorias AS c
INNER JOIN categorias_a_eliminar AS cae
    ON cae.idCategoria = c.idCategoria;

COMMIT;

DROP TEMPORARY TABLE categorias_a_eliminar;
