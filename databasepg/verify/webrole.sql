-- Verify morzod:webrole on pg

BEGIN;

SELECT 1/count(*) FROM pg_roles WHERE rolname='morzo';

ROLLBACK;
