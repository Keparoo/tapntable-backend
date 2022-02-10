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

/**** authenticate ******************************************/

describe('authenticate', () => {
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

	test('unauth if no such user', async () => {
		try {
			await User.authenticate('nope', 'password');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});

	test('unauth if wrong password', async () => {
		try {
			await User.authenticate('c1', 'wrong');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
});

/**** register *********************************************/

describe('register', () => {
	const newUser = {
		id: 4,
		username: 'new',
		pin: 5555,
		displayName: 'Test-display',
		firstName: 'Test',
		lastName: 'Tester',
		isActive: false
	};

	test('works', async () => {
		let user = await User.register({
			...newUser,
			password: 'password'
		});

		expect(user).toEqual({ ...newUser, roleId: 1 });
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_active).toEqual(false);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	test('works: adds roleId', async () => {
		let user = await User.register({
			...newUser,
			password: 'password',
			roleId: 6
		});

		expect(user).toEqual({ ...newUser, id: 5, roleId: 6 });
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].role_id).toEqual(6);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	test('bad request with dup data', async () => {
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

/**** findAll ********************************************/

describe('findAll', () => {
	test('works', async () => {
		const users = await User.findAll();

		expect(users).toEqual([
			{
				id: 2,
				username: 'u1',
				pin: 6666,
				displayName: 'U1D',
				firstName: 'U1F',
				lastName: 'U1L',
				roleId: 1,
				isActive: true
			},
			{
				id: 3,
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

/**** get ***************************************************/

describe('get', () => {
	test('works', async () => {
		let user = await User.get('u1');

		expect(user).toEqual({
			id: 2,
			username: 'u1',
			pin: 6666,
			displayName: 'U1D',
			firstName: 'U1F',
			lastName: 'U1L',
			roleId: 1,
			isActive: true
		});
	});

	test('not found if no such user', async () => {
		try {
			await User.get('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/**** update *********************************************/

describe('update', () => {
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

	test('works', async () => {
		let user = await User.update('u1', updateData);
		expect(user).toEqual({
			id: 1,
			...updateData
		});
	});

	test('works: set password', async () => {
		let user = await User.update('u1', {
			password: 'new'
		});

		expect(user).toEqual({
			id: 2,
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

	test('not found if no such user', async () => {
		try {
			await User.update('nope', {
				firstName: 'test'
			});
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request if no data', async () => {
		expect.assertions(1);
		try {
			await User.update('c1', {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/**** remove ***********************************************/

describe('remove', () => {
	test('works', async () => {
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
