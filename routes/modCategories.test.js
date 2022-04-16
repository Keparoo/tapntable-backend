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

/**** POST /mods/categories ********************************************/

describe('POST /mods/categories', () => {
  const newCategory = {
    name: 'New'
  };

  test('works for admin', async () => {
    const resp = await request(app)
      .post('/mods/categories')
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
      .post('/mods/categories')
      .send(newCategory)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('bad request with missing data', async () => {
    const resp = await request(app)
      .post('/mods/categories')
      .send({})
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('bad request with invalid data', async () => {
    const resp = await request(app)
      .post('/mods/categories')
      .send({
        name: 5
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**** GET /mods/categories *******************************************/

describe('GET /mods/categories', () => {
  test('ok for logged in user', async () => {
    const resp = await request(app)
      .get('/mods/categories')
      .set('authorization', `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      categories: [
        {
          id: 2,
          name: 'Drink'
        },
        {
          id: 1,
          name: 'Food'
        },
        {
          id: 3,
          name: 'Misc'
        }
      ]
    });
  });

  test('works: filtering', async () => {
    const resp = await request(app)
      .get('/mods/categories')
      .query({ name: 'dr' })
      .set('authorization', `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      categories: [
        {
          id: 2,
          name: 'Drink'
        }
      ]
    });
  });

  test('bad request if invalid filter key', async () => {
    const resp = await request(app)
      .get('/mods/categories')
      .query({ name: 'Drink', nope: 'nope' })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**** GET /mods/categories/:id ************************************/

describe('GET /mods/categories/:id', () => {
  test('works for logged-in user', async () => {
    const resp = await request(app)
      .get(`/mods/categories/2`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      category: {
        id: 2,
        name: 'Drink'
      }
    });
  });

  test('not found or no such category', async () => {
    const resp = await request(app)
      .get(`/mods/categories/9999999`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/**** PATCH /mods/categories/:id **************************************/

describe('PATCH /mods/categories/:id', () => {
  test('works for admin', async function() {
    const resp = await request(app)
      .patch(`/mods/categories/2`)
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
      .patch(`/mods/categories/2`)
      .send({
        name: 'Category-new'
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).patch(`/mods/categories/2`).send({
      name: 'Category-new'
    });
    expect(resp.statusCode).toEqual(401);
  });

  test('not found or no such category', async () => {
    const resp = await request(app)
      .patch(`/mods/category/999999`)
      .send({
        name: 'new nope'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test('bad request on id change attempt', async () => {
    const resp = await request(app)
      .patch(`/mods/categories/2`)
      .send({
        id: 'Category-new'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('bad request on invalid data', async () => {
    const resp = await request(app)
      .patch(`/mods/categories/2`)
      .send({
        name: 5
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**** DELETE /mods/categories/:id ********************************/

describe('DELETE /mods/categories/:id', () => {
  test('works for admin', async () => {
    const resp = await request(app)
      .delete(`/mods/categories/2`)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: '2' });
  });

  test('unauth for logged-in user', async () => {
    const resp = await request(app)
      .delete(`/mods/categories/2`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).delete(`/mods/categories/2`);
    expect(resp.statusCode).toEqual(401);
  });

  test('not found for no such company', async () => {
    const resp = await request(app)
      .delete(`/mods/categories/999999`)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
