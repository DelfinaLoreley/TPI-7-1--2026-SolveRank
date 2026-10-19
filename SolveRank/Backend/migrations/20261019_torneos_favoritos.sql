-- Favoritos de torneos por usuario.
-- Ejecutar una sola vez sobre la base SolveRank antes de usar Guardados.
CREATE TABLE IF NOT EXISTS torneos_favoritos (
    idUsuario BIGINT NOT NULL,
    idTorneo BIGINT NOT NULL,
    fecha_guardado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idUsuario, idTorneo),
    KEY idx_torneos_favoritos_torneo (idTorneo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
