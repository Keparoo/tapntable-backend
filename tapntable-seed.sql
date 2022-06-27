--test users have the password "password"
--test PINs: Server 1111, Bartender 2222, Manager 3333

-- INSERT INTO user_roles (id, name)
-- VALUES (1, 'trainee'), (2, 'employee'), (3, 'cook'), (4, 'host'), (5, 'server'), (6, 'bartender'), (7, 'head-server'), (8, 'bar-manager'), (9, 'chef') , (10, 'manager'), (11, 'owner');

INSERT INTO users (id, username, password, pin, display_name, first_name, last_name, role)
VALUES (1,
'server',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
1111,
'Charlie (server)',
'Charlie',
'Charleton',
'server'),
(2,
'bartender',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
2222,
'Chris (bartender)',
'Chris',
'Christman',
'bartender'),
(3,
'manager',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
3333,
'Kirby (manager)',
'Kirby',
'Kirstowicz',
'manager'),
(4,
'employee',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
4444,
'Jodie (employee)',
'Jodie',
'Jordan',
'employee'),
(5,
'chef',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
5555,
'Rene (chef)',
'Rene',
'Renard',
'chef'),
(6,
'trainee',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
6666,
'Channing (trainee)',
'Channing',
'Chanderson',
'trainee'),
(7,
'owner',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
7777,
'Gerry (owner)',
'Gerry',
'Mander',
'owner'),
(8,
'cook',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
8888,
'Stevie (cook)',
'Stevie',
'Stephenson',
'cook'),
(9,
'bar-manager',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
9999,
'Gari (bar-manager)',
'Gari',
'Garrison',
'bar-manager'),
(10,
'head-server',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
1010,
'Robbi (head-server)',
'Robbi',
'Robison',
'head-server'),
(11,
'host',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
1011,
'Jude (host)',
'Jude',
'Janson',
'host'),
(12,
'demo-user',
'$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
12345,
'Harper (Demo-User)',
'Harper',
'Leeland',
'server');

-- INSERT INTO log_events (id, type)
-- VALUES (1, 'clock-in'), (2, 'clock-out'), (3, 'cash-out'),(4, 'open-shift'), (5, 'close-shift'), (6, 'open-day'), (7, 'close-day'), (8, 'discount-item'), (9, 'discount-check');

INSERT INTO item_categories (id, name)
VALUES (1, 'Appetizer'),  (2, 'Soup'), (3, 'Salad'), (4, 'Sandwich'), (5, 'Entree'), (6, 'Addition'), (7, 'Dessert'), (8, 'Favorites'), (9, 'Beverage'), (10, 'Beer'), (11, 'Wine'), (12, 'Liquor'),(13, 'Children'), (14, 'Carryout'), (15, 'Delivery');

INSERT INTO destinations (id, name)
VALUES (1, 'Kitchen-Hot'), (2, 'Kitchen-Cold'),(3, 'Bar'), (4, 'No-Send');

