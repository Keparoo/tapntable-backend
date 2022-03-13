'use strict';

/** Routes for user orders. */

const jsonschema = require('jsonschema');
const express = require('express');

const {
  ensureManager,
  ensureLoggedIn,
  ensureCorrectUserOrManager
} = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const OrdItemMod = require('../models/ordItemMod');

const ordItemModNewSchema = require('../schemas/ordItemModNew.json');
const ordItemModSearchSchema = require('../schemas/ordItemModSearch.json');

const router = express.Router();

/** POST /ordered/mods { ordItem }  => {ordItem: { ordItem }}
 *
 * Required Items: { ordItemId, modId }
 *
 * This returns the newly created ordered ordItemMod
 *  { ordItemMod: { ordItemId, modId } }
 *
 * Authorization required: ensureCorrectUserOrManager
 **/

router.post('/', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, ordItemModNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const ordItemMod = await OrdItemMod.create(req.body);
    return res.status(201).json({ ordItemMod });
  } catch (err) {
    return next(err);
  }
});

/** GET /ordered/mods  =>
 *   { ordItems: [ { id, name, modCatId, modCat, modPrice, isActive }, ...] }
 *
 * Can filter on provided optional search filters:
   * - itemName  (will find case-insensitive, partial matches)
   * - modName
   * - modCatId
   * - modPrice
   * - isActive
   * - desc
 *
 * Authorization required: logged into current user
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
  const q = req.query;
  // Convert querystring to int
  if (q.modCatId) q.modCatId = +q.modCatId;
  if (q.modPrice) q.modPrice = +q.modPrice;
  // Convert querystring to boolean
  if (q.isActive) q.isActive = q.isActive.toLowerCase() === 'true';
  if (q.desc) q.desc = q.desc.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, ordItemModSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const ordItemMods = await OrdItemMod.findAll(q);
    return res.json({ ordItemMods });
  } catch (err) {
    return next(err);
  }
});

/** GET /ordered/mods/:id  =>  {ordItemMods: { ordItemMods }}
 *
 * Given an ordItemId, return a list of all mods
 * 
 * Mod is  { id, ordItemId, modId, modName, modCatId, modPrice, isActive }
 * 
 * Returns: {ordItemMods: { ordItemId, modId, modName, modCatId, modPrice, isActive, itemId, itemNote, itemName }}
 *
 * Authorization required: logged in
 */

router.get('/:ordItemId', ensureLoggedIn, async function(req, res, next) {
  try {
    const ordItemMods = await OrdItemMod.get(req.params.ordItemId);
    return res.json({ ordItemMods });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /ordered/mods/:id { fld1, fld2, ... } => {ordItem: { ordItem }}
 *
 * Patches ordered item data.
 *
 * fields can be: { seatNum, itemNote, itemDiscountId, isVoid }
 *
 * Returns { ordItem: { id, itemId, orderId, checkId, seatNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }}
 *
 * Authorization required: Authorization required: manager or owner
 */

// router.patch('/moditem/:id', ensureManager, async function(req, res, next) {
//   try {
//     const validator = jsonschema.validate(req.body, orderedUpdateSchema);
//     if (!validator.valid) {
//       const errs = validator.errors.map((e) => e.stack);
//       throw new BadRequestError(errs);
//     }

//     if (req.body.itemNote) req.body.itemNote = req.body.itemNote.trim();

//     const ordItem = await OrdItem.update(req.params.id, req.body);
//     return res.json({ ordItem });
//   } catch (err) {
//     return next(err);
//   }
// });

/** DELETE /ordered/mods/:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner
 * The route takes the ordItemId, the modId is sent in the body
 * 
 * Note: Ordered items should not be deleted once they have been used in any way. Instead: * is_void=true
 * This route should only run if an item is created accidentally and needs to be immediately deleted.
 * 
 */

router.delete('/:ordItemId', ensureManager, async function(req, res, next) {
  try {
    await OrdItemMod.remove(req.params.ordItemId, req.body.modId);
    return res.json({ deleted: `${req.params.ordItemId}-${req.body.modId}` });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
