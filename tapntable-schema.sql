CREATE TABLE employee_roles (
id SERIAL PRIMARY KEY,
role VARCHAR(25) NOT NULL
);

CREATE TABLE employees (
  display_name VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id INTEGER REFERENCES employee_roles,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE log_event (
id SERIAL PRIMARY KEY,
type VARCHAR(25) NOT NULL
);

CREATE TABLE user_logs (
id SERIAL PRIMARY KEY,
emp_id INTEGER REFERENCES employees,
log_event_id INTEGER REFERENCES log_event,
timestamp TIMESTAMP NOT NULL,
entity_id INTEGER --eg. item_ordered_id, or check_id
);

CREATE TABLE item_category (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL
);

CREATE TABLE destination (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL
);

CREATE TABLE items (
id SERIAL PRIMARY KEY,
name VARCHAR(25) NOT NULL,
description TEXT,
price NUMERIC(8,2) NOT NULL,
category_id INTEGER REFERENCES item_category,
destination_id INTEGER REFERENCES destination,
count INTEGER,
is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE check (
id SERIAL PRIMARY KEY,
emp_id INTEGER REFERENCES employees,
table_id VARCHAR(15) NOT NULL, --Create table of restaurant tables?
num_guests INTEGER NOT NULL,
created_at TIMESTAMP NOT NULL,
printed_at TIMESTAMP,
closed_at TIMESTAMP,
discount_id INTEGER, --This will eventually point to discount table
sub_total NUMERIC(10,2),
discount_total NUMERIC(10,2),
local_tax NUMERIC(6,2),
state_tax NUMERIC(6,2),
federal_tax NUMERIC(6,2)
);

CREATE TABLE ticket (
id SERIAL PRIMARY KEY,
emp_id INTEGER REFERENCES employees,
sent_at TIMESTAMP NOT NULL,
);

CREATE TABLE item_ordered (
id SERIAL PRIMARY KEY,
item_id INTEGER REFERENCES items
ticket_id INTEGER REFERENCES ticket,
check_id INTEGER REFERENCES check,
seat_num INTEGER,
completed_at TIMESTAMP,
completed_by INTEGER REFERENCES employees,
delivered_at TIMESTAMP,
item_note VARCHAR(30),
item_discount_id INTEGER --This will eventually point to discount table
);

CREATE TABLE payment_type (
id SERIAL PRIMARY KEY,
type VARCHAR(15) NOT NULL,
);

CREATE TABLE payments (
id SERIAL PRIMARY KEY,
check_id INTEGER REFERENCES check,
payment_type_id INTEGER REFERENCES payment_type,
tip_amt NUMERIC(6,2),
sub_total NUMERIC(10,2)
);

CREATE TABLE restaurant_info (
id VARCHAR(25) PRIMARY KEY,
restaurant_name VARCHAR(25),
address VARCHAR(25),
city VARCHAR(25),
state VARCHAR(25),
zip_code VARCHAR(10),
phone_number VARCHAR(13),
website VARCHAR(25),
local_tax_rate NUMERIC(6,3),
state_tax_rate NUMERIC(6,3),
federal_tax_rate NUMERIC(6,3),
week_start_mon BOOLEAN NOT NULL DEFAULT TRUE
);