const bcrypt = require('bcrypt');

const db = require('../db.js');
const { BCRYPT_WORK_FACTOR } = require('../config');

// const testJobIds = [];

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	// await db.query("DELETE FROM companies");
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');

	// await db.query(`
	//   INSERT INTO companies(handle, name, num_employees, description, logo_url)
	//   VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
	//          ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
	//          ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

	// const resultsJobs = await db.query(`
	//   INSERT INTO jobs (title, salary, equity, company_handle)
	//   VALUES ('Job1', 100, '0.1', 'c1'),
	//          ('Job2', 200, '0.2', 'c1'),
	//          ('Job3', 300, '0', 'c1'),
	//          ('Job4', NULL, NULL, 'c1')
	//   RETURNING id`);
	// testJobIds.splice(0, 0, ...resultsJobs.rows.map(r => r.id));

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

	// await db.query(`
	//       INSERT INTO applications(username, job_id)
	//       VALUES ('u1', $1)`,
	//     [testJobIds[0]]);
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
