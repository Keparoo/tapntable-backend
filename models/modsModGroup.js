'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for adding a mod to an ordered item. */

class ModsModGroup {
  /** Add a mod to a mod group.
   *
   * Required fields: { modId, modGroupId }
   *
   * Returns { modId, modGroupId }
   *
   * Throws BadRequestError if modId or modGroupId doesn't exist.
   * */

  static async create({ modId, modGroupId }) {
    const itemExistsCheck = await db.query(
      `SELECT id
		       FROM mods
		       WHERE id = $1`,
      [ modId ]
    );

    if (!itemExistsCheck.rows[0])
      throw new BadRequestError(`Mod Id: ${itemId} doesn't exist`);

    const modGroupExistsCheck = await db.query(
      `SELECT id
             FROM mods
             WHERE id = $1`,
      [ modGroupId ]
    );

    if (!modGroupExistsCheck.rows[0])
      throw new BadRequestError(`Mod Group id: ${modGroupId} doesn't exist`);

    const result = await db.query(
      `INSERT INTO mods_mod_groups (mod_id, mod_group_id)
        VALUES ($1, $2)
        RETURNING mod_id AS "modId",
                  mod_group_id AS "modGroupId"`,
      [ modId, modGroupId ]
    );
    const modModGroup = result.rows[0];

    return modModGroup;
  }

  /** Find all mods in mod groups (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - modId
   * - modName
   * - modGroupdId
   * - modGroupName
   * - desc
   *
   * Returns [{ itemId, itemName, modGroupId, modGroupName, modPrice }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT mmg.mod_id AS "modId",
                        m.name AS "modName",
                        mmg.mod_group_id AS "modGroupId",
                        mg.name AS "modGroupName",
                        m.mod_price AS "modPrice"
                  FROM mods_mod_groups mmg
                  INNER JOIN mods m ON mmg.mod_id = m.id
                  INNER JOIN mod_groups mg ON mmg.mod_group_id = mg.id`;
    let whereExpressions = [];
    let queryValues = [];

    const { modId, modName, modGroupId, modGroupName, desc } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (modName) {
      queryValues.push(`%${modName}%`);
      whereExpressions.push(`m.name ILIKE $${queryValues.length}`);
    }

    if (modId) {
      queryValues.push(modId);
      whereExpressions.push(`mmg.mod_id = $${queryValues.length}`);
    }

    if (modGroupId) {
      queryValues.push(modGroupId);
      whereExpressions.push(`mmg.mod_group_id = $${queryValues.length}`);
    }

    if (modGroupName) {
      queryValues.push(`%${modGroupName}%`);
      whereExpressions.push(`mg.name ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY m.name';
    if (desc) query += ' DESC';
    const modsRes = await db.query(query, queryValues);
    return modsRes.rows;
  }

  /** Given a modGroupId, return a list of all related mods.
     *
     * Returns { itemId, itemName, modGroupId, modGroupName, modPrice }
     *
     * Throws NotFoundError if orderedItemId is not found.
     **/

  static async get(modGroupId) {
    const modsRes = await db.query(
      `SELECT mmg.mod_id AS "modId",
              m.name AS "modName",
              mmg.mod_group_id AS "modGroupId",
              mg.name AS "modGroupName",
              m.mod_price AS "modPrice"
        FROM mods_mod_groups mmg
        INNER JOIN mods m ON mmg.mod_id = m.id
        INNER JOIN mod_groups mg ON mmg.mod_group_id = mg.id
        WHERE mmg.mod_group_id = $1`,
      [ modGroupId ]
    );

    const mods = modsRes.rows;

    if (!mods) throw new NotFoundError(`No mod id: ${modGroupId}`);

    return mods;
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

  // static async update(id, data) {
  //   if (data.name) {
  //     const duplicateCheck = await db.query(
  //       `SELECT id
  //            FROM mods
  //            WHERE name ILIKE $1`,
  //       [ data.name ]
  //     );

  //     if (duplicateCheck.rows[0])
  //       throw new BadRequestError(`${duplicateCheck.rows[0]} already exists`);
  //   }

  //   const { setCols, values } = sqlForPartialUpdate(data, {
  //     modCatId: 'mod_cat_id',
  //     modPrice: 'mod_price',
  //     isActive: 'is_active'
  //   });
  //   const idVarIdx = '$' + (values.length + 1);

  //   const querySql = `UPDATE items
  //                       SET ${setCols}
  //                       WHERE id = ${idVarIdx}
  //                       RETURNING id,
  //                                 name,
  //                                 mod_cat_id AS "modCatId",
  //                                 mod_price AS "modPrice",
  //                                 is_active AS "isActive"`;
  //   const result = await db.query(querySql, [ ...values, id ]);
  //   const mod = result.rows[0];

  //   if (!mod) throw new NotFoundError(`No mod: ${id}`);

  //   return mod;
  // }

  /** Delete given mod from database; returns undefined.
   *
   * Throws NotFoundError if item not found.
   **/

  static async remove(modId, modGroupId) {
    const result = await db.query(
      `DELETE
      FROM mods_mod_groups
      WHERE mod_id = $1 AND mod_group_id = $2
      RETURNING mod_id AS "modId",
                mod_group_id AS "modGroupId"`,
      [ modId, modGroupId ]
    );
    const modModGroup = result.rows[0];

    if (!modModGroup)
      throw new NotFoundError(`No item mod group: ${modId}, ${modGroupId}`);
  }
}

module.exports = ModsModGroup;
