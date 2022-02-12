'use strict';

/** Routes for user tickets. */

const jsonschema = require('jsonschema');
const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const Ticket = require('../models/ticket');

const ticketNewSchema = require('../schemas/ticketNew.json');
const ticketSearchSchema = require('../schemas/ticketSearch.json');

const router = express.Router();

/** POST / { ticket }  => { ticket }
 *
 * ticket should be { userId }
 *
 * This returns the newly created ticket
 *  { ticket: { id, userId, sentAt} }
 *
 * Authorization required: logged in
 **/

router.post('/', ensureLoggedIn, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, ticketNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const ticket = await Ticket.create(req.body);
		return res.status(201).json({ ticket });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { tickets: [ { id, userId, sentAt}...] }
 *
 * Can filter on provided optional search filters:
 * - userId
 * - sentAt
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;

	if (q.userId) q.userId = +q.userId;

	try {
		const validator = jsonschema.validate(q, ticketSearchSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const tickets = await Ticket.findAll(q);
		return res.json({ tickets });
	} catch (err) {
		return next(err);
	}
});

/** GET /:id  =>  { ticket }
 *
 *  Ticket is { ticket: { id, userId, sentAt} }
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
	try {
		const ticket = await Ticket.get(req.params.id);
		return res.json({ ticket });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
