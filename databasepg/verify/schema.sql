-- Verify morzod:schema on pg

BEGIN;

SELECT pg_catalog.has_schema_privilege('morzod', 'usage');

ROLLBACK;
