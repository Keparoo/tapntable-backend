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

/**** POST /items/categories ********************************************/

describe('POST /items/categories', () => {
  const newCategory = {
    name: 'New'
  };

  test('works for admin', async () => {
    const resp = await request(app)
      .post('/items/categories')
      .send(newCategory)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);

    expect(typeof resp.body.category.id).toBe('number');
    delete resp.body.category.id;

    expect(resp.body).toEqual({
      category: {
        name: 'New'
      }
    });
  });

  test('unauth for non-admin', async () => {
    const resp = await request(app)
      .post('/items/categories')
      .send(newCategory)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('bad request with missing data', async () => {
    const resp = await request(app)
      .post('/items/categories')
      .send({})
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('bad request with invalid data', async () => {
    const resp = await request(app)
      .post('/items/categories')
      .send({
        name: 5
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**** GET /items/categories *******************************************/

describe('GET /categories', () => {
  test('ok for logged in user', async () => {
    const resp = await request(app)
      .get('/items/categories')
      .set('authorization', `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      categories: [
        {
          id: 6,
          name: 'Addition'
        },
        {
          id: 1,
          name: 'Appetizer'
        },
        {
          id: 10,
          name: 'Beer'
        },
        {
          id: 9,
          name: 'Beverage'
        },
        {
          id: 14,
          name: 'Carryout'
        },
        {
          id: 13,
          name: 'Children'
        },
        {
          id: 15,
          name: 'Delivery'
        },
        {
          id: 7,
          name: 'Dessert'
        },
        {
          id: 5,
          name: 'Entree'
        },
        {
          id: 8,
          name: 'Favorites'
        },
        {
          id: 12,
          name: 'Liquor'
        },
        {
          id: 3,
          name: 'Salad'
        },
        {
          id: 4,
          name: 'Sandwich'
        },
        {
          id: 2,
          name: 'Soup'
        },
        {
          id: 11,
          name: 'Wine'
        }
      ]
    });
  });

  test('works: filtering', async () => {
    const resp = await request(app)
      .get('/items/categories')
      .query({ name: 'ent' })
      .set('authorization', `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      categories: [
        {
          id: 5,
          name: 'Entree'
        }
      ]
    });
  });

  test('bad request if invalid filter key', async () => {
    const resp = await request(app)
      .get('/items/categories')
      .query({ name: 'Entree', nope: 'nope' })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**** GET /items/categories/:id ************************************/

describe('GET /items/categories/:id', () => {
  test('works for logged-in user', async () => {
    const resp = await request(app)
      .get(`/items/categories/2`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      category: {
        id: 2,
        name: 'Soup'
      }
    });
  });

  test('not found or no such category', async () => {
    const resp = await request(app)
      .get(`/items/categories/9999999`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/**** PATCH /items/categories/:id **************************************/

describe('PATCH /items/categories/:id', () => {
  test('works for admin', async function() {
    const resp = await request(app)
      .patch(`/items/categories/2`)
      .send({
        name: 'Category-new'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      category: {
        id: 2,
        name: 'Category-new'
      }
    });
  });

  test('unauth for non-admin', async () => {
    const resp = await request(app)
      .patch(`/items/categories/2`)
      .send({
        name: 'Category-new'
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).patch(`/items/categories/2`).send({
      name: 'Category-new'
    });
    expect(resp.statusCode).toEqual(401);
  });

  test('not found or no such category', async () => {
    const resp = await request(app)
      .patch(`/items/category/999999`)
      .send({
        name: 'new nope'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test('bad request on id change attempt', async () => {
    const resp = await request(app)
      .patch(`/items/categories/2`)
      .send({
        id: 'Category-new'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('bad request on invalid data', async () => {
    const resp = await request(app)
      .patch(`/items/categories/2`)
      .send({
        name: 5
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**** DELETE /items/categories/:id ********************************/

describe('DELETE /items/categories/:id', () => {
  test('works for admin', async () => {
    const resp = await request(app)
      .delete(`/items/categories/2`)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: '2' });
  });

  test('unauth for logged-in user', async () => {
    const resp = await request(app)
      .delete(`/items/categories/2`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).delete(`/items/categories/2`);
    expect(resp.statusCode).toEqual(401);
  });

  test('not found for no such company', async () => {
    const resp = await request(app)
      .delete(`/items/categories/999999`)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
