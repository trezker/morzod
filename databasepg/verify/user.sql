-- Verify morzod:user on pg

BEGIN;

SELECT id, name, password, salt, created
  FROM morzod.user
WHERE FALSE;

select 1/count(*) from information_schema.role_table_grants where 
grantee='morzo' and table_schema='morzod' and 
table_name='user' and privilege_type='INSERT';

select 1/count(*) from information_schema.role_table_grants where 
grantee='morzo' and table_schema='morzod' and 
table_name='user' and privilege_type='UPDATE';

select 1/count(*) from information_schema.role_table_grants where 
grantee='morzo' and table_schema='morzod' and 
table_name='user' and privilege_type='SELECT';

select 1/count(*) from information_schema.role_table_grants where 
grantee='morzo' and table_schema='morzod' and 
table_name='user' and privilege_type='DELETE';

ROLLBACK;
