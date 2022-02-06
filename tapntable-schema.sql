CREATE TABLE employees (
  display_name VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id INTEGER REFERENCES employee_roles,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);