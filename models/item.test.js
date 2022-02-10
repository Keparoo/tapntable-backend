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

/**** create *********************************************/

describe('create', () => {
	const newItem = {
		id: 5,
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
});

/**** findAll **********************************************/

describe('findAll', () => {
	test('works: find all items', async () => {
		let items = await Item.findAll();

		expect(items).toEqual([
			{
				id: 2,
				name: 'n1',
				description: 'Desc1',
				price: '1.99',
				categoryId: 1,
				destinationId: 3,
				count: null,
				isActive: true
			},
			{
				id: 3,
				name: 'n2',
				description: 'Desc2',
				price: '2.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			},
			{
				id: 4,
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

	test('works: filter query by name', async () => {
		let items = await Item.findAll({ name: '1' });

		expect(items).toEqual([
			{
				id: 2,
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

	test('works: filter by categoryId', async () => {
		let items = await Item.findAll({ categoryId: 5 });

		expect(items).toEqual([
			{
				id: 3,
				name: 'n2',
				description: 'Desc2',
				price: '2.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			},
			{
				id: 4,
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

	test('works: filter by isActive', async () => {
		let items = await Item.findAll({ isActive: false });

		expect(items).toEqual([
			{
				id: 3,
				name: 'n2',
				description: 'Desc2',
				price: '2.99',
				categoryId: 5,
				destinationId: 3,
				count: null,
				isActive: false
			},
			{
				id: 4,
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

	test('works: filter by name & isActive', async () => {
		let items = await Item.findAll({ name: 'n', isActive: true });

		expect(items).toEqual([
			{
				id: 2,
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

	test('works: empty list on nothing found', async () => {
		let items = await Item.findAll({ name: 'nope' });
		expect(items).toEqual([]);
	});
});

/**** get *************************************************/

describe('get', () => {
	test('works', async () => {
		let item = await Item.get(2);

		expect(item).toEqual({
			id: 2,
			name: 'n1',
			description: 'Desc1',
			price: '1.99',
			categoryId: 1,
			destinationId: 3,
			count: null,
			isActive: true
		});
	});

	test('not found if no such item', async () => {
		try {
			await Item.get(99999999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/**** update ***********************************************/

describe('update', () => {
	const updateData = {
		name: 'New',
		description: 'New Description',
		price: 10.99,
		categoryId: 6,
		destinationId: 2,
		count: 1,
		isActive: false
	};

	test('works', async () => {
		let item = await Item.update(2, updateData);

		expect(item).toEqual({
			id: 2,
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
	           WHERE id = 2`
		);

		expect(res.rows).toEqual([
			{
				id: 2,
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

	test('works: null fields', async () => {
		const updateDataSetNulls = {
			name: 'New',
			description: null,
			count: null
		};

		let item = await Item.update(2, updateDataSetNulls);
		expect(item).toEqual({
			id: 2,
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
		           WHERE id = 2`
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

	test('not found if no such item', async () => {
		try {
			await Item.update(9999999, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request with no data', async () => {
		try {
			await Item.update('c1', {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/**** remove **************************************************/

describe('remove', () => {
	test('works', async () => {
		await Item.remove(2);

		const res = await db.query("SELECT id FROM items WHERE name='n1'");
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such item', async () => {
		try {
			await Item.remove(99999999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
