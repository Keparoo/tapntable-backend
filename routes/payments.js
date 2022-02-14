'use strict';

/** Routes for payments. */

const jsonschema = require('jsonschema');
const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const Payment = require('../models/payment');

const paymentNewSchema = require('../schemas/paymentNew.json');
const paymentUpdateSchema = require('../schemas/paymentUpdate.json');
const paymentSearchSchema = require('../schemas/paymentSearch.json');

const router = express.Router();

/** POST / { payment }  => { payment: { payment }}
 *
 * payment should be { check_id, type, tip_amt, subtotal } 
 *
 * This returns the newly created payment
 *  { payment: { id, checkId, type, tipAmt, subtotal, isVoid } }
 *
 * Authorization required: logged in
 **/

router.post('/', ensureLoggedIn, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, paymentNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const payment = await Payment.create(req.body);
		return res.status(201).json({ payment });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { payments:[ { id, checkId, type, tipAmt, subtotal, isVoid }...]}
 *
 * Can filter on provided optional search filters:
 * - type
 * - isVoid
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;

	// Convert querystring to boolean
	if (q.isVoid) q.isVoid = q.isVoid.toLowerCase() === 'true';

	try {
		const validator = jsonschema.validate(q, paymentSearchSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const payments = await Payment.findAll(q);
		return res.json({ payments });
	} catch (err) {
		return next(err);
	}
});

/** GET /:id  =>  { payment }
 *
 *  Payment is { id, checkId, type, tipAmt, subtotal, isVoid }
 * 
 * Returns {payment: { id, checkId, type, tipAmt, subtotal, isVoid }}
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
	try {
		const payment = await Payment.get(req.params.id);
		return res.json({ payment });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /:id { fld1, fld2, ... } => { payment: { item }}
 *
 * Updates payment data.
 *
 * fields can be: { checkId, type, tipAmt, subtotal, isVoid }
 *
 * Returns { payment: { id, checkId, type, tipAmt, subtotal, isVoid } }
 *
 * Authorization required: Authorization required: manager or owner (RoleId = 10 or 11)
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, paymentUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const payment = await Payment.update(req.params.id, req.body);
		return res.json({ payment });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 * Note: Payments should not be deleted once they have been used in any way. Instead: * is_void=true
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
	try {
		await Payment.remove(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
