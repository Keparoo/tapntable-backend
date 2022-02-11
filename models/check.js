'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for categories. */

class Check {
	/** Create a check (from data), update db, return new check data.
   *
   * data should be { userId, tablId, numGuests }
   *
   * Returns { id, user_id, table_id, num_guests, created_at, sub_total, local_tax, state_tax, federal_tax }
   * 
   * Required args { userId, tablId, numGuests }
   *
   * Throws BadRequestError if item already in database.
   * 
   * */

	static async create({ userId, tableId, numGuests }) {
		// const duplicateCheck = await db.query(
		// 	`SELECT name
		//    FROM item_categories
		//    WHERE name = $1`,
		// 	[ name ]
		// );

		// if (duplicateCheck.rows[0])
		// 	throw new BadRequestError(`Duplicate category: ${name}`);

		const result = await db.query(
			`INSERT INTO checks
       (user_id, table_id, num_guests)
       VALUES ($1, $2, $3)
       RETURNING id,
                user_id AS "userId",
                table_id AS "tableId",
                num_guests AS "numGuests",
                created_at AS "createdAt",
                printed_at AS "printedAt",
                closed_at AS "closedAt",
                discount_id AS "discountId",
                sub_total AS "subTotal",
                discount_total AS "discountTotal",
                local_tax AS "localTax",
                state_tax AS "stateTax",
                federal_tax AS "federalTax",
                is_void AS "isVoid"`,
			[ userId, tableId, numGuests ]
		);
		const check = result.rows[0];

		return check;
	}

	/** Find all checks (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - userId 
   * - employee (will find case-insensitive, partial matches)
   * - tableId
   * - numGuests
   * - createdAt
   * - printedAt
   * - closedAt
   * - discountId
   * - isVoid
   *
   * Returns { checks: [{ id, userId, employee, tableId, numGuests, createdAt, printedAt, closedAt, discountId, subTotal, discountTotal, localTax, stateTax, federalTax, isVoid }, ...]}}
   * 
   * */

	static async findAll(searchFilters = {}) {
		let query = `SELECT c.id,
                        c.user_id AS "userId",
                        u.display_name AS "employee",
                        c.table_id AS "tableId",
                        c.num_guests AS "numGuests",
                        c.created_at AS "createdAt",
                        c.printed_at AS "printedAt",
                        c.closed_at AS "closedAt",
                        c.discount_id AS "discountId",
                        c.sub_total AS "subTotal",
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
			tableId,
			numGuests,
			createdAt,
			printedAt,
			closedAt,
			discountId,
			isVoid
		} = searchFilters;

		// For each possible search term, add to whereExpressions and queryValues so
		// we can generate the right SQL

		if (userId) {
			queryValues.push(userId);
			whereExpressions.push(`c.employee_id = $${queryValues.length}`);
		}

		if (employee) {
			queryValues.push(`%${employee}%`);
			whereExpressions.push(`u.display_name ILIKE $${queryValues.length}`);
		}

		if (tableId) {
			queryValues.push(`%${tableId}%`);
			whereExpressions.push(`c.table_id ILIKE $${queryValues.length}`);
		}

		if (numGuests) {
			queryValues.push(numGuests);
			whereExpressions.push(`c.num_guests = $${queryValues.length}`);
		}

		if (createdAt) {
			queryValues.push(createdAt);
			whereExpressions.push(`c.created_at = $${queryValues.length}`);
		}

		if (printedAt) {
			queryValues.push(printedAt);
			whereExpressions.push(`c.printed_at = $${queryValues.length}`);
		}

		if (closedAt) {
			queryValues.push(closedAt);
			whereExpressions.push(`c.closed_at = $${queryValues.length}`);
		}

		if (discountId) {
			queryValues.push(discountId);
			whereExpressions.push(`c.discount_id = $${queryValues.length}`);
		}

		if (isVoid) {
			queryValues.push(isVoid);
			whereExpressions.push(`c.is_void = $${queryValues.length}`);
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
     * Returns { id, userId, employee, tableId, numGuests, createdAt, printedAt, closedAt, discountId, subTotal, discountTotal, localTax, stateTax, federalTax, isVoid }
     *
     * Throws NotFoundError if not found.
     * 
     **/

	static async get(id) {
		const checkRes = await db.query(
			`SELECT c.id,
              c.user_id AS "userId",
              u.display_name AS "employee",
              c.table_id AS "tableId",
              c.num_guests AS "numGuests",
              c.created_at AS "createdAt",
              c.printed_at AS "printedAt",
              c.closed_at AS "closedAt",
              c.discount_id AS "discountId",
              c.sub_total AS "subTotal",
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
   * Data can include: { tableId, numGuests, printedAt, closedAt, discountId, subTotal, discountTotal, localTax, stateTax, federalTax, isVoid }
   *
   * Returns { id, userId, employee, tableId, numGuests, createdAt, printedAt, closedAt, discountId, subTotal, discountTotal, localTax, stateTax, federalTax, isVoid }
   * 
   * Throws NotFoundError if not found.
   */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			tableId: 'table_id',
			numGuests: 'num_guests',
			printedAt: 'printed_at',
			closedAt: 'closed_at',
			discountId: 'discount_id',
			subTotal: 'sub_total',
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
                      table_id AS "tableId",
                      num_guests AS "numGuests",
                      created_at AS "createdAt",
                      sub_total AS "subTotal",
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
   * This should not be done once a check has been used
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
