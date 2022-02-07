--test users have the password "password"

INSERT INTO user_roles (id, name)
VALUES (1, 'trainee'), (2, 'dishwasher'), (3, 'maintenance'), (4, 'cook'), (5, 'host'), (6, 'server'), (7, 'bartender'), (8, 'head-server'), (9, 'bar-manager'), (10, 'chef') , (11, 'manager'), (12, 'owner');

INSERT INTO users (id, display_name, password, first_name, last_name, role_id)
VALUES (1,
'Server',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
'Server-First',
'Server-Last',
6),
(2,
'Bartender',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
'Bartender-First',
'Bartender-Last',
7),
(3,
'Manager',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
'Manager-First',
'Manager-Last',
11);

INSERT INTO log_events (id, type)
VALUES (1, 'clock-in'), (2, 'clock-out'), (3, 'cash-out'),(4, 'close-shift'),(5, 'close-day'),(6, 'discount-item'), (7, 'discount-check');

INSERT INTO item_categories (id, name)
VALUES (1, 'Appetizer'),  (2, 'Soup'), (3, 'Salad'), (4, 'Entree'), (5, 'Addition'), (6, 'Desert'), (7, 'Favorites'), (8, 'Beverage'), (9, 'Beer'), (10, 'Wine'), (11, 'Liquor'), (12, 'Carryout'), (13, 'Delivery');

INSERT INTO destinations (id, name)
VALUES (1, 'Kitchen-Hot'), (2, 'Kitchen-Cold'),(3, 'Bar'), (4, 'No-Send');

INSERT INTO items (id, name, description, price, category_id, destination_id)
VALUES (1,
'Chicken Wings',
'A full pound of wings, deep-fried served plain, mild or hot',
8.99,
1,
1),
(2,
'Potato Skins',
'Baked with mozzarella, cheddar & crumbled bacon',
7.99,
2,
1),
(3,
'The Angry Angus',
'A full pound of wings, deep-fried served plain, mild or hot',
8.99,
4,
1),
(4,
'Baked Stuffed Haddock',
'Tender local haddock stuffed w/ scollop & bread crumb stuffing',
14.99,
4,
1),
(5,
'Walnut Chicken Salad',
'Carmelized walnut-encrusted chicken breast over crisp mesclun greens',
13.99,
3,
2),
(6,
'Coke',
NULL,
.99,
8,
4),
(7,
'Long Island Ice Tea',
NULL,
6.99,
11,
3),
(8,
'Sterling Cabernet Glass',
NULL,
4.99,
10,
3),
(9,
'Curious Traveler',
NULL,
2.99,
9,
3),
(10,
'Creme Brulee',
'Creamy custard with crisp carmelized sugar',
5.99,
6,
2);

INSERT INTO payment_types (id, type)
VALUES (1, 'Cash'), (2, 'MC'), (3, 'Visa'), (4, 'Amex'), (5, 'Discover'), (6, 'Apple-Pay'), (7, 'Google-Pay'), (8, 'Venmo');

INSERT INTO restaurant_info (id, restaurant_name, address, city, state, zip_code, phone_number, website, state_tax_rate)
VALUES ('1a',
'The Duck Inn Pub',
'447 Main St',
'Hyannis',
'MA',
'02601',
'508-827-7343',
'www.duckinnpub.com',
6.25);