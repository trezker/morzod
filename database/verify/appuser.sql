-- Verify morzod:appuser on mysql

BEGIN;

SELECT sqitch.checkit(COUNT(*), 'User "morzod" does not exist')
FROM mysql.user WHERE user = 'morzod';

ROLLBACK;