INSERT INTO items (name, description, price, category_id, destination_id)
VALUES ('Chicken Wings',
'A full pound of wings, deep-fried served plain, mild, hot, or cajun-garlic',
8.99,
1,
1),
('Boneless Chicken Tenders',
'A heaping portion of Grade-A chicken tenders breaded, deep fried and served plain, mild, hot, four-alarm or cajun-garlic',
8.99,
1,
1),
('Warm Spinach Dip',
'Sauteed baby spinach w/ minced garlic, mozzarella and cheddar',
8.99,
1,
1),
('Potato Skins',
'Baked w/ mozarella, cheddar, and crumbled bacon topped w/ sour cream',
7.99,
1,
1),
('Stuffed Quahog',
'A local favorite chock full of fresh chopped quahog and New Bedford chorizo. Served w/ butter & lemon',
4.25,
1,
1),
('Fried Pickle Chips',
'Fresh crips beer-battered dill-pickle chips deep fried until golden. Served with home-made honey-mustard horseradish sauce',
7.99,
1,
1),
('New England Clam Chowdah',
'A classic creamy favorite',
5.99,
2,
2),
('Soup du Jour',
'Ask your server',
5.99,
2,
2),
('Caesar Salad',
'Crisp romaine lettuce w/ classic Caesar ingredients',
6.99,
3,
2),
('Walnut Chicken Salad',
'Caramelized walnut-encrusted chicken breast over crisp mesclun greens',
13.99,
3,
2),
('The Wedge Salad',
'Crisp iceberg lettuce, Gorgonzola cheese, grape tomatoes, applewood-smoked bacon and red onion served w/ blue cheese dressing',
7.99,
3,
2),
('Baby Duck',
'Baby spinach, applewood-smoked bacon, caramelized maple walnuts, dried cranberries and hard-boiled eggs finished w/ our own cherry vinaigrette',
7.99,
3,
2),
('The Angry Angus',
'A full pound of wings, deep-fried: served plain, mild, hot, or cajun-garlic',
8.99,
4,
1),
('The ABC',
'Crisp sliced Granny Smith apples, applewood-smoked bacon and Wisconsin cheddar cheese',
9.99,
4,
1),
('The Caprese',
'Buffalo mozzarella and fresh juicy tomatoes on toasted sourdough',
8.99,
4,
1),
('The French DIP',
'Hand-sliced juicy roast beef piled high on a toasted roll w/ home-made french onion soup for DIP-ing',
8.99,
4,
1),
('The Cape Codder',
'Only the freshest local haddock, beer-battered and traditionally prepared served golden brown on a toasted Kaiser roll w/ fresh field greens, tomato, and a side of our house-made tartar sauce',
9.99,
4,
1),
('The Drunken Pig',
'Tender pulled pork drenched in our own secret Bourbon sauce on a toasted Kaiser roll w/ Southern black-eyed beans and slaw',
9.99,
4,
1),
('Sirloin Tips',
'A huge one pound portion of 100% certified-Angus beef tips grilled to perfection',
17.99,
5,
1),
('Baked Stuffed Haddock',
'Tender local haddock stuffed w/ scollop & bread crumb stuffing',
14.99,
5,
1),
('Fish & Chips',
'Fresh local haddock, beer battered until juicy and golden brown',
13.99,
5,
1),
('The Hungry Pilgrim',
'Fresh sliced turkey breast, savory bread stuffing, red-bliss-garlic mash, home-made gravy and cranberry sauce',
11.99,
5,
1),
('The Duck Inn Italy',
'Hearty Italian meatballs and fresh tomato basil pomodoro presented over your choice of penne pasta or linguini & served w/ fresh garlic bread',
9.99,
5,
1),
('Rib-Eye Steak',
'Fresh Angus Beef served with choice of potato and vegetable of the day',
19.99,
6,
1),
('Baked Alaska',
'Ice-cream-filled baked meringue. A delight',
5.99,
6,
1),
('Chocolate Lava Cake',
'Rich chocolate cake with a molten-chocolate center',
6.99,
7,
2),
('Lemon Sorbet',
'Fresh and light. A great finish to a meal',
5.99,
7,
2),
('Creme Brulee',
'Creamy custard with crisp caramelized sugar',
5.99,
7,
2),
('Lobstah Deviled Eggs',
'Six hard-boiled egg halves filled w/ a lightly seasoned egg yoke and fresh lobster center topped with caviar',
10.99,
8,
1),
('Shrimp Cocktail',
'w/ our zesty home-made cocktail or spicy remoulade sauce',
1.99,
8,
1),
('Duck Wings',
'Five tender duck wings deep fried until golden and served w/ our own peanut sauce for DIP-ing',
8.99,
8,
1),
('Crabby Patties',
'Two hand-made crab cakes filled w/ fresh crab meat, a secret blend of minced vegetables and seasonings, beer-battered, fried and presented on a bed of baby spinach w/ a spicy remoulade sauce',
12.99,
8,
1),
('Baked Brie',
'Deliciously baked Brie cheese topped w/ caramelized-maple walnuts and roasted garlic served w/ warm seasoned pita bread and fresh fruit',
11.99,
8,
1),
('Coke', NULL, .99, 9, 4),
('Diet Coke', NULL, .99, 9, 4),
('Sprite', NULL, .99, 9, 4),
('Lemonade', NULL, .99, 9, 4),
('Ice Tea', NULL, .99, 9, 4),

