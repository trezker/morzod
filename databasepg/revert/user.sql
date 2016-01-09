-- Revert morzod:user from pg

BEGIN;

DROP TABLE morzod.user;

COMMIT;
