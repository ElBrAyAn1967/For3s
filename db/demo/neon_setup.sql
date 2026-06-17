-- ============================================================================
-- For3s Demo — setup para BD gestionada (Neon / Supabase) en producción (Vercel)
-- ============================================================================
-- Pega TODO esto en el SQL Editor de Neon (o Supabase) y ejecútalo UNA vez.
-- Crea las tablas y siembra las 4 cuentas. Las cuentas 1:1 NO llevan token aquí
-- (el token vive en env vars del sitio); el seed solo registra las filas.
-- ============================================================================

CREATE TABLE IF NOT EXISTS demo_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text NOT NULL CHECK (kind IN ('jazz','mashe','brian','general')),
  token           text UNIQUE,
  max_concurrent  int  NOT NULL,
  container_name  text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS demo_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES demo_accounts(id),
  cookie_id     text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'connecting'
                  CHECK (status IN ('connecting','ready','active','waiting','released')),
  api_key_enc   bytea,
  api_key_hint  text,
  position      int,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  released_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_account_status ON demo_sessions (account_id, status);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_last_seen ON demo_sessions (last_seen_at);

CREATE TABLE IF NOT EXISTS demo_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL DEFAULT 'general'
                  CHECK (kind IN ('jazz','mashe','brian','general')),
  name          text NOT NULL,
  email         text NOT NULL,
  status        text NOT NULL DEFAULT 'connecting'
                  CHECK (status IN ('connecting','ready','active','waiting','released')),
  position      int,
  notified      boolean NOT NULL DEFAULT false,
  api_key_enc   text,
  api_key_hint  text,
  agent_on      boolean NOT NULL DEFAULT true,  -- estado del agente (contenedor Docker)
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_users_kind_email_lower ON demo_users (kind, lower(email));
CREATE INDEX IF NOT EXISTS idx_demo_users_status ON demo_users (status);
CREATE INDEX IF NOT EXISTS idx_demo_users_created ON demo_users (created_at DESC);

CREATE TABLE IF NOT EXISTS demo_events (
  id          bigserial PRIMARY KEY,
  session_id  uuid REFERENCES demo_sessions(id),
  event       text NOT NULL,
  detail      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO demo_accounts (kind, token, max_concurrent, container_name) VALUES
  ('jazz',    NULL, 1,  'for3s-demo-jazz'),
  ('mashe',   NULL, 1,  'for3s-demo-mashe'),
  ('brian',   NULL, 1,  'for3s-demo-brian'),
  ('general', NULL, 10, 'for3s-demo-general')
ON CONFLICT DO NOTHING;
