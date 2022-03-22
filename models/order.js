'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

class Order {
  /** Create an order entry (from data), update db, return new order data.
   *
   * Required data:  { userId }
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
   * Alternate function to above
   * 
   * searchFilters (all optional):
   * - userId
   * - sentAt (find orders after sentAt datetime)
   * - completedAt
   * - fireCourse2
   * - fireCourse3
   * - before (find orders where sentAt is before this datetime)
   * - isOpen=true returns orders where completedAt is null
   * - start (return orders where start <= sentAt)
   * - end (return orders where end >= sentAt)
   * - desc
   *
   * Returns [ { id, userId, displayName, tableNum, sentAt, completedAt, fireCourse2, fireCourse3}...]
   * 
   * Default sort order is sent_by ascending. query filter desc=true will sort by sent_by descending
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT o.id,
                        o.user_id AS "userId",
                        u.display_name AS "displayName",
                        o.sent_at AS "sentAt",
                        o.completed_at AS "completedAt",
                        o.fire_course_2 AS "fireCourse2",
                        o.fire_course_3 AS "fireCourse3"     
                 FROM orders o JOIN users u ON u.id = o.user_id`;

    let whereExpressions = [];
    let queryValues = [];

    const {
      userId,
      sentAt,
      completedAt,
      fireCourse2,
      fireCourse3,
      before,
      start,
      end,
      desc,
      isOpen
    } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (userId) {
      queryValues.push(userId);
      whereExpressions.push(`o.user_id = $${queryValues.length}`);
    }

    if (sentAt) {
      queryValues.push(sentAt);
      whereExpressions.push(`o.sent_at >= $${queryValues.length}::timestamptz`);
    }

    if (completedAt) {
      queryValues.push(completedAt);
      whereExpressions.push(
        `o.completed_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (fireCourse2) {
      queryValues.push(fireCourse2);
      whereExpressions.push(
        `o.fire_course_2 >= $${queryValues.length}::timestamptz`
      );
    }

    if (fireCourse3) {
      queryValues.push(fireCourse3);
      whereExpressions.push(
        `o.fire_course_3 >= $${queryValues.length}::timestamptz`
      );
    }

    if (before) {
      queryValues.push(before);
      whereExpressions.push(`o.sent_at <= $${queryValues.length}::timestamptz`);
    }

    if (start) {
      queryValues.push(start);
      whereExpressions.push(`o.sent_at <= $${queryValues.length}`);
    }

    if (end) {
      queryValues.push(end);
      whereExpressions.push(`o.sent_at >= $${queryValues.length}`);
    }

    if (isOpen) {
      whereExpressions.push(`o.completed_at IS NULL`);
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

  /** Given a order id, return the order entry and related ordered_items.
     *
     * Returns { id, userId, sentAt, fireCourse2, fireCourse3, items}
     * 
     * Where items is [{id, userId, sentAt, completedAt, name, orderedItemId, price, categoryId, isActive, orderId, itemId, checkId, completedAt, completedBy, deliveredAt, itemNote, discountId, isVoid }]
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

    const ordItemsRes = await db.query(
      `SELECT
            o.id,
            o.user_id AS "userId",
            o.sent_at AS "sentAt",
            o.completed_at AS "completedAt",
            o.fire_course_2 AS "fireCourse2",
            o.fire_course_3 AS "fireCourse3",
            oi.id AS "orderedItemId",
            i.name,
            i.price,
            i.category_id AS "categoryId",
            i.is_active AS "isActive",
            oi.order_id AS "orderId",
            oi.item_id AS "itemId",
            oi.check_id AS "checkId",
            oi.completed_at AS "completedAt",
            oi.completed_by AS "completedBy",
            oi.delivered_at AS "deliveredAt",
            oi.item_note AS "itemNote",
            oi.item_discount_id AS "discountId",
            oi.is_void AS "isVoid"
      FROM orders o INNER JOIN ordered_items oi ON o.id = oi.order_id
      INNER JOIN items i ON oi.item_id = i.id
      WHERE o.id = $1
      ORDER BY i.category_id, oi.item_id`,
      [ id ]
    );

    order.items = ordItemsRes.rows;

    return order;
  }

  /** Update order data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { completedAt, fireCourse2, fireCourse3 }
   *
   * Returns { id, userId, sentAt, completedAt, fireCourse2, fireCourse3}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      completedAt: 'completed_at',
      fireCourse2: 'fire_course_2',
      fireCourse3: 'fire_course_3'
    });
    const idVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE orders 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                  user_id AS "userId", 
                                  sent_at AS "sentAt",
                                  completed_at AS "completedAt",
                                  fire_course_2 AS "fireCourse2",
                                  fire_course_3 AS "fireCourse3"`;

    const result = await db.query(querySql, [ ...values, id ]);
    const order = result.rows[0];

    if (!order) throw new NotFoundError(`No order: ${id}`);

    return order;
  }
}

module.exports = Order;
