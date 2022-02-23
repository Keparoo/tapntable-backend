'use strict';

/** Routes for user orders. */

const jsonschema = require('jsonschema');
const express = require('express');

const {
  ensureManager,
  ensureCorrectUserOrManager
} = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const Order = require('../models/order');

const orderNewSchema = require('../schemas/orderNew.json');
const orderSearchSchema = require('../schemas/orderSearch.json');

const router = express.Router();

/** POST /orders { order }  => {order: { order }}
 *
 * order should be { userId }
 *
 * This returns the newly created order
 *  { order: { id, userId, sentAt} }
 *
 * Authorization required: logged in
 **/

router.post('/', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, orderNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const order = await Order.create(req.body);
    return res.status(201).json({ order });
  } catch (err) {
    return next(err);
  }
});

/** GET /orders  =>
 *   { orders: [ { id, userId, sentAt, itemId, name, price, categoryId,  count, destination_id, check_id, seat_num, item_note, is_void}...] }
 *
 * Can filter on provided optional search filters:
 * - userId
 * - sentAt (find orders after sentAt datetime)
 * - destinationId
 * - before (find orders where sentAt is before this datetime)
 * - desc (default sort is by sent_by ascending: desc=true will sort descending)
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureCorrectUserOrManager, async function(req, res, next) {
  const q = req.query;

  if (q.userId) q.userId = +q.userId;
  if (q.destinationId) q.destinationId = +q.destinationId;
  if (q.desc) q.desc = q.desc.toLocaleLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, orderSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const orders = await Order.findAll(q);
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
});

/** GET /orders/:id  =>  { order }
 *
 * Order is { id, userId, sentAt}
 * 
 * Returns { order: { id, userId, sentAt}}
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const order = await Order.get(req.params.id);
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
