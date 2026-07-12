-- Esquema de base de datos: Inventario de componentes electrónicos
-- Ejecutar con: psql -U tu_usuario -d tu_basedatos -f schema.sql

CREATE TABLE IF NOT EXISTS components (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100) NOT NULL,      -- resistencia, capacitor, ci, conector, semiconductor, etc.
    subcategory     VARCHAR(100),                -- ej: "electrolítico", "cerámico", "microcontrolador"
    value_spec      VARCHAR(100),                -- ej: "10kΩ", "100µF", "ATmega328P"
    voltage         VARCHAR(50),                 -- ej: "16V", "3.3-5V"
    tolerance       VARCHAR(50),                 -- ej: "±5%", "±1%"
    package_type    VARCHAR(100),                -- ej: "THT", "SMD 0805", "TO-92", "DIP-8"
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity    INTEGER DEFAULT 0,           -- umbral para alertas de stock bajo
    location        VARCHAR(255),                -- ej: "Gaveta 3, compartimento B"
    manufacturer    VARCHAR(255),
    part_number     VARCHAR(255),
    datasheet_url   TEXT,
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Requiere la extensión pg_trgm para búsquedas por similitud de texto (debe ir antes del índice que la usa)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_name_trgm ON components USING gin (name gin_trgm_ops);

-- Actualiza updated_at automáticamente en cada UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_components_updated_at ON components;
CREATE TRIGGER trg_components_updated_at
    BEFORE UPDATE ON components
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Categorías sugeridas (solo referencia, no es una tabla restrictiva)
-- resistencia, capacitor, inductor, diodo, transistor, ci, microcontrolador,
-- conector, sensor, modulo, cable, herramienta, mecanico, otro
