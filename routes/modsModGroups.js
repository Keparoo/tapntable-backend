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

const ModsModGroup = require('../models/modsModGroup');

const modsModGroupsNewSchema = require('../schemas/modsModGroupsNew.json');
const modsModGroupsSearchSchema = require('../schemas/modsModGroupsSearch.json');

const router = express.Router();

/** POST /mods/modgroups { modsModGroup }  => {modsModGroup: { modsModGroup }}
 *
 * Required modsModGroup: { modId, modGroupId }
 *
 * This returns the newly created ordered modsModGroup
 *  { modsModGroup: { modId, modGroupId } }
 *
 * Authorization required: ensureCorrectUserOrManager
 **/

router.post('/', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, modsModGroupsNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const modsModGroup = await ModsModGroup.create(req.body);
    return res.status(201).json({ modsModGroup });
  } catch (err) {
    return next(err);
  }
});

/** GET /mods/modgroups  =>
 *   { ordItems: [ { itemId, itemName, modGroupId, modGroupName }, ...] }
 *
 * Can filter on provided optional search filters:
   * - modId
   * - modName
   * - modGroupdId
   * - modGroupName
   * - desc
 *
 * Authorization required: logged into current user
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
  const q = req.query;
  // Convert querystring to int
  if (q.modId) q.modId = +q.modId;
  if (q.modGroupId) q.modGroupId = +q.modGroupId;
  // Convert querystring to boolean
  if (q.desc) q.desc = q.desc.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, modsModGroupsSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const modsModGroups = await ModsModGroup.findAll(q);
    return res.json({ modsModGroups });
  } catch (err) {
    return next(err);
  }
});

/** GET /mods/modgroups/:id  =>  {mods: {mods }}
 *
 * Given an modGroupId, return a list of all related mods
 * 
 * Returns: { ordItemId, modId, modName, modCatId, modPrice, isActive, itemId, itemNote, itemName }}
 *
 * Authorization required: logged in
 */

router.get('/:itemId', ensureLoggedIn, async function(req, res, next) {
  try {
    const modsModGroups = await ModsModGroup.get(req.params.itemId);
    return res.json({ modsModGroups });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /mods/modgroups/:id { fld1, fld2, ... } => {ordItem: { ordItem }}
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

/** DELETE /mods/modgroups/:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner
 * The route takes the modId, the modGroupId is sent in the body
 * 
 */

router.delete('/:modId', ensureManager, async function(req, res, next) {
  try {
    await ModsModGroup.remove(req.params.modId, req.body.modGroupId);
    return res.json({ deleted: `${req.params.modId}-${req.body.modGroupId}` });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
