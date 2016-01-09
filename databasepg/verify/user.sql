-- Verify morzod:user on pg

BEGIN;

SELECT id, name, password, salt, created
  FROM morzod.user
WHERE FALSE;

ROLLBACK;