('Cosmopolitan', NULL, 11, 12, 3),
('Lemon Drop Martini', NULL, 10, 12, 3),
('Espresso Martini', NULL, 12, 12, 3),
('Dark and Stormy', NULL, 9, 12, 3),
('Long Island Ice Tea', NULL, 9, 12, 3),

('Boschetto Pinot Grigio Glass', NULL, 9, 11, 3),
('La Crema Chardonnay Glass', NULL, 9, 11, 3),
('14 Hands Merlot Glass', NULL, 8, 11, 3),
('Wildhorse Pinot Noir Glass', NULL, 8, 11, 3),
('Sterling Cabernet Glass', NULL, 8, 11, 3),

('Curious Traveler', NULL, 4, 10, 3),
('Sam Adams', NULL, 5, 10, 3),
('Blue Moon', NULL, 6, 10, 3),
('Whales Tale', NULL, 5, 10, 3),
('Mayflower Porter', NULL, 6, 10, 3);

-- INSERT INTO payment_types (id, type)
-- VALUES (1, 'Cash'), (2, 'MC'), (3, 'Visa'), (4, 'Amex'), (5, 'Discover'), (6, 'Apple-Pay'), (7, 'Google-Pay'), (8, 'Venmo');

INSERT INTO mod_categories (id, name)
VALUES (1, 'Food'), (2, 'Drink'), (3, 'Misc');

INSERT INTO mods (name, mod_cat_id, mod_price)
VALUES ('Rare', 1, NULL), --1
('Med-Rare', 1, NULL),
('Med', 1, NULL),
('Med-Well', 1, NULL),
('Well', 1, NULL),

('American Cheese', 1, .99), --6
('Cheddar', 1, .99),
('Swiss', 1, .99),
('Mozzarella', 1, .99),
('Bacon', 1, .99),
('Portabello Mushrooms', 1, .99),
('Sauteed Onions', 1, .99),
('Sauteed Peppers', 1, .99),

('Fries', 1, NULL), --14
('Baked Potato', 1, NULL),
('Mashed Potato', 1, NULL),
('Rice', 1, NULL),
('Double Veg', 1, NULL),

('Broccoli', 1, NULL), --19
('Corn', 1, NULL),
('Spinach', 1, NULL),
('Carrots', 1, NULL),
('Double Starch', 1, NULL),

('Italian Dressing', 1, NULL), --24
('Balsamic Vinaigrette', 1, NULL),
('Raspberry Vinaigrette', 1, NULL),
('No Dressing', 1, NULL),

('Plain', 1, NULL), --28
('Mild', 1, NULL),
('Hot', 1, NULL),
('Four-Alarm', 1, NULL),
('Cajun-Garlic', 1, NULL),

('Add Chicken', 1, 4.99), --33
('Add Shrimp', 1, 7.99),
('Add Lobster', 1, 9.99),
('Add Steak Tips', 1, 6.99),
('Add Crab Cake', 1, 6.99),

('Gluten Free', 1, NULL), --38
('Vegetarian', 1, NULL),
('No Garlic', 1, NULL),
('No Onion', 1, NULL),
('No Anchovy', 1, NULL),
('No Bacon', 1, NULL),
('No Croutons', 1, NULL),
('No Bread', 1, NULL),
('No Lettuce', 1, NULL),
('No Tomato', 1, NULL),
('No Olive', 1, NULL),

