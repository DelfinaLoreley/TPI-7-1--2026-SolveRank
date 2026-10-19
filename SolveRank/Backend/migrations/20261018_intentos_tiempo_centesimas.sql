-- Conserva centésimas en los tiempos de cada intento.
-- Sin precisión explícita, TIME guarda segundos enteros y descarta la fracción.
ALTER TABLE intentos_x_competidor
    MODIFY COLUMN tiempo TIME(2) NOT NULL;
