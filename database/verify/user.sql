-- Verify morzod:user on mysql

BEGIN;

select id, name, pass, salt, created
from user
where 0;

ROLLBACK;
