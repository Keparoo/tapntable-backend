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

	await db.query(`
	  INSERT INTO items (name, description, price, category_id, destination_id, is_active)
	  VALUES  ('n1', 'Desc1', 1.99, 1, 3, true),
            ('n2', 'Desc2', 2.99, 5, 3, false),
            ('n3', 'Desc3', 3.99, 5, 3, false)`);

	await db.query(
		`
        INSERT INTO users(username,
                          password,
                          pin,
                          display_name,
                          first_name,
                          last_name,
                          role_id)
        VALUES ('u1', $1, 6666, 'U1D', 'U1F', 'U1L', 1),
               ('u2', $2, 7777, 'U2D', 'U2F', 'U2L', 1)
        RETURNING username`,
		[
			await bcrypt.hash('password1', BCRYPT_WORK_FACTOR),
			await bcrypt.hash('password2', BCRYPT_WORK_FACTOR)
		]
	);
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
