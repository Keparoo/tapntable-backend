'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for mod_groups. */

class ModGroup {
  /** Create a mod group (from data), update db, return new mod data.
   *
   * Required fields: { name }
   * Optional fields: { numChoices, isRequired }
   *
   * Returns { id, name, numChoices, isRequired }
   *
   * Throws BadRequestError if mod (case insensitive) is already in database.
   * */

  static async create({ name, numChoices, isRequired }) {
    const duplicateCheck = await db.query(
      `SELECT name
		       FROM mod_groups
		       WHERE name ILIKE $1`,
      [ name ]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(
        `${duplicateCheck.rows[0].name} already exists`
      );

    const result = await db.query(
      `INSERT INTO mod_groups (name, num_choices, is_required)
       VALUES ($1, $2, $3)
       RETURNING id,
                 name,
                 num_choices AS "numChoices",
                 is_required AS "isRequired"`,
      [ name, numChoices, isRequired ]
    );
    const modGroup = result.rows[0];

    return modGroup;
  }

  /** Find all mod groups (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - name (will find case-insensitive, partial matches)
   * - numChoices
   * - isRequired
   * - desc
   *
   * Returns [{ id, name, numChoices, isRequired }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT id,
                        name,
                        num_choices AS "numChoices",
                        is_required AS "isRequired"
                   FROM mod_groups`;
    let whereExpressions = [];
    let queryValues = [];

    const { name, numChoices, isRequired, desc } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }

    if (numChoices) {
      queryValues.push(numChoices);
      whereExpressions.push(`num_choices = $${queryValues.length}`);
    }

    if (isRequired !== undefined) {
      queryValues.push(isRequired);
      whereExpressions.push(`is_required = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY name';
    if (desc) query += ' DESC';
    const modsRes = await db.query(query, queryValues);
    return modsRes.rows;
  }

  /** Given an mod_group id, return data about the mod.
     *
     * Returns { id, name, numChoices, isRequired }
     *
     * Throws NotFoundError if mod_group not found.
     **/

  static async get(id) {
    const modRes = await db.query(
      `SELECT id,
              name,
              num_choices AS "numChoices",
              is_required AS "isRequired"
        FROM mod_groups
        WHERE id = $1`,
      [ id ]
    );

    const modGroup = modRes.rows[0];

    if (!modGroup) throw new NotFoundError(`No mod group: ${id}`);

    return modGroup;
  }

  /** Update mod group data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { name, numChoices, isRequired }
   *
   * Returns { id, name, numChoices, isRequired }
   *
   * Thorws BadRequestError if mod (case insensitive) is already in database
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    if (data.name) {
      const duplicateCheck = await db.query(
        `SELECT name
             FROM mod_groups
             WHERE name ILIKE $1`,
        [ data.name ]
      );

      if (duplicateCheck.rows[0])
        throw new BadRequestError(
          `${duplicateCheck.rows[0].name} already exists`
        );
    }

    const { setCols, values } = sqlForPartialUpdate(data, {
      numChoices: 'num_choices',
      isRequired: 'is_required'
    });
    const idVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE items 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                  name, 
                                  num_choices AS "numChoices",
                                  is_required AS "isRequired"`;
    const result = await db.query(querySql, [ ...values, id ]);
    const modGroup = result.rows[0];

    if (!modGroup) throw new NotFoundError(`No mod group: ${id}`);

    return modGroup;
  }

  /** Delete given mod group from database; returns undefined.
   * 
   * Throws NotFoundError if mod group not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
             FROM mod_groups
             WHERE id = $1
             RETURNING id`,
      [ id ]
    );
    const modGroup = result.rows[0];

    if (!modGroup) throw new NotFoundError(`No mod group: ${id}`);
  }
}

module.exports = ModGroup;
