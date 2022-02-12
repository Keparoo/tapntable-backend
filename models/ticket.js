'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

class Ticket {
	/** Create a ticket entry (from data), update db, return new ticket data.
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

	/** Find all tickets (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - userId
   * - sentAt
   *
   * Returns { tickets: [ { id, userId, sentAt}...]}
   * */

	static async findAll(searchFilters = {}) {
		let query = `SELECT id,
                        user_id AS "userId",
                        sent_at AS "sentAt",
                 FROM tickets`;
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
			whereExpressions.push(`sent_at = $${queryValues.length}`);
		}

		if (whereExpressions.length > 0) {
			query += ' WHERE ' + whereExpressions.join(' AND ');
		}

		// Finalize query and return results

		query += ' ORDER BY sent_at';
		const ticketsRes = await db.query(query, queryValues);
		return ticketsRes.rows;
	}

	/** Given a ticket id, return the ticket entry.
     *
     * Returns { ticket: { id, userId, sentAt} }
     *
     * Throws NotFoundError if not found.
     **/

	static async get(id) {
		const ticketRes = await db.query(
			`SELECT id,
              user_id AS "userId",
              sent_at AS "sentAt"
        FROM tickets
        WHERE id = $1`,
			[ id ]
		);

		const ticket = ticketRes.rows[0];

		if (!ticket) throw new NotFoundError(`No ticket: ${id}`);

		return ticket;
	}
}

module.exports = Ticket;
