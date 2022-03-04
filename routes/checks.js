'use strict';

/** Routes for checks. */

const jsonschema = require('jsonschema');
const express = require('express');

const {
  ensureManager,
  ensureCorrectUserOrManager
} = require('../middleware/auth');
const { BadRequestError } = require('../expressError');

const Check = require('../models/check');

const checkNewSchema = require('../schemas/checkNew.json');
const checkUpdateSchema = require('../schemas/checkUpdate.json');
const checkSearchSchema = require('../schemas/checkSearch.json');
const orderedNewSchema = require('../schemas/orderedNew.json');
const orderedSearchSchema = require('../schemas/orderedSearch.json');
const orderedUpdateSchema = require('../schemas/orderedUpdate.json');

const router = express.Router();

/** POST /checks { check }  => {check: { check }}
 *
 * check should be { userId, tablId, numGuests, customer } 
 *
 * This returns the newly created item
 *  {check: { id, user_id, table_num, num_guests, customer, created_at, subtotal, local_tax, state_tax, federal_tax } }
 *
 * Authorization required: logged in to own account
 **/

router.post('/', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, checkNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const check = await Check.create(req.body);
    return res.status(201).json({ check });
  } catch (err) {
    return next(err);
  }
});

/** GET /checks  =>
 *   { checks: [{ id, userId, employee, tableNum, numGuests, customer, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }, ...] }
 *
 * Can filter on provided optional search filters:
   * - userId 
   * - employee (will find case-insensitive, partial matches)
   * - tableNum
   * - numGuests
   * - customer
   * - createdAt
   * - printedAt
   * - closedAt
   * - discountId
   * - isVoid
   * - isOpen=true returns records where closed_at is null
 *
 * Authorization required: Logged in to own account
 */

router.get('/', ensureCorrectUserOrManager, async function(req, res, next) {
  const q = req.query;
  // Convert querystring to int
  if (q.userId) q.userId = +q.userId;
  if (q.numGuests) q.numGuests = +q.numGuests;
  if (q.tableNum) q.tableNum = +q.tableNum;
  if (q.discountId) q.discountId = +q.discountId;
  // Convert querystring to boolean
  if (q.isVoid) q.isVoid = q.isVoid.toLowerCase() === 'true';
  if (q.isOpen) q.isOpen = q.isOpen.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, checkSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const checks = await Check.findAll(q);
    return res.json({ checks });
  } catch (err) {
    return next(err);
  }
});

/** GET /checks/:id  =>  {check: { check }}
 *
 *  Check is { id, user_id, table_num, num_guests, customer, created_at, subtotal, local_tax, state_tax, federal_tax }
 *
 * Authorization required: Logged in to own account
 */

router.get('/:id', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const check = await Check.get(req.params.id);
    return res.json({ check });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /checks/:id { fld1, fld2, ... } => {check: { check }}
 *
 * Updates check data.
 *
 * fields can be: { userId, employee, tableNum, numGuests, customer, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }
 *
 * Returns {check: { id, userId, employee, tableNum, numGuests, customer, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }}
 *
 * Authorization required: Logged in to own account
 */

router.patch('/:id', ensureCorrectUserOrManager, async function(
  req,
  res,
  next
) {
  try {
    const validator = jsonschema.validate(req.body, checkUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const check = await Check.update(req.params.id, req.body);
    return res.json({ check });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /checks/:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 * Note: Check should not be deleted once they have been used in any way. Instead: * is_void=true
 * This route should only run if an item is created accidentally and needs to be immediately deleted.
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
  try {
    await Check.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
