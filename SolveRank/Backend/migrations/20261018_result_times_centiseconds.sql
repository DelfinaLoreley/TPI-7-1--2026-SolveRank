-- Preserva las centesimas de segundo registradas en cada intento.
ALTER TABLE intentos_x_competidor
    MODIFY COLUMN tiempo TIME(2) NOT NULL;
