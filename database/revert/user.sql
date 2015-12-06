-- Revert morzod:user from mysql

BEGIN;

drop table user;

COMMIT;
