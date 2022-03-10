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
 * Required args { userId, tablId, numGuests }
 * Optional args { customer } This is a name/description for bar tabs
 *
 * This returns the newly created item
 *  {check: { id, userId, tableNum, customer, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid } }
 *
 * Authorization required: logged in to own account or manager
 **/

router.post('/', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, checkNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.customer) req.body.customer = req.body.customer.trim();

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
 * - createdAt (will find checks >= createdAt datetime)
 * - printedAt (will find checks >= createdAt datetime)
 * - closedAt (will find checks >= createdAt datetime)
 * - discountId
 * - isVoid
 * - isOpen=true returns records where closed_at is null
 * - start returns records where createdAt >= start
 * - end returns records where createdAt <= end
 * 
 * Note if start and end are used they are used as an AND statement: 
 * createdAt >= start AND createdAt <= end
 *
 * Authorization required: Logged in to own account or manager
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
 *  Check is { id, userId, employee, tableNum, numGuests, customer, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }
 * 
 * Throws NotFoundError if not found.
 *
 * Authorization required: Logged in to own account or manager
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
 * Columns to change can be: { tableNum, numGuests, customer, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }
 *
 * Returns {check: { id, userId, tableNum, customer, numGuests, createdAt, printedAt, closedAt, discountId, subtotal, discountTotal, localTax, stateTax, federalTax, isVoid }}
 * 
 * Throws NotFoundError if not found
 *
 * Authorization required: Logged in to own account or manager
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

    if (req.body.customer) req.body.customer = req.body.customer.trim();

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
 * Note: Check should not be deleted once they have been inserted. Instead: * is_void=true
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
