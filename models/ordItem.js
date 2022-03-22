'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

class OrdItem {
  /** Create an ordered_items entry (from data), update db, return new ordered_items data.
   *
   * data should be { itemId, orderId, checkId, seatNum, courseNum, itemNote }
   *
   * Returns { id, itemId, orderId, checkId, seatNum, courseNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid  }
   *
   * */

  static async create({
    itemId,
    orderId,
    checkId,
    seatNum,
    courseNum,
    itemNote
  }) {
    const result = await db.query(
      `INSERT INTO ordered_items
           (item_id,
            order_id,
            check_id,
            seat_num,
            course_num,
            item_note)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, item_id AS "itemId", order_id AS "orderId", check_id AS "checkId", seat_num AS "seatNum", course_num AS "courseNum", completed_at AS "completedAt", completed_by AS "completedBy", delivered_at AS "deliveredAt", item_note AS "itemNote", is_void AS "isVoid"`,
      [ itemId, orderId, checkId, seatNum, courseNum, itemNote ]
    );
    const ordItem = result.rows[0];

    return ordItem;
  }

  /** Find all ordered_items for a given checkId (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - itemId
   * - orderId
   * - checkId
   * - sentAt (return ordered_items sent after >= sentAt)
   * - seatNum
   * - courseNum
   * - isVoid
   * - start (return ordered_items sent after >= sentAt)
   * - end (return ordered_items sent before <= sentAt)
   * - desc
   *
   * Returns [ { id, itemId, name, price, destinationId, count, tableNum, numGuests, orderId, checkId, seatNum, courseNum, sentAt, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT o.id,
                        o.item_id AS "itemId",
                        i.name,
                        i.price,
                        i.destination_id AS "destinationId",
                        i.count,
                        c.table_num AS "tableNum",
                        c.num_guests AS "numGuests",
                        o.order_id AS "orderId",
                        o.check_id AS "checkId",
                        o.seat_num AS "seatNum",
                        o.course_num AS "courseNum",
                        orders.sent_at AS "sentAt",
                        o.completed_at AS "completedAt",
                        o.completed_by AS "completedBy",
                        o.delivered_at AS "deliveredAt",
                        o.item_note AS "itemNote",
                        o.item_discount_id AS "itemDiscountId",
                        o.is_void AS "isVoid"
                 FROM ordered_items o INNER JOIN items i ON o.item_id = i.id
                 INNER JOIN orders ON o.order_id = orders.id
                 INNER JOIN checks c ON o.check_id = c.id`;
    let whereExpressions = [];
    let queryValues = [];

    const {
      itemId,
      orderId,
      checkId,
      sentAt,
      seatNum,
      courseNum,
      start,
      end,
      desc,
      isVoid
    } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (itemId) {
      queryValues.push(itemId);
      whereExpressions.push(`o.item_id = $${queryValues.length}`);
    }

    if (orderId) {
      queryValues.push(orderId);
      whereExpressions.push(`o.order_id = $${queryValues.length}`);
    }

    if (checkId) {
      queryValues.push(checkId);
      whereExpressions.push(`o.check_id = $${queryValues.length}`);
    }

    if (sentAt) {
      queryValues.push(sentAt);
      whereExpressions.push(
        `orders.sent_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (seatNum) {
      queryValues.push(seatNum);
      whereExpressions.push(`o.seat_num = $${queryValues.length}`);
    }

    if (courseNum) {
      queryValues.push(courseNum);
      whereExpressions.push(`o.course_num = $${queryValues.length}`);
    }

    if (start) {
      queryValues.push(start);
      whereExpressions.push(
        `orders.sent_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (end) {
      queryValues.push(end);
      whereExpressions.push(
        `orders.sent_at <= $${queryValues.length}::timestamptz`
      );
    }

    if (isVoid !== undefined) {
      queryValues.push(isVoid);
      whereExpressions.push(`o.is_void = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY o.course_num, o.item_id';
    if (desc) query += ' DESC';

    const orderedRes = await db.query(query, queryValues);
    return orderedRes.rows;
  }

  /** Given a ordItem id, return the ordItem entry.
     *
     * Returns { id, itemId, orderId, checkId, seatNum, courseNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }
     *
     * Throws NotFoundError if not found.
     **/

  static async get(id) {
    const orderedRes = await db.query(
      `SELECT id,
            item_id AS "itemId",
            order_id AS "orderId",
            check_id AS "checkId",
            seat_num AS "seatNum",
            course_num AS "courseNum",
            completed_at AS "completedAt",
            completed_by AS "completedBy",
            delivered_at AS "deliveredAt",
            item_note AS "itemNote",
            item_discount_id AS "itemDiscountId",
            is_void AS "isVoid"
        FROM ordered_items
        WHERE id = $1`,
      [ id ]
    );

    const ordItem = orderedRes.rows[0];

    if (!ordItem) throw new NotFoundError(`No ordered item: ${id}`);

    return ordItem;
  }

  /** Update ordered item with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { seatNum, courseNum, itemNote, itemDiscountId, isVoid }
   *
   * Returns { id, itemId, orderId, checkId, seatNum, courseNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      seatNum: 'seat_num',
      courseNum: 'course_num',
      itemNote: 'item_note',
      itemDiscountId: 'item_discount_id',
      isVoid: 'is_void'
    });
    const idVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE ordered_items
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id,
                                  item_id AS "itemId",
                                  order_id AS "orderId",
                                  check_id AS "checkId",
                                  seat_num AS "seatNum",
                                  course_num AS "courseNum",
                                  completed_at AS "completedAt",
                                  completed_by AS "completedBy",
                                  delivered_at AS "deliveredAt",
                                  item_note AS "itemNote",
                                  item_discount_id AS "itemDiscountId",
                                  is_void AS "isVoid"`;
    const result = await db.query(querySql, [ ...values, id ]);
    const ordItem = result.rows[0];

    if (!ordItem) throw new NotFoundError(`No ordered item: ${id}`);

    return ordItem;
  }

  /** Delete given ordered item from database; returns undefined.
   *
   * Throws NotFoundError if item not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
             FROM ordered_items
             WHERE id = $1
             RETURNING id`,
      [ id ]
    );
    const ordItem = result.rows[0];

    if (!ordItem) throw new NotFoundError(`No ordered item: ${id}`);
  }
}

module.exports = OrdItem;
