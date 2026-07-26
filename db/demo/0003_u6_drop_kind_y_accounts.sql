-- U6 · Retirar la columna legado `kind` y la tabla espejo `demo_accounts`
-- Ronda F0 userStore · 2026-07-26 · cierra C6p2 del plan F0.
--
-- Prerrequisito: el CÓDIGO ya no las usa (commit de U6).
--   · listUsers pasó a leer `instancia` (era el ÚNICO lector de demo_users.kind).
--   · accountStore dejó la doble-escritura C4: la puerta vive solo en demo_llaves.
--   · eliminarUsuario revoca en demo_llaves (antes borraba el espejo y dejaba viva
--     la llave real — bug cerrado en el mismo commit).
--   · Los `'privado'::text AS kind` de accountStore son un LITERAL sobre demo_llaves,
--     no la columna: no bloquean nada.
--
-- Verificado antes de escribir esto:
--   · kind e instancia nunca divergieron (trigger de U4 + 0 filas distintas)
--   · demo_accounts: 4 filas de catálogo obsoleto (cupo → demo_instancias,
--     container → convención types.containerName). Las 2 puertas 'privado' ya se
--     borraron en la limpieza; sus equivalentes viven en demo_llaves.
--   · NINGÚN FK apunta a demo_accounts.

BEGIN;

-- 1) Respaldo dentro de la propia BD (barato y recuperable sin salir de Neon).
--    Si algo saliera mal: INSERT INTO ... SELECT * FROM _bak_demo_accounts_u6.
CREATE TABLE IF NOT EXISTS _bak_demo_accounts_u6 AS TABLE demo_accounts;
CREATE TABLE IF NOT EXISTS _bak_demo_users_kind_u6 AS
  SELECT id, kind, instancia FROM demo_users;

-- 2) El trigger espejo de U4 existía SOLO para que `kind` no divergiera mientras la
--    columna siguiera viva. Sin columna, sobra.
DROP TRIGGER IF EXISTS trg_demo_users_kind_espejo ON demo_users;
DROP FUNCTION IF EXISTS demo_users_kind_espejo();

-- 3) Fuera la columna legado. La identidad ya es (instancia, lower(email)) desde U4.
ALTER TABLE demo_users DROP COLUMN IF EXISTS kind;

-- 4) Fuera la tabla espejo. demo_llaves la reemplaza (y además tiene `revocada`).
DROP TABLE IF EXISTS demo_accounts;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- REVERSA (los respaldos quedan en la BD; hay que restaurar código Y esquema):
--
-- BEGIN;
-- ALTER TABLE demo_users ADD COLUMN kind text;
-- UPDATE demo_users u SET kind = b.kind FROM _bak_demo_users_kind_u6 b WHERE b.id = u.id;
-- UPDATE demo_users SET kind = instancia WHERE kind IS NULL;
-- ALTER TABLE demo_users ALTER COLUMN kind SET NOT NULL;
-- ALTER TABLE demo_users ALTER COLUMN kind SET DEFAULT 'general';
-- CREATE TABLE demo_accounts AS TABLE _bak_demo_accounts_u6;
-- COMMIT;
-- (y volver el código: listUsers → SELECT kind, accountStore → doble escritura)
--
-- Cuando se dé por buena la migración, limpiar los respaldos:
--   DROP TABLE _bak_demo_accounts_u6, _bak_demo_users_kind_u6;
-- ─────────────────────────────────────────────────────────────────────────────
