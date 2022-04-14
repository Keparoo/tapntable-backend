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

CREATE TYPE user_role AS ENUM ('trainee', 'employee', 'cook', 'host', 'server', 'bartender', 'head-server', 'bar-manager', 'chef', 'manager', 'owner');

CREATE TYPE log_event AS ENUM ('clock-in', 'clock-out', 'cash-out', 'declare-cash-tips', 'open-shift', 'close-shift', 'open-day', 'close-day', 'discount-item', 'discount-check', 'create-item', 'update-item','delete-item-ordered', 'void-item', 'void-check');

CREATE TYPE payment_type AS ENUM ('Cash', 'MC', 'Visa', 'Amex', 'Disc', 'Google', 'Apple','Venmo');

INSERT INTO item_categories (id, name)
VALUES (1, 'Appetizer'),  (2, 'Soup'), (3, 'Salad'), (4, 'Sandwich'), (5, 'Entree'), (6, 'Addition'), (7, 'Dessert'), (8, 'Favorites'), (9, 'Beverage'), (10, 'Beer'), (11, 'Wine'), (12, 'Liquor'),(13, 'Children'), (14, 'Carryout'), (15, 'Delivery');

INSERT INTO mod_categories (id, name)
VALUES (1, 'Food'), (2, 'Drink'), (3, 'Misc');

INSERT INTO destinations (id, name)
VALUES (1, 'Kitchen-Hot'), (2, 'Kitchen-Cold'),(3, 'Bar'), (4, 'No-Send');

