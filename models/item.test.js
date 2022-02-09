'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Item = require('./item.js');
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

/************************************** create */

describe('create', () => {
	const newItem = {
		name: 'New Item',
		description: 'New Description',
		price: 9.99,
		categoryId: 5,
		destinationId: 1,
		count: null,
		isActive: true
	};

	test('works', async () => {
		let item = await Item.create(newItem);
		expect(typeof item.id).toBe('number');
		delete item.id;
		item.price = +item.price;
		expect(item).toEqual(newItem);

		const result = await db.query(
			`SELECT name, description, price, category_id, destination_id, count, is_active
           FROM items
           WHERE name = 'New Item'`
		);

		expect(result.rows).toEqual([
			{
				name: 'New Item',
				description: 'New Description',
				price: '9.99',
				category_id: 5,
				destination_id: 1,
				count: null,
				is_active: true
			}
		]);
	});

	// test('bad request with dupe', async function() {
	// 	try {
	// 		await Item.create(newItem);
	// 		await Item.create(newItem);
	// 		fail();
	// 	} catch (err) {
	// 		expect(err instanceof BadRequestError).toBeTruthy();
	// 	}
	// });
});

/************************************** findAll */

describe('findAll', function() {
	test('works: find all items', async function() {
		let items = await Item.findAll();

		expect(typeof items[0].id).toBe('number');
		delete items[0].id;
		expect(typeof items[1].id).toBe('number');
		delete items[1].id;
		expect(typeof items[2].id).toBe('number');
		delete items[2].id;

		expect(items).toEqual([
			{
				name: 'n1',
				description: 'Desc1',
				price: '1.99',
				categoryId: 1,
				destinationId: 3,
				count: null,
				isActive: true
			},
			{
				name: 'n2',
				description: 'Desc2',
				price: '2.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			},
			{
				name: 'n3',
				description: 'Desc3',
				price: '3.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			}
		]);
	});

	test('works: filter query by name', async function() {
		let items = await Item.findAll({ name: '1' });

		expect(typeof items[0].id).toBe('number');
		delete items[0].id;

		expect(items).toEqual([
			{
				name: 'n1',
				description: 'Desc1',
				price: '1.99',
				categoryId: 1,
				destinationId: 3,
				count: null,
				isActive: true
			}
		]);
	});

	test('works: filter by categoryId', async function() {
		let items = await Item.findAll({ categoryId: 5 });

		expect(typeof items[0].id).toBe('number');
		delete items[0].id;
		expect(typeof items[1].id).toBe('number');
		delete items[1].id;

		expect(items).toEqual([
			{
				name: 'n2',
				description: 'Desc2',
				price: '2.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			},
			{
				name: 'n3',
				description: 'Desc3',
				price: '3.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			}
		]);
	});

	test('works: filter by isActive', async function() {
		let items = await Item.findAll({ isActive: false });

		expect(typeof items[0].id).toBe('number');
		delete items[0].id;
		expect(typeof items[1].id).toBe('number');
		delete items[1].id;

		expect(items).toEqual([
			{
				name: 'n2',
				description: 'Desc2',
				price: '2.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			},
			{
				name: 'n3',
				description: 'Desc3',
				price: '3.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			}
		]);
	});

	test('works: filter by name & isActive', async function() {
		let items = await Item.findAll({ name: 'n', isActive: true });

		expect(typeof items[0].id).toBe('number');
		delete items[0].id;

		expect(items).toEqual([
			{
				name: 'n1',
				description: 'Desc1',
				price: '1.99',
				categoryId: 1,
				destinationId: 3,
				count: null,
				isActive: true
			}
		]);
	});

	test('works: empty list on nothing found', async function() {
		let items = await Item.findAll({ name: 'nope' });
		expect(items).toEqual([]);
	});
});

/************************************** get */

describe('get', function() {
	test('works', async function() {
		const result = await db.query(
			`SELECT id
           FROM items
           WHERE name = 'n1'`
		);

		let item = await Item.get(result.rows[0].id);

		expect(typeof item.id).toBe('number');
		delete item.id;

		expect(item).toEqual({
			name: 'n1',
			description: 'Desc1',
			price: '1.99',
			categoryId: 1,
			destinationId: 3,
			count: null,
			isActive: true
		});
	});

	test('not found if no such item', async function() {
		try {
			await Item.get(99999999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe('update', function() {
	const updateData = {
		name: 'New',
		description: 'New Description',
		price: 10.99,
		categoryId: 6,
		destinationId: 2,
		count: 1,
		isActive: false
	};

	test('works', async function() {
		const result = await db.query(
			`SELECT id
             FROM items
             WHERE name = 'n1'`
		);

		let item = await Item.update(result.rows[0].id, updateData);

		expect(item).toEqual({
			id: result.rows[0].id,
			name: 'New',
			description: 'New Description',
			price: '10.99',
			categoryId: 6,
			destinationId: 2,
			count: 1,
			isActive: false
		});

		const res = await db.query(
			`SELECT id, name, description, price, category_id, destination_id, count, is_active
	           FROM items
	           WHERE id = ${result.rows[0].id}`
		);

		expect(res.rows).toEqual([
			{
				id: result.rows[0].id,
				name: 'New',
				description: 'New Description',
				price: '10.99',
				category_id: 6,
				destination_id: 2,
				count: 1,
				is_active: false
			}
		]);
	});

	test('works: null fields', async function() {
		const updateDataSetNulls = {
			name: 'New',
			description: null,
			count: null
		};

		const res = await db.query(
			`SELECT id
             FROM items
             WHERE name = 'n1'`
		);

		let item = await Item.update(res.rows[0].id, updateDataSetNulls);
		expect(item).toEqual({
			id: res.rows[0].id,
			name: 'New',
			description: null,
			price: '1.99',
			categoryId: 1,
			destinationId: 3,
			count: null,
			isActive: true
		});

		const result = await db.query(
			`SELECT name, description, price, category_id, destination_id, count, is_active
		           FROM items
		           WHERE id = ${res.rows[0].id}`
		);
		expect(result.rows).toEqual([
			{
				name: 'New',
				description: null,
				price: '1.99',
				category_id: 1,
				destination_id: 3,
				count: null,
				is_active: true
			}
		]);
	});

	test('not found if no such item', async function() {
		try {
			await Item.update(9999999, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request with no data', async function() {
		try {
			await Item.update('c1', {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe('remove', function() {
	test('works', async function() {
		const result = await db.query(
			`SELECT id
           FROM items
           WHERE name = 'n1'`
		);

		await Item.remove(result.rows[0].id);

		const res = await db.query("SELECT id FROM items WHERE name='n1'");
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such item', async function() {
		try {
			await Item.remove(99999999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
