'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

/**
 * payment enum type values:
 * 
 * 'Cash', 'MC', 'Visa', 'Amex', 'Disc', 'Google', 'Apple','Venmo'
 */

class Payment {
  /** Create a payment (from data), update db, return new item data.
   *
   * data should be { check_id, type, tip_amt, subtotal }
   *
   * Returns { id, checkId, type, tipAmt, subtotal, isVoid }
   *
   * */

  static async create({ checkId, type, subtotal, tipAmt }) {
    const result = await db.query(
      `INSERT INTO payments
           (check_id, type, tip_amt, subtotal)
           VALUES ($1, $2, $3, $4)
           RETURNING check_id AS "checkId", type, tip_amt AS "tipAmt", subtotal, is_void AS "isVoid"`,
      [ checkId, type, tipAmt, subtotal ]
    );
    const payment = result.rows[0];

    return payment;
  }

  /** Find all payments (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - checkId
   * - userId
   * - type
   * - tipAmt
   * - isVoid
   * - createdAt: a datetime (find payments after this datetime)
   * - printedAt: a datetime (find payments after this datetime)
   * - closedAt: a datetime (find payments after this datetime)
   * - start (find payments where start <= createdAt)
   * - end (find payments where end >= createdAt)
   * - desc
   * - isOpen = true: returns records where tip_amount is null
   *
   * Returns [ { id, checkId, userId, tableNum, customer, createdAt, printedAt, closedAt, type, tipAmt, subtotal, isVoid }...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT p.id,
                        p.check_id AS "checkId",
                        c.user_id AS "userId",
                        c.table_num AS "tableNum",
                        c.customer,
                        c.created_at AS "createdAt",
                        c.printed_at AS "printedAt",
                        c.closed_at AS "closedAt",
                        p.type,
                        p.tip_amt AS "tipAmt",
                        p.subtotal,
                        p.is_void AS "isVoid"
                 FROM payments p INNER JOIN checks c
                 ON p.check_id = c.id`;
    let whereExpressions = [];
    let queryValues = [];

    const {
      checkId,
      userId,
      type,
      tipAmt,
      isVoid,
      createdAt,
      printedAt,
      closedAt,
      start,
      end,
      desc,
      isOpen
    } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (checkId) {
      queryValues.push(checkId);
      whereExpressions.push(`p.check_id = $${queryValues.length}`);
    }

    if (userId) {
      queryValues.push(userId);
      whereExpressions.push(`c.user_id = $${queryValues.length}`);
    }

    if (type) {
      queryValues.push(type);
      whereExpressions.push(`p.type = $${queryValues.length}`);
    }

    if (tipAmt) {
      queryValues.push(tipAmt);
      whereExpressions.push(`p.tip_amount = $${queryValues.length}`);
    }

    if (isVoid !== undefined) {
      queryValues.push(isVoid);
      whereExpressions.push(`p.is_void = $${queryValues.length}`);
    }

    if (createdAt) {
      queryValues.push(createdAt);
      whereExpressions.push(
        `c.created_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (printedAt) {
      queryValues.push(printedAt);
      whereExpressions.push(
        `c.printed_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (closedAt) {
      queryValues.push(closedAt);
      whereExpressions.push(
        `c.closed_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (start) {
      queryValues.push(start);
      whereExpressions.push(
        `c.created_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (end) {
      queryValues.push(end);
      whereExpressions.push(
        `c.created_at <= $${queryValues.length}::timestamptz`
      );
    }

    if (isOpen) {
      whereExpressions.push(`p.tip_amt IS NULL`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY p.check_id';
    if (desc) query += ' DESC';

    const paymentsRes = await db.query(query, queryValues);
    return paymentsRes.rows;
  }

  /** get payment totals  =>
 *   { payments:[ { id, paymentType, tipAmtSum, subtotalSum, isVoid }...]}
 *
 * Can filter on provided optional search filters:
 * - start
 * - end
 * - desc
 * - isVoid
 *
 * Authorization required: LoggedIn
 */

  static async getTotals(searchFilters = {}) {
    // const start = '2022-03-04T19:52:58.251Z';
    // const end = new Date();
    let query = `SELECT p.id,
                          COUNT(p.type) AS "paymentType",
                          SUM(p.tip_amt) AS "tipAmtSum",
                          SUM(p.subtotal) AS "subtotalSum",
                          p.is_void AS "isVoid"
                  FROM payments p INNER JOIN checks c ON p.check_id = c.id`;
    let whereExpressions = [];
    let queryValues = [];

    const { start, end, desc } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (start) {
      queryValues.push(start);
      whereExpressions.push(
        `c.created_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (end) {
      queryValues.push(end);
      whereExpressions.push(
        `c.created_at <= $${queryValues.length}::timestamptz`
      );
    }

    if (isVoid !== undefined) {
      queryValues.push(isVoid);
      whereExpressions.push(
        `c.created_at <= $${queryValues.length}::timestamptz`
      );
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' GROUP BY p.type, p.id, c.created_at';
    query += ' ORDER BY p.check_id';
    if (desc) query += ' DESC';

    const paymentRes = await db.query(query, queryValues);
    return paymentRes.rows;
  }

  /** Given a payment id, return data about the payment.
     *
     * Returns { id, checkId, userId, tableNum, customer, createdAt, printedAt, closedAt, type, tipAmt, subtotal, isVoid }
     *
     * Throws NotFoundError if not found.
     **/

  static async get(id) {
    const paymentRes = await db.query(
      `SELECT p.id,
              p.check_id AS "checkId",
              c.user_id AS "userId",
              c.table_num AS "tableNum",
              c.customer,
              c.created_at AS "createdAt",
              c.printed_at AS "printedAt",
              c.closed_at AS "closedAt",
              p.type,
              p.tip_amt AS "tipAmt",
              p.subtotal,
              p.is_void AS "isVoid"
        FROM payments p INNER JOIN checks c
        ON p.check_id = c.id
        WHERE id = $1`,
      [ id ]
    );

    const payment = paymentRes.rows[0];

    if (!payment) throw new NotFoundError(`No payment: ${id}`);

    return payment;
  }

  /** Update payment data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { checkId, type, tipAmt, subtotal, isVoid }
   *
   * Returns { id, checkId, type, tipAmt, subtotal, isVoid }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      checkId: 'check_id',
      tipAmt: 'tip_amt',
      isVoid: 'is_void'
    });
    const paymentVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE payments 
                        SET ${setCols} 
                        WHERE id = ${paymentVarIdx} 
                        RETURNING id, 
                                  check_id AS "checkId", 
                                  type,
                                  tip_amt AS "tipAmt",
                                  subtotal, 
                                  is_void AS "isVoid"`;
    const result = await db.query(querySql, [ ...values, id ]);
    const payment = result.rows[0];

    if (!payment) throw new NotFoundError(`No payment: ${id}`);

    return payment;
  }

  /** Delete given payment from database; returns undefined.
   *
   * Throws NotFoundError if item not found.
   * 
   * This method should not be used: instead is_void=true
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
             FROM payments
             WHERE id = $1
             RETURNING id`,
      [ id ]
    );
    const payment = result.rows[0];

    if (!payment) throw new NotFoundError(`No payment: ${id}`);
  }
}

module.exports = Payment;
