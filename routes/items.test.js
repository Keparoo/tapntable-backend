'use strict';

const request = require('supertest');

const app = require('../app');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	adminToken
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/**** POST /items ********************************************/

describe('POST /items', () => {
	const newItem = {
		name: 'New',
		description: 'DescNew',
		price: 1.99,
		categoryId: 1,
		destinationId: 3
	};

	test('works for admin', async () => {
		const resp = await request(app)
			.post('/items')
			.send(newItem)
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);

		expect(resp.body).toEqual({
			item: {
				id: 5,
				name: 'New',
				description: 'DescNew',
				price: '1.99',
				categoryId: 1,
				destinationId: 3,
				count: null,
				isActive: true
			}
		});
	});

	test('unauth for non-admin', async () => {
		const resp = await request(app)
			.post('/items')
			.send(newItem)
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request with missing data', async () => {
		const resp = await request(app)
			.post('/items')
			.send({
				name: 'new',
				price: 10.99
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request with invalid data', async () => {
		const resp = await request(app)
			.post('/items')
			.send({
				...newItem,
				price: 'not-a-price'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/**** GET /items *******************************************/

describe('GET /items', () => {
	test('ok for logged in user', async () => {
		const resp = await request(app)
			.get('/items')
			.set('authorization', `Bearer ${u1Token}`);

		expect(resp.body).toEqual({
			items: [
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
					isActive: true
				},
				{
					id: 4,
					name: 'n3',
					description: 'Desc3',
					price: '3.99',
					categoryId: 5,
					destinationId: 3,
					count: null,
					isActive: true
				}
			]
		});
	});

	test('works: filtering', async () => {
		const resp = await request(app)
			.get('/items')
			.query({ name: 3 })
			.set('authorization', `Bearer ${u1Token}`);

		expect(resp.body).toEqual({
			items: [
				{
					id: 4,
					name: 'n3',
					description: 'Desc3',
					price: '3.99',
					categoryId: 5,
					destinationId: 3,
					count: null,
					isActive: true
				}
			]
		});
	});

	test('works: filtering on all filters', async () => {
		const resp = await request(app)
			.get('/items')
			.query({ categoryId: 5, isActive: true, name: '3' })
			.set('authorization', `Bearer ${u1Token}`);

		expect(typeof resp.body.items[0].id).toBe('number');
		delete resp.body.items[0].id;

		expect(resp.body).toEqual({
			items: [
				{
					name: 'n3',
					description: 'Desc3',
					price: '3.99',
					categoryId: 5,
					destinationId: 3,
					count: null,
					isActive: true
				}
			]
		});
	});

	test('bad request if invalid filter key', async () => {
		const resp = await request(app)
			.get('/items')
			.query({ name: '2', nope: 'nope' })
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/**** GET /items/:id ************************************/

describe('GET /items/:id', () => {
	test('works for logged-in user', async () => {
		const resp = await request(app)
			.get(`/items/2`)
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			item: {
				id: 2,
				name: 'n1',
				description: 'Desc1',
				price: '1.99',
				categoryId: 1,
				destinationId: 3,
				count: null,
				isActive: true
			}
		});
	});

	test('not found or no such item', async () => {
		const resp = await request(app)
			.get(`/items/9999999`)
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});

/**** PATCH /items/:id **************************************/

describe('PATCH /items/:id', () => {
	test('works for admin', async function() {
		const resp = await request(app)
			.patch(`/items/2`)
			.send({
				name: 'N1-new'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			item: {
				id: 2,
				name: 'N1-new',
				description: 'Desc1',
				price: '1.99',
				categoryId: 1,
				destinationId: 3,
				count: null,
				isActive: true
			}
		});
	});

	test('unauth for non-admin', async () => {
		const resp = await request(app)
			.patch(`/items/2`)
			.send({
				name: 'N1-new'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('unauth for anon', async () => {
		const resp = await request(app).patch(`/items/2`).send({
			name: 'N1-new'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('not found or no such company', async () => {
		const resp = await request(app)
			.patch(`/items/999999`)
			.send({
				name: 'new nope'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test('bad request on id change attempt', async () => {
		const resp = await request(app)
			.patch(`/items/2`)
			.send({
				id: 'N1-new'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request on invalid data', async () => {
		const resp = await request(app)
			.patch(`/items/2`)
			.send({
				price: 'not-a-price'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/**** DELETE /items/:id ********************************/

describe('DELETE /items/:id', () => {
	test('works for admin', async () => {
		const resp = await request(app)
			.delete(`/items/2`)
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: '2' });
	});

	test('unauth for logged-in user', async () => {
		const resp = await request(app)
			.delete(`/items/2`)
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('unauth for anon', async () => {
		const resp = await request(app).delete(`/items/2`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found for no such company', async () => {
		const resp = await request(app)
			.delete(`/items/999999`)
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});
