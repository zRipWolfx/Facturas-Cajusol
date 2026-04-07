CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS numeros_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  descripcion TEXT,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO numeros_whatsapp (numero, descripcion, visible)
SELECT '+51 926 006 819', 'Principal', true
WHERE NOT EXISTS (
  SELECT 1
  FROM numeros_whatsapp
  WHERE numero = '+51 926 006 819'
);

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS whatsapp_numero TEXT;
