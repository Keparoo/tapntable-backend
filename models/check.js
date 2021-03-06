'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for checks. */

class Check {
  /** Create a check (from data), update db, return new check data.
   *
   * Required fields { userId, tablNum, numGuests }
   * Optional fields { customer } This is a name/description for bar tabs
   *
   * Returns { id, userId, tableNum, customer, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }
   * 
   * Required args { userId, tablId, numGuests }
   * Optional args { customer }
   * 
   * */

  static async create({ userId, tableNum, numGuests, customer }) {
    const result = await db.query(
      `INSERT INTO checks
       (user_id, table_num, num_guests, customer)
       VALUES ($1, $2, $3, $4)
       RETURNING id,
                user_id AS "userId",
                table_num AS "tableNum",
                num_guests AS "numGuests",
                customer,
                created_at AS "createdAt",
                printed_at AS "printedAt",
                closed_at AS "closedAt",
                discount_id AS "discountId",
                subtotal,
                discount_total AS "discountTotal",
                local_tax AS "localTax",
                state_tax AS "stateTax",
                federal_tax AS "federalTax",
                is_void AS "isVoid"`,
      [ userId, tableNum, numGuests, customer ]
    );
    const check = result.rows[0];

    return check;
  }

  /** Find all checks (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - userId 
   * - employee (will find case-insensitive, partial matches)
   * - tableNum
   * - numGuests
   * - customer
   * - createdAt (will find checks >= createdAt datetime)
   * - printedAt (will find checks >= createdAt datetime)
   * - closedAt (will find checks >= createdAt datetime)
   * - discountId
   * - isVoid
   * - isOpen=true returns records where closed_at is null
   * - start returns records where createdAt >= start
   * - end returns records where createdAt <= end
   * 
   * Note if start and end are used they are used as an AND statement: 
   * createdAt >= start AND createdAt <= end
   *
   * Returns [{ id, userId, employee, tableNum, numGuests, customer, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }, ...]}
   * 
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT c.id,
                        c.user_id AS "userId",
                        u.display_name AS "employee",
                        c.table_num AS "tableNum",
                        c.num_guests AS "numGuests",
                        c.customer,
                        c.created_at AS "createdAt",
                        c.printed_at AS "printedAt",
                        c.closed_at AS "closedAt",
                        c.discount_id AS "discountId",
                        c.subtotal,
                        c.discount_total AS "discountTotal",
                        c.local_tax AS "localTax",
                        c.state_tax AS "stateTax",
                        c.federal_tax AS "federalTax",
                        c.is_void AS "isVoid"
                 FROM checks c INNER JOIN users u
                 ON c.user_id = u.id`;
    let whereExpressions = [];
    let queryValues = [];

    const {
      userId,
      employee,
      tableNum,
      numGuests,
      customer,
      createdAt,
      printedAt,
      closedAt,
      discountId,
      isOpen,
      isVoid,
      start,
      end
    } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (userId) {
      queryValues.push(userId);
      whereExpressions.push(`c.user_id = $${queryValues.length}`);
    }

    if (employee) {
      queryValues.push(`%${employee}%`);
      whereExpressions.push(`u.display_name ILIKE $${queryValues.length}`);
    }

    if (tableNum) {
      queryValues.push(tableNum);
      whereExpressions.push(`c.table_num = $${queryValues.length}`);
    }

    if (numGuests) {
      queryValues.push(numGuests);
      whereExpressions.push(`c.num_guests = $${queryValues.length}`);
    }

    if (customer) {
      queryValues.push(`%${customer}%`);
      whereExpressions.push(`c.customer ILIKE $${queryValues.length}`);
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

    if (discountId) {
      queryValues.push(discountId);
      whereExpressions.push(`c.discount_id = $${queryValues.length}`);
    }

    if (isVoid !== undefined) {
      queryValues.push(isVoid);
      whereExpressions.push(`c.is_void = $${queryValues.length}`);
    }

    if (isOpen) {
      whereExpressions.push(`c.closed_at IS NULL`);
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

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY c.created_at';
    const checkRes = await db.query(query, queryValues);
    return checkRes.rows;
  }

  /** Given a check id, return info about check.
     *
     * Returns { id, userId, employee, tableNum, numGuests, customer, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }
     *
     * Throws NotFoundError if not found.
     * 
     **/

  static async get(id) {
    const checkRes = await db.query(
      `SELECT c.id,
              c.user_id AS "userId",
              u.display_name AS "employee",
              c.table_num AS "tableNum",
              c.num_guests AS "numGuests",
              c.customer,
              c.created_at AS "createdAt",
              c.printed_at AS "printedAt",
              c.closed_at AS "closedAt",
              c.discount_id AS "discountId",
              c.subtotal,
              c.discount_total AS "discountTotal",
              c.local_tax AS "localTax",
              c.state_tax AS "stateTax",
              c.federal_tax AS "federalTax",
              c.is_void AS "isVoid"
      FROM checks c INNER JOIN users u
      ON c.user_id = u.id
      WHERE c.id = $1`,
      [ id ]
    );

    const check = checkRes.rows[0];

    if (!check) throw new NotFoundError(`No check: ${id}`);

    return check;
  }

  /** Update check name with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { tableNum, numGuests, customer, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }
   *
   * Returns { id, userId, tableNum, customer, numGuests, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }
   * 
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      tableNum: 'table_num',
      numGuests: 'num_guests',
      customer: 'customer',
      printedAt: 'printed_at',
      closedAt: 'closed_at',
      discountId: 'discount_id',
      discountTotal: 'discount_total',
      localTax: 'local_tax',
      stateTax: 'state_tax',
      federalTax: 'federal_tax',
      isVoid: 'is_void'
    });
    const checkVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE checks 
                      SET ${setCols} 
                      WHERE id = ${checkVarIdx} 
                      RETURNING id,
                      user_id AS "userId",
                      table_num AS "tableNum",
                      customer,
                      num_guests AS "numGuests",
                      created_at AS "createdAt",
                      printed_at AS "printedAt",
                      closed_at AS "closedAt",
                      discount_id AS "discountId",
                      subtotal,
                      discount_total AS "discountTotal",
                      local_tax AS "localTax",
                      state_tax AS "stateTax",
                      federal_tax AS "federalTax",
                      is_void AS "isVoid"`;
    const result = await db.query(querySql, [ ...values, id ]);
    const check = result.rows[0];

    if (!check) throw new NotFoundError(`No check: ${id}`);

    return check;
  }

  /** Delete given check from database; returns undefined.
   *
   * Throws NotFoundError if check not found.
   * 
   * This should not be done once a check has been inserted
   * check should be voided instead is_void=true
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM checks
       WHERE id = $1
       RETURNING id`,
      [ id ]
    );
    const check = result.rows[0];

    if (!check) throw new NotFoundError(`No check: ${id}`);
  }
}

module.exports = Check;
