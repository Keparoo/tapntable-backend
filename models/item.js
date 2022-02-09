'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for items. */

class Item {
	/** Create an item (from data), update db, return new item data.
   *
   * data should be { name, description, price, category_id, destination_id }
   *
   * Returns { id, name, description, price, category_id, destination_id, count, is_active }
   *
   * Throws BadRequestError if item already in database.
   * */

	static async create({ name, description, price, categoryId, destinationId }) {
		// const duplicateCheck = await db.query(
		// 	`SELECT id
		//        FROM items
		//        WHERE id = $1`,
		// 	[ id ]
		// );

		// if (duplicateCheck.rows[0])
		// 	throw new BadRequestError(`Duplicate item: ${id}`);

		const result = await db.query(
			`INSERT INTO items
           (name, description, price, category_id, destination_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, description, price, category_id AS "categoryId", destination_id AS "destinationId", count, is_active AS "isActive"`,
			[ name, description, price, categoryId, destinationId ]
		);
		const item = result.rows[0];

		return item;
	}

	/** Find all items (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - name (will find case-insensitive, partial matches)
   * - categoryId
   * - 
   *
   * Returns [{ id, name, description, price, category_id, destination_id, count, is_active }, ...]
   * */

	static async findAll(searchFilters = {}) {
		let query = `SELECT id,
                          name,
                          description,
                          price,
                          category_id AS "categoryId",
                          destination_id AS "destinationId",
                          count,
                          is_active AS "isActive"
                   FROM items`;
		let whereExpressions = [];
		let queryValues = [];

		const { name, categoryId } = searchFilters;

		// For each possible search term, add to whereExpressions and queryValues so
		// we can generate the right SQL

		if (name) {
			queryValues.push(`%${name}%`);
			whereExpressions.push(`name ILIKE $${queryValues.length}`);
		}

		if (categoryId !== undefined) {
			queryValues.push(categoryId);
			whereExpressions.push(`category_id = $${queryValues.length}`);
		}

		if (whereExpressions.length > 0) {
			query += ' WHERE ' + whereExpressions.join(' AND ');
		}

		// Finalize query and return results

		query += ' ORDER BY name';
		const itemsRes = await db.query(query, queryValues);
		return itemsRes.rows;
	}

	/** Given an item id, return data about the item.
     *
     * Returns { id, name, description, price, category_id, destination_id, count, is_active }
     *
     * Throws NotFoundError if not found.
     **/

	static async get(id) {
		const itemRes = await db.query(
			`SELECT id,
              name,
              description,
              price,
              category_id AS "categoryId",
              destination_id AS "destinationId",
              count,
              is_active AS "isActive"
             FROM items
             WHERE id = $1`,
			[ id ]
		);

		const item = itemRes.rows[0];

		if (!item) throw new NotFoundError(`No item: ${id}`);

		// const jobsRes = await db.query(
		//       `SELECT id, title, salary, equity
		//        FROM jobs
		//        WHERE company_handle = $1
		//        ORDER BY id`,
		//     [handle],
		// );

		// company.jobs = jobsRes.rows;

		return item;
	}

	/** Update item data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { name, description, price, category_id, destination_id, count, is_active }
   *
   * Returns { id, name, description, price, category_id, destination_id, count, is_active }
   *
   * Throws NotFoundError if not found.
   */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			categoryId: 'category_id',
			destinationId: 'destination_id',
			isActive: 'is_active'
		});
		const idVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE items 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                  name, 
                                  description,
                                  price,
                                  category_id AS "categoryId", 
                                  destination_id AS "destinationId"`;
		const result = await db.query(querySql, [ ...values, id ]);
		const item = result.rows[0];

		if (!item) throw new NotFoundError(`No item: ${id}`);

		return item;
	}

	/** Delete given item from database; returns undefined.
   *
   * Throws NotFoundError if item not found.
   **/

	static async remove(id) {
		const result = await db.query(
			`DELETE
             FROM items
             WHERE id = $1
             RETURNING id`,
			[ id ]
		);
		const item = result.rows[0];

		if (!item) throw new NotFoundError(`No item: ${id}`);
	}
}

module.exports = Item;
