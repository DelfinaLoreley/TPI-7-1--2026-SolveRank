-- Permite guardar una cuenta de Google antes de pedir los datos obligatorios
-- del perfil. Las cuentas que ya existen permanecen marcadas como completas.
ALTER TABLE usuarios
    MODIFY COLUMN idPais int DEFAULT NULL,
    ADD COLUMN perfil_completo TINYINT(1) NOT NULL DEFAULT 1;
