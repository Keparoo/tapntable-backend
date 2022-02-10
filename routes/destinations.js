'use strict';

/** Routes for destinations. */

const jsonschema = require('jsonschema');

const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const Destination = require('../models/destination');

const categoryNewSchema = require('../schemas/destinationNew.json');
const categorySearchSchema = require('../schemas/destinationSearch.json');
const categoryUpdateSchema = require('../schemas/destinationUpdate.json');

const router = express.Router();

/** POST items/destinations, { destination }  => { id, name}
 *
 * destination should be { name } 
 *
 * This returns the newly created destination
 *  { destination: { id, name }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 **/

router.post('/', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, destinationNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const destination = await Destination.create(req.body);
		return res.status(201).json({ destination });
	} catch (err) {
		return next(err);
	}
});

/** GET items/destinations  =>
 *   { destinations: [ { id, name }, ...] }
 *
 * Can filter on provided optional search filters:
 * - name (will find case-insensitive, partial matches)
 *
 * Authorization required: LoggedIn
 * 
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;

	try {
		const validator = jsonschema.validate(q, destinationSearchSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const destinations = await Destination.findAll(q);
		return res.json({ destinations });
	} catch (err) {
		return next(err);
	}
});

/** GET /items/destinations/:id  =>  { id, name }
 *
 *  destination is { id, name }
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
	try {
		const destination = await Destination.get(req.params.id);
		return res.json({ destination });
	} catch (err) {
		return next(err);
	}
});

/** PATCH items/destinations/:id, { fld1, fld2, ... } => { destination }
 *
 * Updates destination name.
 *
 * fields can be: { name }
 *
 * Returns { id, name }
 *
 * Authorization required: Authorization required: manager or owner (RoleId = 10 or 11)
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, destinationUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const destination = await Destination.update(req.params.id, req.body);
		return res.json({ destination });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /destinations/id  =>  { deleted: id }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 * Note: Destinations should not be deleted once they have been used in any way. If needed, implement is_active
 * This route should only run if an item is created accidentally and needs to be immediately deleted.
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
	try {
		await Destination.remove(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