('As App', 1, NULL), --49
('As Entree', 1, NULL),
('Split Plate', 1, NULL),

('Tonic', 2, NULL), --52
('Soda', 2, NULL),
('Water', 2, NULL),
('Coke', 2, NULL),
('Diet Coke', 2, NULL),
('7-Up', 2, NULL),
('Red Bull', 2, 2.00),
('Rocks on Side', 2, NULL),
('No Ice', 2, NULL),
('Extra Ice', 2, NULL),

('Olive', 2, NULL), --62
('Onion', 2, NULL),
('Twist', 2, NULL),
('Cherry', 2, NULL),
('Lemon', 2, NULL),
('Lime', 2, NULL),
('Orange', 2, NULL),
('Extra Olive', 2, NULL),
('Extra Onion', 2, NULL),
('Extra Cherry', 2, NULL),
('Extra Lemon', 2, NULL),
('Extra Lime', 2, NULL),
('Extra Orange', 2, NULL),

('Beer Glass', 2, NULL), --75
('Tall Glass', 2, NULL),
('Rocks Glass', 2, NULL),
('Shot Glass', 2, NULL),

('Takeout', 3, NULL), --79
('Utensils', 3, NULL),
('Extra Napkins', 3, NULL),
('Paper Plates', 3, NULL),

('NO', 3, NULL), --83
('Extra', 3, NULL),
('**Allergy**', 3, NULL),
('**See Server**', 3, NULL),

('Soup', 1, NULL), --87
('Salad', 1, NULL),
('Fries', 1, NULL);

INSERT INTO mod_groups (id, name, num_choices, is_required)
VALUES (1, 'Temp', 1, TRUE),
(2, 'Burger Add-Ons', 1, FALSE),
(3, 'Starch', 1, TRUE),
(4, 'Vegetable', 1, TRUE),
(5, 'Dressing', 1, TRUE),
(6, 'Salad Mods', NULL, FALSE),
(7, 'Wing Temp', 1, TRUE),
(8, 'Salad Add-Ons', 1, FALSE),
(9, 'Food', NULL, FALSE),
(10, 'Drink', NULL, FALSE),
(11, 'Takeout', NULL, FALSE),
(12, 'Misc', NULL, FALSE),
(13, 'Side Dishes', 2, TRUE);

INSERT INTO items_mod_groups(item_id, mod_group_id)
VALUES(13, 1), --Angry Angus, Temp
(19, 1), --Sirloin Tips, Temp
(24, 1), --Rib Eye Steak, Temp
(13, 3), --Angry Angus, Starch
(19, 3), --Sirloin Tips, Starch
(24, 3), --Rib Eye Steak, Starch
(17, 3), --The Cape Codder, Starch
(20, 3), --Baked Stuffed Haddock, Starch
(21, 3), --Fish & Chips, Starch
(9, 8), --Caesar Salad, Salad Mods
(10, 8), --Walnut Chicken Salad, Salad Mods
(11, 8), --The Wedge Salad, Salad Mods
(11, 6), --The Wedge Salad, Salad Dressing
(12, 8), --Baby Duck, Salad Mods
(13, 2);  --Angry Angus, Burger Add-Ons

INSERT INTO mods_mod_groups(mod_id, mod_group_id)
VALUES(1, 1), --Rare, Temp
(2, 1), --Med-Rare, Temp
(3, 1), --Med, Temp
(4, 1), --Med-Well, Temp
(5, 1), --Well, Temp

(6, 2), --American Cheese, Burger Cheese
(7, 2), --Cheddar, Burger Cheese
(8, 2), --Swiss, Burger Cheese
(9, 2), --Mozarella, Burger Cheese
(10, 2), --Bacon, Burger Cheese
(11, 2), --Portabello Mushrooms, Burger Cheese
(12, 2), --Sauteed Onions, Burger Cheese
(13, 2), --Sauteed Peppers, Burger Cheese

