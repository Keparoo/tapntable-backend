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

const ItemModGroup = require('../models/itemModGroup');

const itemModGroupNewSchema = require('../schemas/itemModGroupNew.json');
const itemModGroupSearchSchema = require('../schemas/itemModGroupSearch.json');

const router = express.Router();

/** POST /itemmodgroup { itemModGroup }  => {itemModGroup: { itemModGroup }}
 *
 * Required itemModGroup: { itemId, modGroupId }
 *
 * This returns the newly created ordered itemModGroup
 *  { itemModGroup: { itemId, modGroupId } }
 *
 * Authorization required: ensureCorrectUserOrManager
 **/

router.post('/', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, itemModGroupNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const itemModGroup = await ItemModGroup.create(req.body);
    return res.status(201).json({ itemModGroup });
  } catch (err) {
    return next(err);
  }
});

/** GET /itemmodgroup  =>
 *   { ordItems: [ { itemId, itemName, modGroupId, modGroupName }, ...] }
 *
 * Can filter on provided optional search filters:
   * - itemId
   * - itemName
   * - modGroupId
   * - modGroupName
   * - desc
 *
 * Authorization required: logged into current user
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
  const q = req.query;
  // Convert querystring to int
  if (q.itemId) q.itemId = +q.itemId;
  if (q.modGroupId) q.modGroupId = +q.modGroupId;
  // Convert querystring to boolean
  if (q.desc) q.desc = q.desc.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, itemModGroupSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const itemModGroups = await ItemModGroup.findAll(q);
    return res.json({ itemModGroups });
  } catch (err) {
    return next(err);
  }
});

/** GET /itemmodgroup/:id  =>  {itemModGroups: { itemModGroups }}
 *
 * Given an itemId, return a list of all itemModGroups
 * 
 * Returns: { ordItemId, modId, modName, modCatId, modPrice, isActive, itemId, itemNote, itemName }}
 *
 * Authorization required: logged in
 */

router.get('/:itemId', ensureLoggedIn, async function(req, res, next) {
  try {
    const itemModGroups = await ItemModGroup.get(req.params.itemId);
    return res.json({ itemModGroups });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /itemmodgroup/:id { fld1, fld2, ... } => {ordItem: { ordItem }}
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

/** DELETE /itemmodgroup/:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner
 * The route takes the ordItemId, the modId is sent in the body
 * 
 */

router.delete('/:itemId', ensureManager, async function(req, res, next) {
  try {
    await ItemModGroup.remove(req.params.itemId, req.body.modGroupId);
    return res.json({ deleted: `${req.params.itemId}-${req.body.modGroupId}` });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
