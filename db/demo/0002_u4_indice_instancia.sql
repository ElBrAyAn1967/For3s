-- U4 · Migrar la identidad de (kind, email) a (instancia, email)
-- Ronda F0 userStore · 2026-07-26 · DEMO_RONDA_F0_USERSTORE.md
--
-- POR QUÉ: demo_users tiene DOS columnas con el mismo valor — `kind` (legado) e
-- `instancia` (la buena, con FK a demo_instancias). El código escribía las dos con
-- el mismo dato, y el índice único de identidad era sobre la VIEJA:
--     idx_demo_users_kind_email_lower ON (kind, lower(email))
-- Por eso C6p2 ("borrar la columna kind") llevaba bloqueado: nadie había localizado
-- que el ON CONFLICT del código depende de ese índice.
--
-- PRE-VUELO (verificado en Neon antes de correr esto):
--   · kind e instancia NUNCA divergieron (0 filas distintas)
--   · no hay duplicados de (instancia, lower(email)) → el UNIQUE puede crearse
--   · ninguna vista depende de kind
--   · kind es NOT NULL con default 'general'  ← OJO, ver paso 3
--
-- ESTA MIGRACIÓN NO BORRA LA COLUMNA `kind`. Solo deja de depender de ella. El
-- DROP COLUMN va en una migración posterior, cuando lleve tiempo sin escribirse y
-- se confirme que nada la lee (listUsers aún la SELECTa).

BEGIN;

-- 1) Índice único nuevo, sobre la columna buena. Es la identidad real: una persona
--    por (instancia, correo).
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_users_instancia_email_lower
  ON demo_users (instancia, lower(email));

-- 2) Retirar el índice viejo. El código ya no lo usa (el ON CONFLICT apunta al
--    nuevo). Se conserva la columna, solo se suelta el candado.
DROP INDEX IF EXISTS idx_demo_users_kind_email_lower;

-- 3) `kind` es NOT NULL con default 'general'. Si el código deja de escribirla sin
--    más, las filas nuevas quedarían con kind='general' aunque la instancia sea otra
--    → divergencia silenciosa, justo lo que esta ronda viene a evitar. Un trigger la
--    mantiene en espejo de `instancia` mientras la columna siga existiendo.
CREATE OR REPLACE FUNCTION demo_users_kind_espejo() RETURNS trigger AS $$
BEGIN
  NEW.kind := NEW.instancia;   -- kind SIEMPRE = instancia, sin excepción
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_demo_users_kind_espejo ON demo_users;
CREATE TRIGGER trg_demo_users_kind_espejo
  BEFORE INSERT OR UPDATE OF instancia ON demo_users
  FOR EACH ROW EXECUTE FUNCTION demo_users_kind_espejo();

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- REVERSA (probada antes de aplicar; pegar tal cual si hay que volver atrás):
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_demo_users_kind_espejo ON demo_users;
-- DROP FUNCTION IF EXISTS demo_users_kind_espejo();
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_users_kind_email_lower
--   ON demo_users (kind, lower(email));
-- DROP INDEX IF EXISTS idx_demo_users_instancia_email_lower;
-- COMMIT;
--
-- Tras la reversa hay que volver el código a `ON CONFLICT (kind, lower(email))`.
-- ─────────────────────────────────────────────────────────────────────────────