(14, 3), --Fries, Starch
(15, 3), --Baked Potato, Starch
(16, 3), --Mashed Potato, Starch
(17, 3), --Rice, Starch
(18, 3), --Double Veg, Starch

(19, 4), --Broccoli, Vegetable
(20, 4), --Corn, Vegetable
(21, 4), --Spinach, Vegetable
(22, 4), --Carrots, Vegetable
(23, 4), --Double Starch, Vegetable

(24, 5), --Italian Dressing, Dressing
(25, 5), --Balsamic Vinaigrette, Dressing
(26, 5), --Rasperry Vinaigrette, Dressing
(27, 5), --No Dressing, Dressing

(24, 6), --Italian Dressing, Salad Mods
(25, 6), --Balsamic Vinaigrette, Salad Mods
(26, 6), --Rasperry Vinaigrette, Salad Mods
(27, 6), --No Dressing, Salad Mods
(41, 6), --No Onion, Salad Mods
(42, 6), --No Anchovy, Salad Mods
(43, 6), --No Bacon, Salad Mods
(44, 6), --No Croutons, Salad Mods
(46, 6), --No Lettuce, Salad Mods
(47, 6), --No Tomato, Salad Mods
(48, 6), --No Olive, Salad Mods

(28, 7), --Plain, Wing-Temp
(29, 7), --Mild, Wing-Temp
(30, 7), --Hot, Wing-Temp
(31, 7), --Four-Alarm, Wing-Temp
(32, 7), --Cajun-Garlic, Wing-Temp

(33, 8), --Add Chicken, Salad Add-Ons
(34, 8), --Add Shrimp, Salad Add-Ons
(35, 8), --Add Lobster, Salad Add-Ons
(36, 8), --Add Steak Tips, Salad Add-Ons
(37, 8), --Add Crab Cake, Salad Add-Ons

(38, 9), --Gluten Free, Food
(39, 9), --Vegetarian, Food
(40, 9), --No Garlic, Food
(41, 9), --No Onion, Food
(42, 9), --No Anchovy, Food
(43, 9), --No Bacon, Food
(44, 9), --No Croutons, Food
(45, 9), --No Bread, Food
(46, 9), --No Lettuce, Food
(47, 9), --No Tomato, Food
(48, 9), --No Olive, Food

(49, 9), --As App, Food
(50, 9), --As Entree, Food
(51, 9), --Split Plate, Food

(52, 10), --Tonic, Drink
(53, 10), --Soda, Drink
(54, 10), --Water, Drink
(55, 10), --Coke, Drink
(56, 10), --Diet Coke, Drink
(57, 10), --7-Up, Drink
(58, 10), --Red Bull, Drink
(59, 10), --Rocks on Side, Drink
(60, 10), --No Ice, Drink
(61, 10), --Extra Ice, Drink

(62, 10), --Olive, Drink
(63, 10), --Onion, Drink
(64, 10), --Twist, Drink
(65, 10), --Cherry, Drink
(66, 10), --Lemon, Drink
(67, 10), --Lime, Drink
(68, 10), --Orange, Drink
(69, 10), --Extra Olive, Drink
(70, 10), --Extra Onion, Drink
(71, 10), --Extra Cherry, Drink
(72, 10), --Extra Lemon, Drink
(73, 10), --Extra Lime, Drink
(74, 10), --Extra Orange, Drink

(75, 10), --Beer Glass, Drink
(76, 10), --Tall Glass, Drink
(77, 10), --Rocks Glass, Drink
(78, 10), --Shot Glass, Drink

(79, 11), --Takeout, Takeout
(80, 11), --Utensils, Takeout
(81, 11), --Extra Napkins, Takeout
(82, 11), --Paper Plates, Takeout

(83, 12), --NO, Misc
(84, 12), --Extra, Misc
(85, 12), --**Allergy**, Misc
(86, 12), --**See Server**, Misc

(87, 13), --Soup, Side Dishes
(88, 13), --Salad, Side Dishes
(89, 13); --Fries, Side Dishes