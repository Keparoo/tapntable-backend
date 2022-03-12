'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for adding a mod to an ordered item. */

class itemModGroup {
  /** Associate an item with a mod group.
   *
   * Required fields: { itemId, modGroupId }
   *
   * Returns { itemId, modGroupId }
   *
   * Throws BadRequestError if itemId or modGroupId doesn't exist.
   * */

  static async create({ itemId, modGroupId }) {
    const itemExistsCheck = await db.query(
      `SELECT id
		       FROM items
		       WHERE id = $1`,
      [ itemId ]
    );

    if (!itemExistsCheck.rows[0])
      throw new BadRequestError(`Item Id: ${itemId} doesn't exist`);

    const modGroupExistsCheck = await db.query(
      `SELECT id
             FROM mods
             WHERE id = $1`,
      [ modGroupId ]
    );

    if (!modGroupExistsCheck.rows[0])
      throw new BadRequestError(`Mod Group id: ${modGroupId} doesn't exist`);

    const result = await db.query(
      `INSERT INTO items_mod_groups (item_id, mod_group_id)
        VALUES ($1, $2)
        RETURNING item_id AS "itemId",
                  mod_group_id AS "modGroupId"`,
      [ itemId, modGroupId ]
    );
    const mod = result.rows[0];

    return mod;
  }

  /** Find all item mod groups (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - itemId
   * - itemName
   * - modGroupdId
   * - modGroupName
   * - desc
   *
   * Returns [{ itemId, itemName, modGroupId, modGroupName }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT img.item_id AS "itemId",
                        i.name AS "itemName",
                        img.mod_group_id AS "modGroupId",
                        mg.name AS "modGroupName"
                  FROM item_mod_groups img
                  INNER JOIN items i ON img.item_id = i.id
                  INNER JOIN mod_groups mg ON img.mod_group_id = mg.id`;
    let whereExpressions = [];
    let queryValues = [];

    const { itemId, itemName, modGroupId, modGroupName, desc } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (itemName) {
      queryValues.push(`%${itemName}%`);
      whereExpressions.push(`i.name ILIKE $${queryValues.length}`);
    }

    if (itemId) {
      queryValues.push(itemId);
      whereExpressions.push(`img.item_id = $${queryValues.length}`);
    }

    if (modGroupId) {
      queryValues.push(modGroupId);
      whereExpressions.push(`img.mod_group_id = $${queryValues.length}`);
    }

    if (modGroupName) {
      queryValues.push(modGroupName);
      whereExpressions.push(`mg.name ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }

    // Finalize query and return results

    query += ' ORDER BY mg.name';
    if (desc) query += ' DESC';
    const modsRes = await db.query(query, queryValues);
    return modsRes.rows;
  }

  /** Given an itemId, return a list of all related mods groups.
     *
     * Returns { ordItemId, modId, modName, modCatId, modPrice, isActive, itemId, itemNote, itemName }
     *
     * Throws NotFoundError if orderedItemId is not found.
     **/

  static async get(itemId) {
    const groupRes = await db.query(
      `SELECT img.item_id AS "itemId",
              i.name AS "itemName",
              img.mod_group_id AS "modGroupId",
        FROM item_mod_groups img
        INNER JOIN items i ON img.item_id = i.id
        INNER JOIN mod_groups mg ON img.mod_group_id = mg.id
        WHERE img.item_id = $1`,
      [ itemId ]
    );

    const modGroups = groupRes.rows;

    if (!modGroups) throw new NotFoundError(`No item id: ${itemId}`);

    return modGroups;
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
   * Mods should not be deleted from database after entries have been posted
   * Instead mod should be marked isActive=false
   *
   * Throws NotFoundError if item not found.
   **/

  static async remove(itemId, modGroupId) {
    const result = await db.query(
      `DELETE
      FROM items_mod_groups
      WHERE item_id = $1 AND mod_group_id = $2
      RETURNING item_id AS "itemId",
                mod_group_id AS "modGroupId"`,
      [ itemId, modGroupId ]
    );
    const itemModGroup = result.rows[0];

    if (!itemModGroup)
      throw new NotFoundError(`No item mod group: ${itemId}, ${modGroupId}`);
  }
}

module.exports = itemModGroup;
