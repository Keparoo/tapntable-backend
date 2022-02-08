'use strict';

const db = require('../db.js');
const User = require('../models/user');
// const Company = require('../models/company');
// const Job = require('../models/job');
const { createToken } = require('../helpers/tokens');

// const testJobIds = [];

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');
	// // noinspection SqlWithoutWhere
	// await db.query('DELETE FROM companies');

	// await Company.create({
	// 	handle: 'c1',
	// 	name: 'C1',
	// 	numEmployees: 1,
	// 	description: 'Desc1',
	// 	logoUrl: 'http://c1.img'
	// });
	// await Company.create({
	// 	handle: 'c2',
	// 	name: 'C2',
	// 	numEmployees: 2,
	// 	description: 'Desc2',
	// 	logoUrl: 'http://c2.img'
	// });
	// await Company.create({
	// 	handle: 'c3',
	// 	name: 'C3',
	// 	numEmployees: 3,
	// 	description: 'Desc3',
	// 	logoUrl: 'http://c3.img'
	// });

	// testJobIds[0] = (await Job.create({
	// 	title: 'J1',
	// 	salary: 1,
	// 	equity: '0.1',
	// 	companyHandle: 'c1'
	// })).id;
	// testJobIds[1] = (await Job.create({
	// 	title: 'J2',
	// 	salary: 2,
	// 	equity: '0.2',
	// 	companyHandle: 'c1'
	// })).id;
	// testJobIds[2] = (await Job.create({
	// 	title: 'J3',
	// 	salary: 3,
	// 	/* equity null */ companyHandle: 'c1'
	// })).id;

	await User.register({
		username: 'u1',
		password: 'password1',
		pin: 6666,
		displayName: 'U1D',
		firstName: 'U1F',
		lastName: 'U1L',
		roleId: 1
	});
	await User.register({
		username: 'u2',
		password: 'password2',
		pin: 7777,
		displayName: 'U2D',
		firstName: 'U2F',
		lastName: 'U2L',
		roleId: 1
	});
	await User.register({
		username: 'u3',
		password: 'password3',
		pin: 8888,
		displayName: 'U3D',
		firstName: 'U3F',
		lastName: 'U3L',
		roleId: 1
	});

	// await User.applyToJob('u1', testJobIds[0]);
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

// Create token with lowest role: trainee
const u1Token = createToken({ username: 'u1', roleId: 1 });
// Create token with most common role: server
const u2Token = createToken({ username: 'u2', roleId: 6 });
// Create token with access role: manager
const adminToken = createToken({ username: 'admin', roleId: 10 });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token,
	adminToken
};
