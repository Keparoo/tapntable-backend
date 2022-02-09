'use strict';

/** Routes for items. */

const jsonschema = require('jsonschema');

const express = require('express');
const {
	ensureManager,
	ensureLoggedIn,
	ensureCorrectUserOrManager
} = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const Item = require('../models/item');
const { createToken } = require('../helpers/tokens');
const itemNewSchema = require('../schemas/itemNew.json');
const itemUpdateSchema = require('../schemas/itemUpdate.json');
const itemSearchSchema = require('../schemas/itemSearch.json');

const router = express.Router();

/** POST / { item }  => { item }
 *
 * item should be { name, description, price, category_id, destination_id } 
 *
 * This returns the newly created item
 *  {item: { id, name, description, price, category_id, destination_id, count, is_active }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 **/

router.post('/', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, itemNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const item = await Item.create(req.body);
		return res.status(201).json({ item });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { items: [ { id, name, description, price, category_id, destination_id, count, is_active }, ...] }
 *
 * Can filter on provided search filters:
 * - nameLike (will find case-insensitive, partial matches)
 * - category
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;

	try {
		const validator = jsonschema.validate(q, itemSearchSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const items = await Item.findAll(q);
		return res.json({ items });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  =>  { item }
 *
 *  Item is { id, name, description, price, category_id, destination_id, count, is_active }
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
	try {
		const item = await Item.get(req.params.handle);
		return res.json({ item });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[id] { fld1, fld2, ... } => { item }
 *
 * Patches item data.
 *
 * fields can be: { name, description, price, category_id, destination_id, count, is_active }
 *
 * Returns { id, name, description, price, category_id, destination_id, count, is_active }
 *
 * Authorization required: Authorization required: manager or owner (RoleId = 10 or 11)
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, itemUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const item = await Item.update(req.params.handle, req.body);
		return res.json({ item });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[handle]  =>  { deleted: id }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 * Note: Items should not be deleted once they have been used in any way. Instead: * is_active=false
 * This route should only run if an item is created accidentally and needs to be immediately deleted.
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
	try {
		await Item.remove(req.params.handle);
		return res.json({ deleted: req.params.handle });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;