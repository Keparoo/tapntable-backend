\echo 'Delete and recreate tapntable db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE tapntable;
CREATE DATABASE tapntable;
\connect tapntable

\i tapntable-schema.sql
\i tapntable-seed.sql

\echo 'Delete and recreate tapntable_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE tapntable_test;
CREATE DATABASE tapntable_test;
\connect tapntable_test

\i tapntable-schema.sql

INSERT INTO user_roles (id, name)
VALUES (1, 'trainee'), (2, 'employee'), (3, 'cook'), (4, 'host'), (5, 'server'), (6, 'bartender'), (7, 'head-server'), (8, 'bar-manager'), (9, 'chef') , (10, 'manager'), (11, 'owner');