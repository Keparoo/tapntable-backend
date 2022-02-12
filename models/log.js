'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

/**
 * log_event enum type values:
 * 'close-day', 'discount-item', 'discount-check', 'create-item', 'update-item', 'delete-item-ordered' 'void-item', 'void-check'
 */

class Log {
	/** Create a user log entry (from data), update db, return new log data.
   *
   * data should be { userId, event, entity_id }
   *
   * Returns { log: { id, userId, event, timestamp, entity_id } }
   *
   * */

	static async create({ userId, event, entityId }) {
		const result = await db.query(
			`INSERT INTO user_logs
           (user_id, event, entity_id )
           VALUES ($1, $2, $3)
           RETURNING user_id AS "userId", event, entity_id AS "entityId"`,
			[ userId, event, entityId ]
		);
		const log = result.rows[0];

		return log;
	}

	/** Find all user logs (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - userId
   * - event
   * - timestamp
   * - entityId
   *
   * Returns { logs:[ { id, userId, event, timestamp, entity_id }...]}
   * */

	static async findAll(searchFilters = {}) {
		let query = `SELECT id,
                        user_id AS "userId",
                        event,
                        timestamp,
                        entity_id AS "entityId"
                 FROM user_logs`;
		let whereExpressions = [];
		let queryValues = [];

		const { userId, event, timestamp, entityId } = searchFilters;

		// For each possible search term, add to whereExpressions and queryValues so
		// we can generate the right SQL

		if (userId) {
			queryValues.push(userId);
			whereExpressions.push(`user_id = $${queryValues.length}`);
		}

		if (event) {
			queryValues.push(event);
			whereExpressions.push(`event = $${queryValues.length}`);
		}

		if (timestamp) {
			queryValues.push(timestamp);
			whereExpressions.push(`timestamp = $${queryValues.length}`);
		}

		if (entityId) {
			queryValues.push(entityId);
			whereExpressions.push(`entity_id = $${queryValues.length}`);
		}

		if (whereExpressions.length > 0) {
			query += ' WHERE ' + whereExpressions.join(' AND ');
		}

		// Finalize query and return results

		query += ' ORDER BY id';
		const logsRes = await db.query(query, queryValues);
		return logsRes.rows;
	}

	/** Given a log id, return the log entry.
     *
     * Returns { log: { id, userId, event, timestamp, entity_id } }
     *
     * Throws NotFoundError if not found.
     **/

	static async get(id) {
		const logRes = await db.query(
			`SELECT id,
              user_id AS "userId",
              event,
              timestamp,
              entity_id AS "entityId"
        FROM user_logs
        WHERE id = $1`,
			[ id ]
		);

		const log = logRes.rows[0];

		if (!log) throw new NotFoundError(`No log: ${id}`);

		return log;
	}
}

module.exports = Log;
