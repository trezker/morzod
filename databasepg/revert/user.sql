-- Revert morzod:user from pg

BEGIN;

REVOKE ALL PRIVILEGES ON morzod.user FROM morzo;

DROP TABLE morzod.user;

COMMIT;
