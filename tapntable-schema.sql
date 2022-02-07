--Role of employee: determines auth access

CREATE TABLE employee_roles (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL
);

--Employee data. Display name is name shown on POS

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  display_name VARCHAR(25) NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id INTEGER REFERENCES employee_roles,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

--Types of log events: clock-in, clock-out, cash-out, close-shift, close-day,
--discount-item, discount-check

CREATE TABLE log_events (
id SERIAL PRIMARY KEY,
type VARCHAR(25) NOT NULL
);

--Log of user events: clock-in, clock-out, cash-out, close-shift, close-day, and
--logs of discounted items and checks.

CREATE TABLE user_logs (
id SERIAL PRIMARY KEY,
emp_id INTEGER REFERENCES employees,
log_event_id INTEGER REFERENCES log_events,
timestamp TIMESTAMP NOT NULL,
entity_id INTEGER --eg. item_ordered_id, or check_id
);

--Descriptive categories for items sold

CREATE TABLE item_categories (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL
);

--Station where the sent item is sent
--Could be expanded to include printer address for each station
--Kitchen-Hot, Kitchen-Cold, Bar, No-send

CREATE TABLE destinations (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL
);

--Items that the restaurant sells & relevent info

CREATE TABLE items (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL,
description TEXT,
price NUMERIC(8,2) CHECK (price >= 0) NOT NULL,
category_id INTEGER REFERENCES item_categories,
destination_id INTEGER REFERENCES destinations,
count INTEGER, CHECK (count >= 0), --NULL indicates unlimited (no count)
is_active BOOLEAN NOT NULL DEFAULT TRUE
);

--Check for table / bar group

CREATE TABLE checks (
id SERIAL PRIMARY KEY,
emp_id INTEGER REFERENCES employees,
table_id VARCHAR(15) NOT NULL, --Create table of restaurant tables? At bar could be customer name/description
num_guests INTEGER NOT NULL,
created_at TIMESTAMP NOT NULL,
printed_at TIMESTAMP,
closed_at TIMESTAMP,
discount_id INTEGER, --This will eventually point to discount table
sub_total NUMERIC(10,2) CHECK (sub_total >= 0),
discount_total NUMERIC(10,2) CHECK (discount_total >= 0),
local_tax NUMERIC(6,2) CHECK (local_tax >= 0),
state_tax NUMERIC(6,2) CHECK (state_tax >= 0),
federal_tax NUMERIC(6,2) CHECK (federal_tax >= 0)
);

--Batch of items sent as an order. A check may have many orders
CREATE TABLE tickets (
id SERIAL PRIMARY KEY,
emp_id INTEGER REFERENCES employees,
sent_at TIMESTAMP NOT NULL
);

--Item ordered and and relevent info: seat #, mods (currently item_note)

CREATE TABLE item_ordered (
id SERIAL PRIMARY KEY,
item_id INTEGER REFERENCES items,
ticket_id INTEGER REFERENCES tickets,
check_id INTEGER REFERENCES checks,
seat_num INTEGER,
completed_at TIMESTAMP,
completed_by INTEGER REFERENCES employees,
delivered_at TIMESTAMP,
item_note VARCHAR(30),
item_discount_id INTEGER --This will eventually point to discount table
);

--Types of payment: Cash, MC, Visa, Amex etc

CREATE TABLE payment_types (
id SERIAL PRIMARY KEY,
type VARCHAR(15) NOT NULL
);

--A payment applied to a check. A check may have many payments

CREATE TABLE payments (
id SERIAL PRIMARY KEY,
check_id INTEGER REFERENCES checks,
payment_type_id INTEGER REFERENCES payment_types,
tip_amt NUMERIC(6,2) CHECK (tip_amt >= 0),
sub_total NUMERIC(10,2) CHECK (sub_total >= 0)
);

--Static Data about a restaurant

CREATE TABLE restaurant_info (
id VARCHAR(25) PRIMARY KEY,
restaurant_name VARCHAR(25),
address VARCHAR(25),
city VARCHAR(25),
state VARCHAR(25),
zip_code VARCHAR(10),
phone_number VARCHAR(13),
website VARCHAR(25),
local_tax_rate NUMERIC(6,3) CHECK (local_tax_rate >= 0 AND local_tax_rate <= 100),
state_tax_rate NUMERIC(6,3) CHECK (state_tax_rate >= 0 AND state_tax_rate <= 100),
federal_tax_rate NUMERIC(6,3) CHECK (federal_tax_rate >= 0 AND federal_tax_rate <= 100),
week_start_mon BOOLEAN NOT NULL DEFAULT TRUE
);