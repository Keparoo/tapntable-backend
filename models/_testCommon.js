const bcrypt = require('bcrypt');

const db = require('../db.js');
const { BCRYPT_WORK_FACTOR } = require('../config');

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query('DELETE FROM items');
  // Either of these 2 lines reset the primary key id to 1
  // For some reason the 3 items below will have ids of 2, 3, and 4

  await db.query("SELECT setval('items_id_seq', 1)");
  // await db.query('ALTER SEQUENCE items_id_seq RESTART WITH 1');

  // noinspection SqlWithoutWhere
  await db.query('DELETE FROM users');
  await db.query("SELECT setval('users_id_seq', 1)");

  // noinspection SqlWithoutWhere
  await db.query('DELETE FROM checks');
  await db.query("SELECT setval('checks_id_seq', 1)");
  // await db.query('ALTER SEQUENCE checks_id_seq RESTART WITH 1');

  // noinspection SqlWithoutWhere
  await db.query('DELETE FROM mods');
  await db.query("SELECT setval('mods_id_seq', 1)");

  await db.query(`
	  INSERT INTO items (name, description, price, category_id, destination_id, is_active)
	  VALUES  ('n1', 'Desc1', 1.99, 1, 3, true),
            ('n2', 'Desc2', 2.99, 5, 3, false),
            ('n3', 'Desc3', 3.99, 5, 3, false)`);

  await db.query(`
  INSERT INTO mods (name, mod_cat_id, mod_price, is_active)
  VALUES  ('m1', 1, 1.99, true),
          ('m2', 2, 2.99, true),
          ('m3', 3, 3.99, false)`);

  await db.query(
    `
        INSERT INTO users(username,
                          password,
                          pin,
                          display_name,
                          first_name,
                          last_name,
                          role)
        VALUES ('u1', $1, 6666, 'U1D', 'U1F', 'U1L', 'trainee'),
               ('u2', $2, 7777, 'U2D', 'U2F', 'U2L', 'trainee')
        RETURNING username`,
    [
      await bcrypt.hash('password1', BCRYPT_WORK_FACTOR),
      await bcrypt.hash('password2', BCRYPT_WORK_FACTOR)
    ]
  );

  // 	await db.query(`
  //     INSERT INTO checks(user_id,
  //                        table_num,
  //                        num_guests,
  //                        customer)
  //     VALUES  (2, 1, 2, 'Test Cust 1'),
  //             (3, 2, 4, 'Test Cust 2'),
  //             (3, 3, 6, 'Test Cust 3')
  // `);
}

async function commonBeforeEach() {
  await db.query('BEGIN');
}

async function commonAfterEach() {
  await db.query('ROLLBACK');
}

async function commonAfterAll() {
  await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
};
