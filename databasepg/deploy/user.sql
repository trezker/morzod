-- Deploy morzod:user to pg
-- requires: schema

BEGIN;

CREATE TABLE morzod.user (
  id bigint NOT NULL,
  name character varying(128) NOT NULL,
  password character varying(128) NOT NULL,
  salt character varying(32) NOT NULL,
  created timestamp with time zone NOT NULL DEFAULT NOW(),
  CONSTRAINT id PRIMARY KEY (id),
  CONSTRAINT "unique name" UNIQUE (name)
);

COMMIT;
