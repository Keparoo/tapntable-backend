--Role of user: determines auth access

-- Separate user_role table: deprecated
-- CREATE TABLE user_roles (
-- id SERIAL PRIMARY KEY,
-- name VARCHAR(25) NOT NULL
-- );
-- COMMENT ON TABLE user_roles IS 'List of roles that determine user permissions';

--Roles of user: determines access
--role types: trainee, employee, cook, host, server, bartender, head-server, bar-manager, chef, manager, owner

CREATE TYPE user_role AS ENUM ('trainee', 'employee', 'cook', 'host', 'server', 'bartender', 'head-server', 'bar-manager', 'chef', 'manager', 'owner');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  pin INTEGER NOT NULL UNIQUE,
  display_name VARCHAR(20) NOT NULL, --User data. Display name is name shown on POS
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  --role_id INTEGER REFERENCES user_roles,
  role USER_ROLE NOT NULL DEFAULT 'trainee',
  is_clocked_in BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE users IS 'List of users (employees) and their info';

--Separate log event table: deprecated
--Types of log events: clock-in, clock-out, cash-out, close-shift, close-day,
--discount-item, discount-check

-- CREATE TABLE log_events (
-- id SERIAL PRIMARY KEY,
-- type VARCHAR(25) NOT NULL
-- );
-- COMMENT ON TABLE log_events IS 'Type of events to log';

CREATE TYPE log_event AS ENUM ('clock-in', 'clock-out', 'cash-out', 'declare-cash-tips', 'open-shift', 'close-shift', 'open-day', 'close-day', 'discount-item', 'discount-check', 'create-item', 'update-item','delete-item-ordered', 'void-item', 'void-check');

--Log of user events: clock-in, clock-out, cash-out, close-shift, close-day, and
--logs of discounted items and checks.

CREATE TABLE user_logs (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users,
-- log_event_id INTEGER REFERENCES log_events,
event LOG_EVENT NOT NULL,
created_at TIMESTAMP DEFAULT NOW(),
declared_tips NUMERIC(6,2),
entity_id INTEGER --eg. item_ordered_id, or check_id
);
COMMENT ON TABLE user_logs IS 'Log of user events including timeclock';

--Descriptive categories for items sold

CREATE TABLE item_categories (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL
);
COMMENT ON TABLE item_categories IS 'Category of items for sale';

--Separate destination table: deprecated
--Station where the sent item is sent
--Could be expanded to include printer address for each station
--Kitchen-Hot, Kitchen-Cold, Bar, No-send

--CREATE TYPE destinations AS ENUM ('Kitchen-Hot', 'Kitchen-Cold', 'Bar', 'No-Send');

CREATE TABLE destinations (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL
);
COMMENT ON TABLE destinations IS 'Station where item is sent (kitchen, bar)';

--Items that the restaurant sells & relevent info

