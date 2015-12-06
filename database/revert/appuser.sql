-- Revert morzod:appuser from mysql

BEGIN;

DROP USER morzod;

COMMIT;
