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
   * - type
   * - isVoid
   *
   * Returns [ { id, checkId, type, tipAmt, subtotal, isVoid }...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT id,
                        check_id AS "checkId",
                        type,
                        tip_amt AS "tipAmt",
                        subtotal,
                        is_void AS "isVoid"
                 FROM payments`;
    let whereExpressions = [];
    let queryValues = [];

    const { checkId, type, isVoid } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (checkId) {
      queryValues.push(checkId);
      whereExpressions.push(`check_id = $${queryValues.length}`);
    }

    if (type) {
      queryValues.push(type);
      whereExpressions.push(`type = $${queryValues.length}`);
    }

    if (isVoid !== undefined) {
      queryValues.push(isVoid);
      whereExpressions.push(`is_void = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY check_id';
    const paymentsRes = await db.query(query, queryValues);
    return paymentsRes.rows;
  }

  /** Given a payment id, return data about the payment.
     *
     * Returns { id, checkId, type, tipAmt, subtotal, isVoid }
     *
     * Throws NotFoundError if not found.
     **/

  static async get(id) {
    const paymentRes = await db.query(
      `SELECT id,
              check_id AS "checkId",
              type,
              tip_amt AS "tipAmt",
              subtotal,
              is_void AS "isVoid"
        FROM payments
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
