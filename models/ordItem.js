'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

class OrdItem {
	/** Create an item_ordered entry (from data), update db, return new item_ordered data.
   *
   * data should be { userId }
   *
   * Returns { ticket: { id, userId, sentAt} }
   *
   * */

	static async create({ userId }) {
		const result = await db.query(
			`INSERT INTO tickets
           (user_id)
           VALUES ($1)
           RETURNING id, user_id AS "userId", sent_at AS "sentAt"`,
			[ userId ]
		);
		const ticket = result.rows[0];

		return ticket;
	}
}

module.exports = OrdItem;
