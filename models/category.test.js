'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Category = require('./category.js');
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

describe('create new category', () => {
  test('works', async () => {
    let category = await Category.create('New Category');
    console.log('************Category', category);

    expect(category).toEqual({
      id: 16,
      name: 'New Category'
    });

    const result = await db.query(
      `SELECT name
       FROM item_categories
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
    let categories = await Category.findAll();

    expect(categories).toEqual([
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
    ]);
  });

  test('works: filter query by name', async () => {
    let categories = await Category.findAll({ name: 'ent' });

    expect(categories).toEqual([
      {
        id: 5,
        name: 'Entree'
      }
    ]);
  });

  test('works: empty list on nothing found', async () => {
    let categories = await Category.findAll({ name: 'nope' });
    expect(categories).toEqual([]);
  });
});

/**** get *************************************************/

describe('get a category', () => {
  test('works', async () => {
    let category = await Category.get(2);

    expect(category).toEqual({
      id: 2,
      name: 'Soup'
    });
  });

  test('not found if no such category', async () => {
    try {
      await Category.get(99999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/**** update ***********************************************/

describe('update item category', () => {
  const updateData = {
    name: 'New'
  };

  test('works', async () => {
    let category = await Category.update(2, updateData);

    expect(category).toEqual({
      id: 2,
      name: 'New'
    });

    const res = await db.query(
      `SELECT id, name
	     FROM item_categories
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
      await Category.update(9999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test('bad request with no data', async () => {
    try {
      await Category.update(2, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
