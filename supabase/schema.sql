CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_empresa TEXT NOT NULL DEFAULT 'MI EMPRESA S.A.C.',
  ruc TEXT,
  direccion TEXT,
  ciudad TEXT,
  telefono TEXT,
  email TEXT,
  web TEXT,
  descripcion_negocio TEXT,
  logo_tipo TEXT DEFAULT 'url' CHECK (logo_tipo IN ('url', 'archivo', 'servidor')),
  logo_icono_url TEXT,
  logo_texto_url TEXT,
  banco1_nombre TEXT,
  banco1_cci TEXT,
  banco2_nombre TEXT,
  banco2_cci TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_empresa_activa_unica
  ON configuracion_empresa (activo)
  WHERE activo = true;

CREATE TABLE IF NOT EXISTS logos_almacenados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('icono', 'texto', 'combinado')),
  storage_path TEXT NOT NULL,
  url_publica TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  fecha_emision DATE DEFAULT CURRENT_DATE,
  cliente_nombre TEXT,
  cliente_direccion TEXT,
  cliente_otro TEXT,
  cliente_atencion TEXT,
  cliente_telefono TEXT,
  moneda TEXT DEFAULT 'SOLES' CHECK (moneda IN ('SOLES', 'DOLARES')),
  forma_pago TEXT,
  plazo_entrega TEXT,
  garantia TEXT,
  subtotal NUMERIC(12,2) DEFAULT 0,
  igv NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  porcentaje_igv NUMERIC(5,2) DEFAULT 18.00,
  observaciones TEXT,
  monto_en_letras TEXT,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items_cotizacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  item_numero INTEGER NOT NULL,
  codigo TEXT,
  cantidad NUMERIC(12,3) NOT NULL DEFAULT 1,
  unidad_medida TEXT DEFAULT 'NIU',
  descripcion TEXT NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_total NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cotizaciones_updated_at ON cotizaciones;
CREATE TRIGGER trg_cotizaciones_updated_at
BEFORE UPDATE ON cotizaciones
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_config_updated_at ON configuracion_empresa;
CREATE TRIGGER trg_config_updated_at
BEFORE UPDATE ON configuracion_empresa
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION siguiente_numero_cotizacion()
RETURNS TEXT AS $$
DECLARE
  ultimo TEXT;
  correlativo INTEGER;
BEGIN
  SELECT numero INTO ultimo
  FROM cotizaciones
  WHERE numero LIKE 'P001-%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF ultimo IS NULL THEN
    RETURN 'P001-0001';
  END IF;

  correlativo := (SPLIT_PART(ultimo, '-', 2)::INTEGER) + 1;
  RETURN 'P001-' || LPAD(correlativo::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

INSERT INTO configuracion_empresa (
  nombre_empresa, ruc, direccion, ciudad, telefono, email, web,
  descripcion_negocio, logo_tipo,
  logo_icono_url, logo_texto_url
) VALUES (
  'MI EMPRESA S.A.C.',
  NULL,
  'Dirección de la empresa',
  'Lima - Lima',
  '999 999 999',
  'empresa@email.com',
  'www.miempresa.com',
  'Descripción del giro del negocio de la empresa',
  'archivo',
  '/logo-icon.png',
  '/logo-text.png'
) ON CONFLICT DO NOTHING;
