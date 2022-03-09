'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for payments. */

/**
 * log_event enum type values:
 * 'clock-in', 'clock-out', 'cash-out', 'declare-cash-tips', 'open-shift', 'close-shift', 'open-day', 'close-day', 'discount-item', 'discount-check', 'create-item', 'update-item','delete-item-ordered', 'void-item', 'void-check'
 */

class Log {
  /** Create a user log entry (from data), update db, return new log data.
   *
   * Required fields: { userId, event, declaredTips, entityId }
   * Optional fields: { declaredTips, entityId }
   *
   * Returns { id, userId, event, createdAt, declaredTips, entity_id }
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
           RETURNING id, user_id AS "userId", event, created_at AS createdAt, declared_tips AS "declaredTips", entity_id AS "entityId"`,
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
   * - before (Return records with createdAt values <= before)
   * - after (Return records with createdAt values >= after)
   *       Note if both before and after are used they are connected by AND not OR
   * - desc (boolean when true, sort in descending order)
   * - start (Return records where createdAt >= start)
   * - end (Return records where createdAt <= end)
   * 
   * * Default sort is in ascending order by datetime
   *
   * Returns [ { id, userId, displayName, firstName, LastName, role, isActive, event, createdAt, declaredTips, entity_id }...]
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
                        l.created_at AS "createdAt",
                        l.declared_tips AS "declaredTips",
                        l.entity_id AS "entityId"
                 FROM user_logs l INNER JOIN users u ON l.user_id = u.id`;
    let whereExpressions = [];
    let queryValues = [];

    const {
      userId,
      event,
      createdAt,
      declaredTips,
      entityId,
      desc,
      before,
      after,
      start,
      end
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

    if (createdAt) {
      queryValues.push(createdAt);
      whereExpressions.push(
        `l.created_at = $${queryValues.length}::timestamptz`
      );
    }

    if (declaredTips) {
      queryValues.push(declaredTips);
      whereExpressions.push(`declared_tips = $${queryValues.length}`);
    }

    if (entityId) {
      queryValues.push(entityId);
      whereExpressions.push(`entity_id = $${queryValues.length}`);
    }

    if (before) {
      queryValues.push(before);
      whereExpressions.push(
        `l.created_at <= $${queryValues.length}::timestamptz`
      );
    }

    if (after) {
      queryValues.push(after);
      whereExpressions.push(
        `l.created_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (start) {
      queryValues.push(start);
      whereExpressions.push(
        `l.created_at <= $${queryValues.length}::timestamptz`
      );
    }

    if (end) {
      queryValues.push(end);
      whereExpressions.push(
        `l.created_at >= $${queryValues.length}::timestamptz`
      );
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY created_at';
    if (desc) query += ' DESC';

    const logsRes = await db.query(query, queryValues);
    return logsRes.rows;
  }

  /** Given a log id, return the log entry.
     *
     * Returns { id, userId, displayName, firstName, LastName, role, isActive, event, createdAt, declaredTips, entity_id }
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
              l.created_at AS "createdAt",
              l.declared_tips AS "declaredTips",
              l.entity_id AS "entityId"
        FROM user_logs l INNER JOIN users u ON l.user_id = u.id
        WHERE l.id = $1`,
      [ id ]
    );

    const log = logRes.rows[0];

    if (!log) throw new NotFoundError(`No log: ${id}`);

    return log;
  }
}

module.exports = Log;
