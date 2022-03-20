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

const OrdItem = require('../models/ordItem');

const orderedNewSchema = require('../schemas/orderedNew.json');
const orderedSearchSchema = require('../schemas/orderedSearch.json');
const orderedUpdateSchema = require('../schemas/orderedUpdate.json');

const router = express.Router();

/** POST /ordered { ordItem }  => {ordItem: { ordItem }}
 *
 * Required Items: { itemId, orderId, checkId }
 * Optional Items: { seatNum, courseNum, itemNote }
 *
 * This returns the newly created ordered item
 *  { ordItem: { id, itemId, orderId, checkId, seatNum, courseNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid } }
 *
 * Authorization required: ensureCorrectUserOrManager
 **/

router.post('/', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, orderedNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.itemNote) req.body.itemNote = req.body.itemNote.trim();

    const ordItem = await OrdItem.create(req.body);
    return res.status(201).json({ ordItem });
  } catch (err) {
    return next(err);
  }
});

/** GET /ordered  =>
 *   { ordItems: [ { id, itemId, name, price, destinationId, count, orderId, checkId, seatNum, courseNum, sentAt, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }, ...] }
 *
 * Can filter on provided optional search filters:
  * - itemId
  * - orderId
  * - checkId
  * - sentAt (return ordered_items sent after >= sentAt)
  * - seatNum
  * - courseNum
  * - isVoid
  * - start (return ordered_items sent after >= sentAt)
  * - end (return ordered_items sent before <= sentAt)
  * - desc
 *
 * Authorization required: logged into current user
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
  const q = req.query;
  // Convert querystring to int
  if (q.itemId) q.itemId = +q.itemId;
  if (q.orderId) q.orderId = +q.orderId;
  if (q.checkId) q.checkId = +q.checkId;
  if (q.seatNum) q.seatNum = +q.seatNum;
  if (q.courseNum) q.courseNum = +q.courseNum;
  // Convert querystring to boolean
  if (q.isVoid) q.isVoid = q.isVoid.toLowerCase() === 'true';
  if (q.desc) q.desc = q.desc.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, orderedSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const ordItems = await OrdItem.findAll(q);
    return res.json({ ordItems });
  } catch (err) {
    return next(err);
  }
});

/** GET /ordered/:id  =>  {ordItem: { ordItem }}
 *
 * Item is  { id, itemId, orderId, checkId, seatNum, courseNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }
 * 
 * Returns: {ordItem: { id, itemId, orderId, checkId, seatNum, courseNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }}
 *
 * Authorization required: logged in
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const ordItem = await OrdItem.get(req.params.id);
    return res.json({ ordItem });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /ordered/:id { fld1, fld2, ... } => {ordItem: { ordItem }}
 *
 * Patches ordered item data.
 *
 * fields can be: { seatNum, courseNum, itemNote, itemDiscountId, isVoid }
 *
 * Returns { ordItem: { id, itemId, orderId, checkId, seatNum, courseNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }}
 *
 * Authorization required: Authorization required: manager or owner
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, orderedUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.itemNote) req.body.itemNote = req.body.itemNote.trim();

    const ordItem = await OrdItem.update(req.params.id, req.body);
    return res.json({ ordItem });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /ordered/:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner
 * 
 * Note: Ordered items should not be deleted once they have been used in any way. Instead: * is_void=true
 * This route should only run if an item is created accidentally and needs to be immediately deleted.
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
  try {
    await OrdItem.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
