-- Prepara la tabla existente para secuencias generadas por el port no oficial
-- tnoodle-native. Ejecutar una sola vez sobre la base SolveRank.
ALTER TABLE mezclas
    MODIFY COLUMN mezcla LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    ADD COLUMN grupo VARCHAR(50) NOT NULL DEFAULT 'A' AFTER idRonda,
    ADD COLUMN numeroMezcla INT NOT NULL DEFAULT 1 AFTER grupo,
    ADD COLUMN versionGenerador VARCHAR(100) NULL AFTER mezcla,
    ADD COLUMN generadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER versionGenerador;

-- Conserva las filas existentes y evita colisiones al crear el índice único.
UPDATE mezclas SET numeroMezcla = id;

ALTER TABLE mezclas
    ADD UNIQUE KEY uq_mezcla_ronda_grupo_numero (idTorneo, idRonda, grupo, numeroMezcla);

