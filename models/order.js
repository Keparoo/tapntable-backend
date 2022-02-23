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
   * - destinationId
   * - before (find orders where sentAt is before this datetime)
   *
   * Returns [ { id, userId, sentAt, itemId, name, price, categoryId,  count, destination_id, check_id, seat_num, item_note, is_void}...]
   * 
   * Default sort order is sent_by ascending. query filter desc=true will sort by sent_by descending
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT o.id,
                        o.user_id AS "userId",
                        o.sent_at AS "sentAt",
                        oi.item_id AS "itemId",
                        i.name,
                        i.price,
                        i.category_id AS "categoryId",
                        i.count,
                        i.destination_id AS "destinationId",
                        oi.check_id AS "checkId",
                        oi.seat_num AS "seatNum",
                        oi.item_note AS "itemNote",
                        oi.is_void AS "isVoid"
                 FROM orders o
                 JOIN ordered_items oi ON o.id = oi.order_id
                 JOIN items i ON oi.item_id = i.id`;

    let whereExpressions = [];
    let queryValues = [];

    const { userId, sentAt, destinationId, before, desc } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (userId) {
      queryValues.push(userId);
      whereExpressions.push(`o.user_id = $${queryValues.length}`);
    }

    if (destinationId) {
      queryValues.push(destinationId);
      whereExpressions.push(`i.destination_id = $${queryValues.length}`);
    }

    if (sentAt) {
      queryValues.push(sentAt);
      whereExpressions.push(`o.sent_at >= $${queryValues.length}`);
    }

    if (before) {
      queryValues.push(before);
      whereExpressions.push(`o.sent_at <= $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results
    query += ' ORDER BY o.sent_at';
    if (desc) query += ' DESC';

    const ordersRes = await db.query(query, queryValues);
    return ordersRes.rows;
  }

  /** Find all orders (optional filter on searchFilters).
   *
   * Alternate function to above
   * 
   * searchFilters (all optional):
   * - userId
   * - sentAt (find orders after sentAt datetime)
   * - completedAt
   * - before (find orders where sentAt is before this datetime)
   *
   * Returns [ { id, userId, displayName, sentAt, completedAt}...]
   * 
   * Default sort order is sent_by ascending. query filter desc=true will sort by sent_by descending
   * */

  static async findAllOrders(searchFilters = {}) {
    let query = `SELECT o.id,
                        o.user_id AS "userId",
                        u.display_name AS "displayName",
                        o.sent_at AS "sentAt",
                        o.completed_at AS "completedAt"
                 FROM ORDERS o INNER JOIN users u ON o.user_id = u.id`;

    let whereExpressions = [];
    let queryValues = [];

    const { userId, sentAt, completedAt, before, desc } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (userId) {
      queryValues.push(userId);
      whereExpressions.push(`o.user_id = $${queryValues.length}`);
    }

    if (sentAt) {
      queryValues.push(sentAt);
      whereExpressions.push(`o.sent_at >= $${queryValues.length}`);
    }

    if (completedAt) {
      queryValues.push(completedAt);
      whereExpressions.push(`o.completed_at >= $${queryValues.length}`);
    }

    if (before) {
      queryValues.push(before);
      whereExpressions.push(`o.sent_at <= $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results
    query += ' ORDER BY sent_at';
    if (desc) query += ' DESC';

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

  /** Update order data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { completedAt }
   *
   * Returns { id, userId, sentAt, completedAt}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      completedAt: 'completed_at'
    });
    const idVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE items 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                  user_id AS "userId, 
                                  sent_at AS "sentAt,
                                  completed_at AS "completedAt`;

    const result = await db.query(querySql, [ ...values, id ]);
    const order = result.rows[0];

    if (!order) throw new NotFoundError(`No order: ${id}`);

    return order;
  }
}

module.exports = Order;
