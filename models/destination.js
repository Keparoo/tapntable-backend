'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for destinations. */

class Destination {
  /** Create a destination (from data), update db, return new destination data.
   *
   * data should be { name }
   *
   * Returns { id, name }
   *
   * Throws BadRequestError if destination with same name (case insensitive) in database.
   * 
   * This model may add another field for printer ip address
   * 
   * */

  static async create({ name }) {
    const duplicateCheck = await db.query(
      `SELECT name
		   FROM destinations
		   WHERE name ILIKE $1`,
      [ name ]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`${duplicateCheck.rows[0]} is already exists`);

    const result = await db.query(
      `INSERT INTO destinations
           (name)
           VALUES ($1)
           RETURNING id, name`,
      [ name ]
    );
    const category = result.rows[0];

    return category;
  }

  /** Find all destinations.
   *
   * searchFilters (all optional):
   * - name (will find case-insensitive, partial matches)
   *
   * Returns [{ id, name }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT id, name
                 FROM destinations`;
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
    const destinationRes = await db.query(query, queryValues);
    return destinationRes.rows;
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
      `SELECT id, name
       FROM destinations
       WHERE id = $1`,
      [ id ]
    );

    const destination = itemRes.rows[0];

    if (!destination) throw new NotFoundError(`No destination: ${id}`);

    return destination;
  }

  /** Update destination name with `data`.
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
    if (data.name) {
      const duplicateCheck = await db.query(
        `SELECT name
         FROM destinations
         WHERE name ILIKE $1`,
        [ data.name ]
      );

      if (duplicateCheck.rows[0])
        throw new BadRequestError(
          `${duplicateCheck.rows[0]} is already exists`
        );
    }
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const destVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE destinations 
                        SET ${setCols} 
                        WHERE id = ${destVarIdx} 
                        RETURNING id, 
                                  name`;
    const result = await db.query(querySql, [ ...values, id ]);
    const destination = result.rows[0];

    if (!destination) throw new NotFoundError(`No destination: ${id}`);

    return destination;
  }

  /** Delete given destination from database; returns undefined.
   *
   * Throws NotFoundError if destination not found.
   * 
   * This should not be done once a destination has been used
   * Possibly implement an is_active field if needed
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM destinations
       WHERE id = $1
       RETURNING id`,
      [ id ]
    );
    const destination = result.rows[0];

    if (!destination) throw new NotFoundError(`No destination: ${id}`);
  }
}

module.exports = Destination;
