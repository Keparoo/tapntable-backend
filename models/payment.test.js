'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Payment = require('./payment.js');
const Check = require('./check.js');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
} = require('./_testCommon');
const { CASH } = require('../constants.js');

beforeAll(commonBeforeAll);
beforeEach(async () => {
  await commonBeforeEach();
  await db.query(`
        INSERT INTO checks (user_id, table_num, num_guests, customer)
        VALUES (2, '3', 2, 'Test Customer'),
               (2, '3', 2, 'Test Customer')
  `);
  await db.query("SELECT setval('payments_id_seq', 1)");

  // await db.query(`
  //           INSERT INTO payments (check_id, type, tip_amt, subtotal, is_void)
  //           VALUES (2, 'Cash', 5.99, 10.99, false),
  //                  (2, 'Cash', 6.99, 20.99, false),
  //                  (2, 'Cash', 7.99, 30.99, true)`);
});
afterEach(async () => {
  // await db.query(`TRUNCATE checks RESTART IDENTITY CASCADE`);
  await commonAfterEach();
});
afterAll(commonAfterAll);

/**** create *********************************************/

describe('create new payment', () => {
  const newPayment = {
    checkId: 2,
    type: CASH,
    subtotal: 5.0
  };

  test('works', async () => {
    let payment = await Payment.create(newPayment);

    payment.subtotal = +payment.subtotal;
    expect(payment).toEqual({
      checkId: 2,
      type: CASH,
      tipAmt: null,
      subtotal: 5.0,
      isVoid: false
    });

    const result = await db.query(
      `SELECT check_id, type, tip_amt, subtotal, is_void
       FROM payments
       WHERE id = 2`
    );

    expect(result.rows).toEqual([
      {
        check_id: 2,
        type: CASH,
        tip_amt: null,
        subtotal: '5.00',
        is_void: false
      }
    ]);
  });
});

/**** findAll **********************************************/

// describe('findAll', () => {
//   test('works: find all payments', async () => {
//     let payments = await Payment.findAll();

//     expect(payments).toEqual([
//       {
//         id: 1,
//         checkId: 2,
//         userId: 2,
//         tableNum: '3',
//         customer: 'Test Customer',
//         createdAt: null,
//         printedAt: null,
//         closedAt: null,
//         type: CASH,
//         tipAmt: '5.99',
//         subtotal: '10.99',
//         isVoid: false
//       },
//       {
//         id: 1,
//         checkId: 3,
//         userId: 2,
//         tableNum: '3',
//         customer: 'Test Customer',
//         createdAt: null,
//         printedAt: null,
//         closedAt: null,
//         type: CASH,
//         tipAmt: '6.99',
//         subtotal: '20.99',
//         isVoid: false
//       },
//       {
//         id: 1,
//         checkId: 2,
//         userId: 2,
//         tableNum: '3',
//         customer: 'Test Customer',
//         createdAt: null,
//         printedAt: null,
//         closedAt: null,
//         type: CASH,
//         tipAmt: '7.99',
//         subtotal: '30.99',
//         isVoid: true
//       }
//     ]);
//   });

//   test('works: filter query by checkId', async () => {
//     let payments = await Payment.findAll({ checkId: 3 });

//     expect(payments).toEqual([
//       {
//         checkId: 3,
//         type: CASH,
//         tipAmt: '6.99',
//         subtotal: '20.99',
//         isVoid: false
//       }
//     ]);
//   });

//   test('works: filter by categoryId', async () => {
//     let items = await Item.findAll({ categoryId: 5 });

//     expect(items).toEqual([
//       {
//         id: 3,
//         name: 'n2',
//         description: 'Desc2',
//         price: '2.99',
//         category: 'Entree',
//         destination: 'Bar',
//         count: null,
//         isActive: false
//       },
//       {
//         id: 4,
//         name: 'n3',
//         description: 'Desc3',
//         price: '3.99',
//         category: 'Entree',
//         destination: 'Bar',
//         count: null,
//         isActive: false
//       }
//     ]);
//   });

//   test('works: filter by isActive', async () => {
//     let items = await Item.findAll({ isActive: false });

//     expect(items).toEqual([
//       {
//         id: 3,
//         name: 'n2',
//         description: 'Desc2',
//         price: '2.99',
//         category: 'Entree',
//         destination: 'Bar',
//         count: null,
//         isActive: false
//       },
//       {
//         id: 4,
//         name: 'n3',
//         description: 'Desc3',
//         price: '3.99',
//         category: 'Entree',
//         destination: 'Bar',
//         count: null,
//         isActive: false
//       }
//     ]);
//   });

//   test('works: filter by name & isActive', async () => {
//     let items = await Item.findAll({ name: 'n', isActive: true });

//     expect(items).toEqual([
//       {
//         id: 2,
//         name: 'n1',
//         description: 'Desc1',
//         price: '1.99',
//         category: 'Appetizer',
//         destination: 'Bar',
//         count: null,
//         isActive: true
//       }
//     ]);
//   });

//   test('works: empty list on nothing found', async () => {
//     let items = await Item.findAll({ name: 'nope' });
//     expect(items).toEqual([]);
//   });
// });

describe('Always passes', () => {
  test('true', async () => {
    expect(true).toEqual(true);
  });
});