CREATE TABLE items (
id SERIAL PRIMARY KEY,
name VARCHAR(40) NOT NULL,
description TEXT,
price NUMERIC(8,2) CHECK (price >= 0) NOT NULL,
category_id INTEGER REFERENCES item_categories,
destination_id INTEGER REFERENCES destinations,
count INTEGER, CHECK (count >= 0), --NULL indicates unlimited (no count)
is_active BOOLEAN NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE items IS 'List of items for sale & info';

--Check for table / bar group

CREATE TABLE checks (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users,
table_num INTEGER NOT NULL, --Create table of restaurant tables? 
customer VARCHAR(15), --At bar only: customer name/description
num_guests INTEGER NOT NULL,
created_at TIMESTAMP DEFAULT NOW(),
printed_at TIMESTAMP,
closed_at TIMESTAMP,
discount_id INTEGER, --This will eventually point to discount table
subtotal NUMERIC(10,2) CHECK (subtotal >= 0),
discount_total NUMERIC(10,2) CHECK (discount_total >= 0),
local_tax NUMERIC(6,2) CHECK (local_tax >= 0),
state_tax NUMERIC(6,2) CHECK (state_tax >= 0),
federal_tax NUMERIC(6,2) CHECK (federal_tax >= 0),
is_void BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE checks IS 'List of all checks';

--Batch of items sent as an order. A check may have many orders
CREATE TABLE orders (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users,
sent_at TIMESTAMP DEFAULT NOW(),
completed_at TIMESTAMP,
fire_course_2 TIMESTAMP,
fire_course_3 TIMESTAMP
);
COMMENT ON TABLE orders IS 'Batch of items ordered sent to destinations';

--Item ordered and and relevent info: seat #, mods (currently item_note)

CREATE TABLE ordered_items (
id SERIAL PRIMARY KEY,
item_id INTEGER REFERENCES items,
order_id INTEGER REFERENCES orders,
check_id INTEGER REFERENCES checks,
seat_num INTEGER,
course_num INTEGER DEFAULT 1,
completed_at TIMESTAMP,
completed_by INTEGER REFERENCES users,
delivered_at TIMESTAMP,
item_note VARCHAR(30),
item_discount_id INTEGER, --This will eventually point to discount table
is_void BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE ordered_items IS 'Item ordered with modifications and info';

--Types of payment: Cash, MC, Visa, Amex etc

-- Separate payment type table: deprecated
-- CREATE TABLE payment_types (
-- id SERIAL PRIMARY KEY,
-- type VARCHAR(15) NOT NULL
-- );
-- COMMENT ON TABLE payment_types IS 'Cash, Visa, MC, etc';

CREATE TYPE payment_type AS ENUM ('Cash', 'MC', 'Visa', 'Amex', 'Disc', 'Google', 'Apple','Venmo');

--A payment applied to a check. A check may have many payments

CREATE TABLE payments (
id SERIAL PRIMARY KEY,
check_id INTEGER REFERENCES checks,
type PAYMENT_TYPE NOT NULL,
tip_amt NUMERIC(6,2) CHECK (tip_amt >= 0),
subtotal NUMERIC(10,2) CHECK (subtotal >= 0),
is_void BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE payments IS 'List of payment. A check can have more than one';

--Category names of item mods

CREATE TABLE mod_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL
);
COMMENT ON TABLE mod_categories IS 'Category names for mods';

--Item modifications (item note, Med-Rare, No-Onions, etc)

CREATE TABLE mods (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL,
mod_cat_id INTEGER REFERENCES mod_categories,
mod_price NUMERIC(6,2),
is_active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE mods IS 'Available mods for ordered items';

--Many to many join table between ordered_items and mods

CREATE TABLE ordered_items_mods (
  ordered_item_id INTEGER REFERENCES ordered_items,
  mod_id INTEGER REFERENCES mods,
  PRIMARY KEY (ordered_item_id, mod_id)
);
COMMENT ON TABLE ordered_items_mods IS 'Many to many join table for ordered_items and mods';

--Name and behavior of a mod group

CREATE TABLE mod_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  num_choices INTEGER CHECK (num_choices >= 0),
  is_required BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE mod_groups IS 'Name and behavior of a mod group';

--Many to many join table between items and mod_groups

CREATE TABLE items_mod_groups (
  item_id INTEGER REFERENCES items ON DELETE CASCADE, 
  mod_group_id INTEGER REFERENCES mod_groups ON DELETE CASCADE,
  PRIMARY KEY (item_id, mod_group_id)
);
COMMENT ON TABLE items_mod_groups IS 'Many to may join between items and mod_groups';

--Many to many join table between mods and mod_groups

CREATE TABLE mods_mod_groups (
  mod_id INTEGER REFERENCES mods ON DELETE CASCADE,
  mod_group_id INTEGER REFERENCES mod_groups ON DELETE CASCADE,
  PRIMARY KEY (mod_id, mod_group_id)
);
COMMENT ON TABLE mods_mod_groups IS 'Many to many join table for mods & mod_groups';