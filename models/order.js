'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

class Order {
  /** Create an order entry (from data), update db, return new order data.
   *
   * data should be { userId }
   *
   * Returns {{ id, userId, sentAt}
   *
   * */

  static async create({ userId }) {
    const result = await db.query(
      `INSERT INTO orders
           (user_id)
           VALUES ($1)
           RETURNING id, user_id AS "userId", sent_at AS "sentAt"`,
      [ userId ]
    );
    const order = result.rows[0];

    return order;
  }

  /** Find all orders (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - userId
   * - sentAt (find orders after sentAt datetime)
   * - before (find orders where sentAt is before this datetime)
   *
   * Returns [ { id, userId, sentAt}...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT id,
                        user_id AS "userId",
                        sent_at AS "sentAt"
                 FROM orders`;
    let whereExpressions = [];
    let queryValues = [];

    const { userId, sentAt } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (userId) {
      queryValues.push(userId);
      whereExpressions.push(`user_id = $${queryValues.length}`);
    }

    if (sentAt) {
      queryValues.push(sentAt);
      whereExpressions.push(`sent_at >= $${queryValues.length}`);
    }
    if (before) {
      queryValues.push(before);
      whereExpressions.push(`sent_at <= $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY sent_at';
    const ordersRes = await db.query(query, queryValues);
    return ordersRes.rows;
  }

  /** Given a order id, return the order entry.
     *
     * Returns { id, userId, sentAt}
     *
     * Throws NotFoundError if not found.
     **/

  static async get(id) {
    const orderRes = await db.query(
      `SELECT id,
              user_id AS "userId",
              sent_at AS "sentAt"
        FROM orders
        WHERE id = $1`,
      [ id ]
    );

    const order = orderRes.rows[0];

    if (!order) throw new NotFoundError(`No order: ${id}`);

    return order;
  }
}

module.exports = Order;
