'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for adding a mod to an ordered item. */

class OrdItemMod {
  /** Add a mod to an ordered item.
   *
   * Required fields: { ordItemId, modId }
   *
   * Returns { ordItemId, modId }
   *
   * Throws BadRequestError if ordItem or mod doesn't exist.
   * */

  static async create({ ordItemId, modId }) {
    const ordItemExistsCheck = await db.query(
      `SELECT id
		       FROM ordered_items
		       WHERE id = $1`,
      [ ordItemId ]
    );

    if (!ordItemExistsCheck.rows[0])
      throw new BadRequestError(`Ordered Item Id: ${ordItemId} doesn't exist`);

    const modIdExistsCheck = await db.query(
      `SELECT id
             FROM mods
             WHERE id = $1`,
      [ modId ]
    );

    if (!modIdExistsCheck.rows[0])
      throw new BadRequestError(`Mod id: ${modId} doesn't exist`);

    const result = await db.query(
      `INSERT INTO ordered_items_mods (ordered_item_id, mod_id)
        VALUES ($1, $2)
        RETURNING ordered_item_id AS "orderedItemId",
                  mod_id AS "modId"`,
      [ ordItemId, modId ]
    );
    const mod = result.rows[0];

    return mod;
  }

  /** Find all orderedItemMods (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - itemName  (will find case-insensitive, partial matches)
   * - modName
   * - modCatId
   * - modPrice
   * - isActive
   * - desc
   *
   * Returns [{ id, name, modCatId, modCat, modPrice, isActive }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT oim.ordered_item_id AS "ordItemId",
                        oi.item_id AS "itemId",
                        i.name AS "itemName",
                        oi.item_note AS "itemNote",
                        m.id AS "modId",
                        m.name AS "modName",
                        m.mod_cat_id AS "modCatId",
                        m.mod_price AS "modPrice",
                        m.is_active AS "isActive"
                   FROM ordered_items_mods oim
                   INNER JOIN mods m ON oim.mod_id = m.id
                   INNER JOIN ordered_items oi ON oim.ordered_item_id = oi.id
                   INNER JOIN items i on oi.item_id = i.id`;
    let whereExpressions = [];
    let queryValues = [];

    const {
      itemName,
      modName,
      modCatId,
      modPrice,
      isActive,
      desc
    } = searchFilters;

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (itemName) {
      queryValues.push(`%${itemName}%`);
      whereExpressions.push(`i.name ILIKE $${queryValues.length}`);
    }

    if (modName) {
      queryValues.push(`%${modName}%`);
      whereExpressions.push(`m.name ILIKE $${queryValues.length}`);
    }

    if (modCatId) {
      queryValues.push(modCatId);
      whereExpressions.push(`m.mod_cat_id = $${queryValues.length}`);
    }

    if (modPrice) {
      queryValues.push(modPrice);
      whereExpressions.push(`m.mod_price = $${queryValues.length}`);
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

  /** Given an ordItemId, return a list of all mods.
     *
     * Returns { ordItemId, modId, modName, modCatId, modPrice, isActive, itemId, itemNote, itemName }
     *
     * Throws NotFoundError if orderedItemId is not found.
     **/

  static async get(ordItemId) {
    const modRes = await db.query(
      `SELECT oim.ordered_item_id AS "ordItemId",
              oim.mod_id AS "modId", 
              m.name AS "modName",
              m.mod_cat_id AS "modCatId",
              m.mod_price AS "modPrice",
              m.is_active AS "isActive",
              oi.item_id AS "itemId",
              oi.item_note AS "itemNote",
              i.name AS "itemName"
        FROM ordered_items_mods oim
        INNER JOIN mods m ON oim.mod_id = m.id
        INNER JOIN ordered_items oi ON oim.ordered_item_id = oi.id
        INNER JOIN items i ON oi.item_id = i.id
        WHERE oim.ordered_item_id = $1`,
      [ ordItemId ]
    );

    const mods = modRes.rows[0];

    if (!mods) throw new NotFoundError(`No ordered-item mod: ${ordItemId}`);

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
   * Mods should not be deleted from database after entries have been posted
   * Instead mod should be marked isActive=false
   *
   * Throws NotFoundError if item not found.
   **/

  static async remove(ordItemId, modId) {
    const result = await db.query(
      `DELETE
      FROM ordered_items_mods
      WHERE ordered_item_id = $1 AND mod_id = $2
      RETURNING ordered_item_id AS "ordItemId",
                mod_id AS "modId"`,
      [ ordItemId, modId ]
    );
    const ordItemMod = result.rows[0];

    if (!ordItemMod)
      throw new NotFoundError(`No ordered-item mod: ${ordItemId}, ${modId}`);
  }
}

module.exports = OrdItemMod;
