-- Deploy morzod:user to mysql

BEGIN;

create table user (
	id bigint(20) NOT NULL AUTO_INCREMENT,
	name varchar(128) not null unique,
	pass varchar(128) not null,
	salt varchar(32) not null,
	created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

grant select, insert, update, delete on table user to 'morzod'@'localhost';

COMMIT;
