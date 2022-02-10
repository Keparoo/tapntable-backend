'use strict';

const db = require('../db.js');
const User = require('../models/user');
const Item = require('../models/item');
// const Company = require('../models/company');
// const Job = require('../models/job');
const { createToken } = require('../helpers/tokens');

// const testJobIds = [];

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');
	await db.query("SELECT setval('users_id_seq', 1)");
	// // noinspection SqlWithoutWhere

	await db.query('DELETE FROM items');
	// Either of these 2 lines reset the primary key id to 1
	// For some reason the 3 items below will have ids of 2, 3, and 4

	await db.query("SELECT setval('items_id_seq', 1)");
	// await db.query('ALTER SEQUENCE items_id_seq RESTART WITH 1');

	await Item.create({
		name: 'n1',
		description: 'Desc1',
		price: 1.99,
		categoryId: 1,
		destinationId: 3
	});
	await Item.create({
		name: 'n2',
		description: 'Desc2',
		price: 2.99,
		categoryId: 5,
		destinationId: 3
	});
	await Item.create({
		name: 'n3',
		description: 'Desc3',
		price: 3.99,
		categoryId: 5,
		destinationId: 3
	});

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
