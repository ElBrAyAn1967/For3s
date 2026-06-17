-- ============================================================================
-- For3s Demo — esquema de la BD dedicada (Postgres)  ·  migración 0001
-- ============================================================================
-- BD separada de For3s OS. Controla acceso, aislamiento y capacidad de las 3
-- demos (Jazz 1:1, Mashe 1:1, General N:N con tope de 10 + lista de espera).
--
-- FASE 1: este archivo es el CONTRATO de datos. Aún NO se corre en el servidor;
-- la lógica vive in-memory (lib/demo/store.ts). En Fase 2 se aplica esta
-- migración en la BD `for3s_demo` del server for3s y el store pasa a consultarla.
--
-- Seguridad (alineado con For3s OS): la API key del usuario se guarda CIFRADA
-- (api_key_enc), nunca en claro. El cifrado real usa la Master KEK offline
-- (Fase 2). Brian nunca ve secretos en claro. Eventos = append-only (auditoría).
-- ============================================================================

-- Las 3 cuentas/demos y su configuración.
CREATE TABLE IF NOT EXISTS demo_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text NOT NULL CHECK (kind IN ('jazz', 'mashe', 'brian', 'general')),
  token           text UNIQUE,                 -- token secreto (NULL para general)
  max_concurrent  int  NOT NULL,               -- 1 para jazz/mashe, 10 para general
  container_name  text NOT NULL,               -- 'for3s-demo-jazz', etc. (Docker, Fase 2)
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Sesiones de usuario, identificadas por cookie.
CREATE TABLE IF NOT EXISTS demo_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES demo_accounts(id),
  cookie_id     text NOT NULL UNIQUE,          -- id que vive en la cookie del navegador
  status        text NOT NULL DEFAULT 'connecting'
                  CHECK (status IN ('connecting','ready','active','waiting','released')),
  api_key_enc   bytea,                          -- API key del usuario CIFRADA (nunca en claro)
  api_key_hint  text,                           -- últimos 4 chars para mostrar "…x9f2"
  position      int,                            -- posición en cola si status='waiting'
  joined_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),  -- heartbeat → detecta inactividad
  released_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_account_status
  ON demo_sessions (account_id, status);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_last_seen
  ON demo_sessions (last_seen_at);

-- Personas de la demo GENERAL (registro por nombre + correo = sesión persistente).
-- El correo normalizado (minúsculas) es la identidad única: volver con el mismo
-- correo continúa la sesión. UNIQUE sobre LOWER(email) evita duplicados por
-- mayúsculas/minúsculas (regla de Brian: todo se normaliza a minúsculas).
CREATE TABLE IF NOT EXISTS demo_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL DEFAULT 'general' -- a qué demo pertenece la sesión
                  CHECK (kind IN ('jazz','mashe','brian','general')),
  name          text NOT NULL,                 -- normalizado a minúsculas
  email         text NOT NULL,                 -- normalizado a minúsculas (identidad)
  status        text NOT NULL DEFAULT 'connecting'
                  CHECK (status IN ('connecting','ready','active','waiting','released')),
  position      int,                            -- posición en cola si waiting
  notified      boolean NOT NULL DEFAULT false, -- si se le notificó cupo disponible
  api_key_enc   text,                            -- API key del usuario CIFRADA (AES-256-GCM), nunca en claro
  api_key_hint  text,                            -- últimos 4 chars para mostrar "…x9f2"
  agent_on      boolean NOT NULL DEFAULT true,   -- estado del agente For3s OS (contenedor Docker: on/off)
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

-- Identidad única case-insensitive POR demo (un correo puede estar en general
-- y en su demo 1:1 sin chocar). Defensa además de la normalización en app.
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_users_kind_email_lower
  ON demo_users (kind, lower(email));
CREATE INDEX IF NOT EXISTS idx_demo_users_status ON demo_users (status);
CREATE INDEX IF NOT EXISTS idx_demo_users_created ON demo_users (created_at DESC);

-- Auditoría mínima append-only: quién entró, esperó, salió.
CREATE TABLE IF NOT EXISTS demo_events (
  id          bigserial PRIMARY KEY,
  session_id  uuid REFERENCES demo_sessions(id),
  event       text NOT NULL,                   -- 'join'|'wait'|'promote'|'leave'|'connect'|'reap'
  detail      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed de las 3 cuentas. Los tokens reales se inyectan por variable (no se
-- commitean en claro); aquí van placeholders que Fase 2 reemplaza.
INSERT INTO demo_accounts (kind, token, max_concurrent, container_name) VALUES
  ('jazz',    :'jazz_token',  1,  'for3s-demo-jazz'),
  ('mashe',   :'mashe_token', 1,  'for3s-demo-mashe'),
  ('brian',   :'brian_token', 1,  'for3s-demo-brian'),
  ('general', NULL,           10, 'for3s-demo-general')
ON CONFLICT DO NOTHING;
