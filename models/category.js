'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for categories. */

class Category {
	/** Create a category (from data), update db, return new item data.
   *
   * data should be { name }
   *
   * Returns { id, name }
   *
   * Throws BadRequestError if item already in database.
   * 
   * */

	static async create({ name }) {
		const duplicateCheck = await db.query(
			`SELECT name
		       FROM item_categories
		       WHERE name = $1`,
			[ name ]
		);

		if (duplicateCheck.rows[0])
			throw new BadRequestError(`Duplicate category: ${name}`);

		console.log(name);

		const result = await db.query(
			`INSERT INTO item_categories
           (name)
           VALUES ($1)
           RETURNING id, name`,
			[ name ]
		);
		const category = result.rows[0];

		return category;
	}

	/** Find all categories (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - name (will find case-insensitive, partial matches)
   *
   * Returns [{ id, name }, ...]
   * */

	static async findAll(searchFilters = {}) {
		let query = `SELECT id,
                        name
                   FROM item_categories`;
		let whereExpressions = [];
		let queryValues = [];

		const { name } = searchFilters;

		// For each possible search term, add to whereExpressions and queryValues so
		// we can generate the right SQL

		if (name) {
			queryValues.push(`%${name}%`);
			whereExpressions.push(`name ILIKE $${queryValues.length}`);
		}

		if (whereExpressions.length > 0) {
			query += ' WHERE ' + whereExpressions.join(' AND ');
		}

		// Finalize query and return results

		query += ' ORDER BY name';
		const categoryRes = await db.query(query, queryValues);
		return categoryRes.rows;
	}

	/** Given a category id, return id and name.
     *
     * Returns { id, name }
     *
     * Throws NotFoundError if not found.
     * 
     **/

	static async get(id) {
		const itemRes = await db.query(
			`SELECT id,
              name
              FROM item_categories
              WHERE id = $1`,
			[ id ]
		);

		const category = itemRes.rows[0];

		if (!category) throw new NotFoundError(`No category: ${id}`);

		return category;
	}

	/** Update category name with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { name }
   *
   * Returns { id, name }
   * 
   * This function is set up with extensibility in mind: in case new cols are added later
   *
   * Throws NotFoundError if not found.
   */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {});
		const catVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE item_categories 
                        SET ${setCols} 
                        WHERE id = ${catVarIdx} 
                        RETURNING id, 
                                  name`;
		const result = await db.query(querySql, [ ...values, id ]);
		const category = result.rows[0];

		if (!category) throw new NotFoundError(`No category: ${id}`);

		return category;
	}

	/** Delete given category from database; returns undefined.
   *
   * Throws NotFoundError if item not found.
   * 
   * This should not be done once a category has been used
   * Possibly implement an is_active field if needed
   **/

	static async remove(id) {
		const result = await db.query(
			`DELETE
       FROM item_categories
       WHERE id = $1
       RETURNING id`,
			[ id ]
		);
		const category = result.rows[0];

		if (!category) throw new NotFoundError(`No category: ${id}`);
	}
}

module.exports = Category;
