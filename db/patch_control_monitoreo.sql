-- ============================================================
-- PATCH: Control y Monitoreo de Mantenimientos
-- Ejecutar en la BD de SistemaParques (PostgreSQL)
-- ============================================================

-- 1. Tabla de progreso por tipo de mantenimiento
--    Registra qué tipos ya se marcaron como completados en cada mantenimiento
-- ============================================================
CREATE TABLE IF NOT EXISTS sc_sistema.tb_mant_tipo_progress (
    mtp_id          SERIAL PRIMARY KEY,
    mant_id         INTEGER NOT NULL REFERENCES sc_sistema.tb_mantenimiento(mant_id) ON DELETE CASCADE,
    tima_id         INTEGER NOT NULL REFERENCES sc_sistema.tb_tipo_mantenimiento(tima_id) ON DELETE CASCADE,
    mtp_completado  BOOLEAN NOT NULL DEFAULT FALSE,
    mtp_fecha_check TIMESTAMP,
    mtp_usuario_id  INTEGER,   -- usuario que marcó el check
    UNIQUE (mant_id, tima_id)
);

COMMENT ON TABLE  sc_sistema.tb_mant_tipo_progress IS 'Registra el avance de ejecución por tipo de mantenimiento';
COMMENT ON COLUMN sc_sistema.tb_mant_tipo_progress.mtp_completado IS 'TRUE = tipo completado, FALSE = pendiente';

-- 2. Tabla de solicitudes de ampliación de plazo
-- ============================================================
CREATE TABLE IF NOT EXISTS sc_sistema.tb_mant_ampliacion (
    ampl_id         SERIAL PRIMARY KEY,
    mant_id         INTEGER NOT NULL REFERENCES sc_sistema.tb_mantenimiento(mant_id) ON DELETE CASCADE,
    ampl_motivo     TEXT NOT NULL,
    ampl_fecha_nva  DATE NOT NULL,                        -- nueva fecha límite solicitada
    ampl_estado     VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
    -- PENDIENTE | APROBADA | RECHAZADA
    ampl_fecha_crea TIMESTAMP NOT NULL DEFAULT NOW(),
    ampl_usuario_id INTEGER,                              -- usuario que solicitó
    ampl_resolucion TEXT,                                 -- nota del supervisor
    ampl_fecha_res  TIMESTAMP                             -- cuándo se resolvió
);

COMMENT ON TABLE  sc_sistema.tb_mant_ampliacion IS 'Solicitudes de ampliación de plazo de mantenimientos';
COMMENT ON COLUMN sc_sistema.tb_mant_ampliacion.ampl_estado IS 'PENDIENTE | APROBADA | RECHAZADA';

-- 3. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_mtp_mant_id  ON sc_sistema.tb_mant_tipo_progress (mant_id);
CREATE INDEX IF NOT EXISTS idx_ampl_mant_id ON sc_sistema.tb_mant_ampliacion     (mant_id);
CREATE INDEX IF NOT EXISTS idx_ampl_estado  ON sc_sistema.tb_mant_ampliacion     (ampl_estado);
