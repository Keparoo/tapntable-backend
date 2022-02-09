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
           RETURNING name, description, price, category_id AS "categoryId", destination_id AS "destinationId"`,
			[ name, description, price, categoryId, destinationId ]
		);
		const item = result.rows[0];

		return item;
	}
}

module.exports = Item;
