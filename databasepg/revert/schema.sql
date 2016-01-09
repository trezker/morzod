-- Revert morzod:schema from pg

BEGIN;

DROP SCHEMA morzod;

COMMIT;
