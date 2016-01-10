-- Revert morzod:webrole from pg

BEGIN;

DROP ROLE morzo;

COMMIT;
