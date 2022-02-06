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