'use strict';

const request = require('supertest');

const db = require('../db.js');
const app = require('../app');
const User = require('../models/user');

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/**** POST /users **************************************/

describe('POST /users', () => {
  test('works for admins: create non-admin', async () => {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        password: 'password-new',
        pin: 9999,
        displayName: 'Display-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        role: 'server'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);

    expect(resp.body).toEqual({
      user: {
        id: 5,
        username: 'u-new',
        pin: 9999,
        displayName: 'Display-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        role: 'server',
        isClockedIn: false,
        isActive: true
      },
      token: expect.any(String)
    });
  });

  test('works for admins: create admin', async () => {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        password: 'password-new',
        pin: 9999,
        displayName: 'Display-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        role: 'manager'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);

    expect(resp.body).toEqual({
      user: {
        id: 6,
        username: 'u-new',
        pin: 9999,
        displayName: 'Display-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        role: 'manager',
        isClockedIn: false,
        isActive: true
      },
      token: expect.any(String)
    });
  });

  test('unauth for users', async () => {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        password: 'password-new',
        pin: 9999,
        displayName: 'Display-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        role: 'manager'
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).post('/users').send({
      username: 'u-new',
      password: 'password-new',
      pin: 9999,
      displayName: 'Display-new',
      firstName: 'First-new',
      lastName: 'Last-new',
      role: 'manager'
    });
    expect(resp.statusCode).toEqual(401);
  });

  test('bad request if missing data', async () => {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('bad request if invalid data', async () => {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        password: 'password-new',
        pin: 'not a pin',
        displayName: 'Display-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        role: 'manager'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**** GET /users ****************************************/

describe('GET /users', () => {
  test('works for admins', async () => {
    const resp = await request(app)
      .get('/users')
      .set('authorization', `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      users: [
        {
          id: 2,
          username: 'u1',
          pin: 6666,
          displayName: 'U1D',
          firstName: 'U1F',
          lastName: 'U1L',
          role: 'trainee',
          isClockedIn: false,
          isActive: true
        },
        {
          id: 3,
          username: 'u2',
          pin: 7777,
          displayName: 'U2D',
          firstName: 'U2F',
          lastName: 'U2L',
          role: 'trainee',
          isClockedIn: false,
          isActive: true
        },
        {
          id: 4,
          username: 'u3',
          pin: 8888,
          displayName: 'U3D',
          firstName: 'U3F',
          lastName: 'U3L',
          role: 'trainee',
          isClockedIn: false,
          isActive: true
        }
      ]
    });
  });

  test('unauth for non-admin users', async () => {
    const resp = await request(app)
      .get('/users')
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).get('/users');
    expect(resp.statusCode).toEqual(401);
  });

  test('fails: test next() handler', async () => {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query('DROP TABLE users CASCADE');
    const resp = await request(app)
      .get('/users')
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/**** GET /users/:username **************************************/

describe('GET /users/:username', () => {
  test('works for admin', async () => {
    const resp = await request(app)
      .get(`/users/u1`)
      .set('authorization', `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      user: {
        id: 2,
        username: 'u1',
        pin: 6666,
        displayName: 'U1D',
        firstName: 'U1F',
        lastName: 'U1L',
        role: 'trainee',
        isClockedIn: false,
        isActive: true
      }
    });
  });

  test('works for same user', async () => {
    const resp = await request(app)
      .get(`/users/u1`)
      .set('authorization', `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      user: {
        id: 2,
        username: 'u1',
        pin: 6666,
        displayName: 'U1D',
        firstName: 'U1F',
        lastName: 'U1L',
        role: 'trainee',
        isClockedIn: false,
        isActive: true
      }
    });
  });

  test('unauth for other users', async () => {
    const resp = await request(app)
      .get(`/users/u1`)
      .set('authorization', `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test('not found if user not found', async () => {
    const resp = await request(app)
      .get(`/users/nope`)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/**** PATCH /users/:username ******************************/

describe('PATCH /users/:username', () => {
  test('works for admins', async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 'New'
      })
      .set('authorization', `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      user: {
        id: 2,
        username: 'u1',
        pin: 6666,
        displayName: 'U1D',
        firstName: 'New',
        lastName: 'U1L',
        role: 'trainee',
        isClockedIn: false,
        isActive: true
      }
    });
  });

  test('unauth if not admin', async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 'New'
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).patch(`/users/u1`).send({
      firstName: 'New'
    });
    expect(resp.statusCode).toEqual(401);
  });

  test('not found if no such user', async () => {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: 'Nope'
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test('bad request if invalid data', async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42
      })
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('works: can set new password', async () => {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: 'new-password'
      })
      .set('authorization', `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      user: {
        id: 2,
        username: 'u1',
        pin: 6666,
        displayName: 'U1D',
        firstName: 'U1F',
        lastName: 'U1L',
        role: 'trainee',
        isClockedIn: false,
        isActive: true
      }
    });
    const isSuccessful = await User.authenticate('u1', 'new-password');
    expect(isSuccessful).toBeTruthy();
  });
});

/**** DELETE /users/:username *********************************/

describe('DELETE /users/:username', () => {
  test('works for admin', async () => {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: 'u1' });
  });

  test('unauth if not manager', async () => {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for anon', async () => {
    const resp = await request(app).delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test('not found if user missing', async () => {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set('authorization', `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
