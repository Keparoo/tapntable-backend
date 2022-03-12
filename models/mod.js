'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for items. */

class Item {
  /** Create a mod (from data), update db, return new mod data.
   *
   * Required fields: { name, mod_cat_id }
   * Optional fields: { mod_price }
   *
   * Returns { id, name, modCatId, modPrice, isActive}
   *
   * Throws BadRequestError if mod already in database.
   * */

  static async create({ name, modCatId, modPrice }) {
    const duplicateCheck = await db.query(
      `SELECT id
		       FROM mods
		       WHERE name ILIKE $1`,
      [ name ]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`${duplicateCheck.rows[0]} already exists`);

    const result = await db.query(
      `INSERT INTO mods (name, modCatId, modPrice)
           VALUES ($1, $2, $3)
           RETURNING id,
                      name,
                      mod_cat_id AS "modCatId,
                      mod_price AS "modPrice",
                      is_active AS "isActive"`,
      [ name, modCatId, modPrice ]
    );
    const mod = result.rows[0];

    return mod;
  }

  /** Find all mods (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - name (will find case-insensitive, partial matches)
   * - categoryId
   * - modCat
   * - modPrice
   * - isActive
   * - desc
   *
   * Returns [{ id, name, modCatId, modCat, modPrice, isActive }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT m.id,
                        m.name,
                        m.mod_cat_id AS "modCatId",
                        c.name AS "modCat,
                        m.mod_price AS "modPrice",
                        m.is_active AS "isActive"
                   FROM mods m INNER JOIN mod_categories c
                   ON m.id = c.id`;
    let whereExpressions = [];
    let queryValues = [];

    const {
      name,
      categoryId,
      modCat,
      modPrice,
      isActive,
      desc
    } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`m.name ILIKE $${queryValues.length}`);
    }

    if (categoryId) {
      queryValues.push(categoryId);
      whereExpressions.push(`m.category_id = $${queryValues.length}`);
    }

    if (modCat) {
      queryValues.push(modCat);
      whereExpressions.push(`c.name ILIKE $${queryValues.length}`);
    }

    if (modPrice) {
      queryValues.push(modPrice);
      whereExpressions.push(`m.price = $${queryValues.length}`);
    }

    if (isActive !== undefined) {
      queryValues.push(isActive);
      whereExpressions.push(`m.is_active = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY i.name';
    if (desc) query += ' DESC';
    const modsRes = await db.query(query, queryValues);
    return modsRes.rows;
  }

  /** Given an mod id, return data about the mod.
     *
     * Returns { id, name, modCatId, modCat, modPrice, isActive }
     *
     * Throws NotFoundError if not found.
     **/

  static async get(id) {
    const itemRes = await db.query(
      `SELECT m.id,
              m.name,
              m.mod_cat_id AS "modCatId",
              c.name AS "modCat,
              m.mod_price AS "modPrice",
              m.is_active AS "isActive"
        FROM mods m INNER JOIN mod_categories c
        ON m.id = c.id
        WHERE m.id = $1`,
      [ id ]
    );

    const mod = modRes.rows[0];

    if (!mod) throw new NotFoundError(`No mod: ${id}`);

    return mod;
  }

  /** Update mod data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { name, modCatId, modPrice, isActive }
   *
   * Returns { id, name, modCatId, modPrice, isActive }
   *
   * Thorws BadRequestError if mod (case insensitive) is already in database
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    if (data.name) {
      const duplicateCheck = await db.query(
        `SELECT id
             FROM mods
             WHERE name ILIKE $1`,
        [ data.name ]
      );

      if (duplicateCheck.rows[0])
        throw new BadRequestError(`${duplicateCheck.rows[0]} already exists`);
    }

    const { setCols, values } = sqlForPartialUpdate(data, {
      modCatId: 'mod_cat_id',
      modPrice: 'mod_price',
      isActive: 'is_active'
    });
    const idVarIdx = '$' + (values.length + 1);

    const querySql = `UPDATE items 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                  name, 
                                  mod_cat_id AS "modCatId",
                                  mod_price AS "modPrice",
                                  is_active AS "isActive"`;
    const result = await db.query(querySql, [ ...values, id ]);
    const mod = result.rows[0];

    if (!mod) throw new NotFoundError(`No mod: ${id}`);

    return mod;
  }

  /** Delete given mod from database; returns undefined.
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
    const mod = result.rows[0];

    if (!mod) throw new NotFoundError(`No mod: ${id}`);
  }
}

module.exports = Mod;
