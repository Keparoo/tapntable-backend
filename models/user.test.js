'use strict';

const {
	NotFoundError,
	BadRequestError,
	UnauthorizedError
} = require('../expressError');
const db = require('../db.js');
const User = require('./user.js');
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe('authenticate', function() {
	test('works', async function() {
		const user = await User.authenticate('u1', 'password1');
		expect(typeof user.id).toBe('number');
		delete user.id;

		expect(user).toEqual({
			username: 'u1',
			pin: 6666,
			displayName: 'U1D',
			firstName: 'U1F',
			lastName: 'U1L',
			roleId: 1,
			isActive: true
		});
	});

	test('unauth if no such user', async function() {
		try {
			await User.authenticate('nope', 'password');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});

	test('unauth if wrong password', async function() {
		try {
			await User.authenticate('c1', 'wrong');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
});

/************************************** register */

describe('register', function() {
	const newUser = {
		username: 'new',
		pin: 5555,
		displayName: 'Test-display',
		firstName: 'Test',
		lastName: 'Tester',
		isActive: false
	};

	test('works', async function() {
		let user = await User.register({
			...newUser,
			password: 'password'
		});

		expect(typeof user.id).toBe('number');
		delete user.id;
		expect(user.roleId).toEqual(1);
		delete user.roleId;

		expect(user).toEqual(newUser);
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_active).toEqual(false);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	test('works: adds roleId', async function() {
		let user = await User.register({
			...newUser,
			password: 'password',
			roleId: 6
		});

		expect(typeof user.id).toBe('number');
		delete user.id;

		expect(user).toEqual({ ...newUser, roleId: 6 });
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].role_id).toEqual(6);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	test('bad request with dup data', async function() {
		try {
			await User.register({
				...newUser,
				password: 'password'
			});
			await User.register({
				...newUser,
				password: 'password'
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** findAll */

describe('findAll', function() {
	test('works', async function() {
		const users = await User.findAll();

		expect(typeof users[0].id).toBe('number');
		delete users[0].id;
		expect(typeof users[1].id).toBe('number');
		delete users[1].id;

		expect(users).toEqual([
			{
				username: 'u1',
				pin: 6666,
				displayName: 'U1D',
				firstName: 'U1F',
				lastName: 'U1L',
				roleId: 1,
				isActive: true
			},
			{
				username: 'u2',
				pin: 7777,
				displayName: 'U2D',
				firstName: 'U2F',
				lastName: 'U2L',
				roleId: 1,
				isActive: true
			}
		]);
	});
});

/************************************** get */

describe('get', function() {
	test('works', async function() {
		let user = await User.get('u1');

		expect(typeof user.id).toBe('number');
		delete user.id;

		expect(user).toEqual({
			username: 'u1',
			pin: 6666,
			displayName: 'U1D',
			firstName: 'U1F',
			lastName: 'U1L',
			roleId: 1,
			isActive: true
		});
	});

	test('not found if no such user', async function() {
		try {
			await User.get('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe('update', function() {
	const updateData = {
		id: 1,
		username: 'newUserName',
		pin: 6666,
		displayName: 'NewD',
		firstName: 'NewF',
		lastName: 'NewL',
		roleId: 6,
		isActive: false
	};

	test('works', async function() {
		let user = await User.update('u1', updateData);
		expect(user).toEqual({
			id: 1,
			...updateData
		});
	});

	test('works: set password', async function() {
		let user = await User.update('u1', {
			password: 'new'
		});

		expect(typeof user.id).toBe('number');
		delete user.id;

		expect(user).toEqual({
			username: 'u1',
			pin: 6666,
			displayName: 'U1D',
			firstName: 'U1F',
			lastName: 'U1L',
			roleId: 1,
			isActive: true
		});
		const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	test('not found if no such user', async function() {
		try {
			await User.update('nope', {
				firstName: 'test'
			});
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request if no data', async function() {
		expect.assertions(1);
		try {
			await User.update('c1', {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe('remove', function() {
	test('works', async function() {
		await User.remove('u1');
		const res = await db.query("SELECT * FROM users WHERE username='u1'");
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such user', async function() {
		try {
			await User.remove('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
