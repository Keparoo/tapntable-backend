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
   * data should be { userId, event, declaredTips, entity_id }
   *
   * Returns { id, userId, event, timestamp, declaredTips, entity_id }
   *
   * */

  static async create({ userId, event, declaredTips, entityId }) {
    const result = await db.query(
      `INSERT INTO user_logs
                          (user_id,
                          event,
                          declared_tips,
                          entity_id )
           VALUES ($1, $2, $3, $4)
           RETURNING id, user_id AS "userId", event, declared_tips AS "declaredTips" entity_id AS "entityId"`,
      [ userId, event, declaredTips, entityId ]
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
   * - declaredTips
   * - entityId
   * - before (Return records with timestamp values < before)
   * - after (Return records with timestamp values > after)
   *       Note if both before and after are used they are connected by AND not OR
   * - desc (boolean when true, sort in descending order)
   * 
   * * Default sort is in ascending order by datetime
   *
   * Returns [ { id, userId, displayName, firstName, LastName, role, isActive, event, timestamp, declaredTips, entity_id }...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT l.id,
                        l.user_id AS "userId",
                        u.display_name AS "displayName",
                        u.first_name AS "firstName",
                        u.last_name AS "lastName",
                        u.role,
                        u.is_active AS "isActive",
                        l.event,
                        l.timestamp,
                        l.declared_tips AS "declaredTips",
                        l.entity_id AS "entityId"
                 FROM user_logs l INNER JOIN users u ON l.user_id = u.id`;
    let whereExpressions = [];
    let queryValues = [];

    const {
      userId,
      event,
      timestamp,
      declaredTips,
      entityId,
      desc
    } = searchFilters;

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

    if (declaredTips) {
      queryValues.push(declaredTips);
      whereExpressions.push(`declared_tips = $${queryValues.length}`);
    }

    if (entityId) {
      queryValues.push(entityId);
      whereExpressions.push(`entity_id = $${queryValues.length}`);
    }

    if (after) {
      queryValues.push(after);
      whereExpressions.push(`timestamp > after $${queryValues.length}`);
    }

    if (before) {
      queryValues.push(before);
      whereExpressions.push(`timestamp < before $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY timestamp';
    if (desc) query += ' DESC';

    const logsRes = await db.query(query, queryValues);
    return logsRes.rows;
  }

  /** Given a log id, return the log entry.
     *
     * Returns { id, userId, displayName, firstName, LastName, role, isActive, event, timestamp, declaredTips, entity_id }
     *
     * Throws NotFoundError if not found.
     **/

  static async get(id) {
    const logRes = await db.query(
      `SELECT l.id,
              l.user_id AS "userId",
              u.display_name AS "displayName",
              u.first_name AS "firstName",
              u.last_name AS "lastName",
              u.role,
              u.is_active AS "isActive",
              l.event,
              l.timestamp,
              l.declared_tips AS "declaredTips",
              l.entity_id AS "entityId"
        FROM user_logs l INNER JOIN users u ON l.user_id = u.id
        WHERE id = $1`,
      [ id ]
    );

    const log = logRes.rows[0];

    if (!log) throw new NotFoundError(`No log: ${id}`);

    return log;
  }
}

module.exports = Log;
