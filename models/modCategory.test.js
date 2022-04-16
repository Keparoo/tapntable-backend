'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const ModCategory = require('./modCategory.js');
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

describe('create new mod category', () => {
  test('works', async () => {
    let category = await ModCategory.create('New Category');

    expect(category).toEqual({
      id: 4,
      name: 'New Category'
    });

    const result = await db.query(
      `SELECT name
       FROM mod_categories
       WHERE name = 'New Category'`
    );

    expect(result.rows).toEqual([
      {
        name: 'New Category'
      }
    ]);
  });
});

/**** findAll **********************************************/

describe('findAll', () => {
  test('works: find all categories', async () => {
    let categories = await ModCategory.findAll();

    expect(categories).toEqual([
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
    ]);
  });

  test('works: filter query by name', async () => {
    let categories = await ModCategory.findAll({ name: 'dr' });

    expect(categories).toEqual([
      {
        id: 2,
        name: 'Drink'
      }
    ]);
  });

  test('works: empty list on nothing found', async () => {
    let categories = await ModCategory.findAll({ name: 'nope' });
    expect(categories).toEqual([]);
  });
});

/**** get *************************************************/

describe('get a category', () => {
  test('works', async () => {
    let category = await ModCategory.get(2);

    expect(category).toEqual({
      id: 2,
      name: 'Drink'
    });
  });

  test('not found if no such category', async () => {
    try {
      await ModCategory.get(99999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/**** update ***********************************************/

describe('update mod category', () => {
  const updateData = {
    name: 'New'
  };

  test('works', async () => {
    let category = await ModCategory.update(2, updateData);

    expect(category).toEqual({
      id: 2,
      name: 'New'
    });

    const res = await db.query(
      `SELECT id, name
	     FROM mod_categories
	     WHERE id = 2`
    );

    expect(res.rows).toEqual([
      {
        id: 2,
        name: 'New'
      }
    ]);
  });

  test('not found if no such category', async () => {
    try {
      await ModCategory.update(9999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test('bad request with no data', async () => {
    try {
      await ModCategory.update(2, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/**** remove **************************************************/

describe('remove', () => {
  test('works', async () => {
    await ModCategory.remove(3);

    const res = await db.query(
      "SELECT id FROM mod_categories WHERE name='Misc'"
    );
    expect(res.rows.length).toEqual(0);
  });

  test('not found if no such item', async () => {
    try {
      await ModCategory.remove(99999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
