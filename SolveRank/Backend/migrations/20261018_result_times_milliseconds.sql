-- Preserve millisecond precision when storing tournament attempts.
ALTER TABLE intentos_x_competidor
    MODIFY COLUMN tiempo TIME(3) NOT NULL;
