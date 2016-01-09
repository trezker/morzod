-- Revert morzod:user from mysql

BEGIN;

revoke select, insert, update, delete on table user from 'morzod'@'localhost';

drop table user;

COMMIT;
