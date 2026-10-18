-- Guarda las categorías seleccionadas por cada participante al inscribirse.
-- Ejecutar una vez sobre la base SolveRank.
CREATE TABLE IF NOT EXISTS categorias_x_inscripcion (
    idUsuario INT NOT NULL,
    idTorneo INT NOT NULL,
    idCategoria INT NOT NULL,
    PRIMARY KEY (idUsuario, idTorneo, idCategoria),
    INDEX idx_categorias_x_inscripcion_torneo (idTorneo),
    INDEX idx_categorias_x_inscripcion_categoria (idCategoria)
);
