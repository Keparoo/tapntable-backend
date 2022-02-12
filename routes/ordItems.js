'use strict';

/** Routes for user tickets. */

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

/** POST / { ordItem }  => { ordItem }
 *
 * ordItem should be { itemId, ticketId, checkId, seatNum, itemNote } 
 *
 * This returns the newly created ordered item
 *  { ordItem: { id, itemId, ticketId, checkId, seatNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid } }
 *
 * Authorization required: logged into currend user
 **/

// router.post('/:id/ordered', ensureManager, async function(req, res, next) {
// 	try {
// 		const validator = jsonschema.validate(req.body, orderedNewSchema);
// 		if (!validator.valid) {
// 			const errs = validator.errors.map((e) => e.stack);
// 			throw new BadRequestError(errs);
// 		}

// 		const ordItem = await OrdItem.create(req.params.id, req.body);
// 		return res.status(201).json({ ordItem });
// 	} catch (err) {
// 		return next(err);
// 	}
// });

/** GET /ordered  =>
 *   { ordItems: [ { id, itemId, ticketId, checkId, seatNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }, ...] }
 *
 * Can filter on provided optional search filters:
  * - itemId
  * - ticketId
  * - checkId
  * - isVoid
 *
 * Authorization required: logged into current user
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;
	// Convert querystring to int
	if (q.itemId) q.itemId = +q.itemId;
	if (q.ticketId) q.ticketId = +q.ticketId;
	if (q.checkId) q.checkId = +q.checkId;
	// Convert querystring to boolean
	if (q.isVoid) q.isVoid = q.isVoid.toLowerCase() === 'true';

	try {
		const validator = jsonschema.validate(q, orderedSearchSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const ordItems = await OrdItem.findAll(req.params.id, q);
		return res.json({ ordItems });
	} catch (err) {
		return next(err);
	}
});

/** GET /ordered/:id  =>  { ordItem }
 *
 *  Item is { ordItem: { id, itemId, ticketId, checkId, seatNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }}
 *
 * Authorization required: logged into current user
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
	try {
		const ordItem = await OrdItem.get(req.params.id);
		return res.json({ ordItem });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /ordered/:id { fld1, fld2, ... } => { ordItem }
 *
 * Patches ordered item data.
 *
 * fields can be: { seatNum, itemNote, itemDiscountId, isVoid }
 *
 * Returns { ordItem: { id, itemId, ticketId, checkId, seatNum, completedAt, completedBy, deliveredAt, itemNote, itemDiscountId, isVoid }}
 *
 * Authorization required: Authorization required: manager or owner (RoleId = 10 or 11)
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
	const params = { ...req.body, checkId: req.params.id };
	try {
		const validator = jsonschema.validate(params, orderedUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const ordItem = await OrdItem.update(req.params.id, req.body);
		return res.json({ ordItem });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /ordered/:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
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
