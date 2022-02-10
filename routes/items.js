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
const { createToken } = require('../helpers/tokens');
const Item = require('../models/item');
const Category = require('../models/category');

const itemNewSchema = require('../schemas/itemNew.json');
const itemUpdateSchema = require('../schemas/itemUpdate.json');
const itemSearchSchema = require('../schemas/itemSearch.json');
const categoryNewSchema = require('../schemas/categoryNew.json');
const categorySearchSchema = require('../schemas/categorySearch.json');
const categoryUpdateSchema = require('../schemas/categoryUpdate.json');

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
 *   { items: [ { id, name, description, price, category, destination, count, is_active }, ...] }
 *
 * Can filter on provided optional search filters:
 * - name (will find case-insensitive, partial matches)
 * - description (will find case-insensitive, partial matches)
 * - categoryId
 * - destinationId
 * - count
 * - isActive
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;
	// Convert querystring to int
	if (q.categoryId) q.categoryId = +q.categoryId;
	if (q.destinationId) q.destinationId = +q.destinationId;
	if (q.count) q.count = +q.count;
	// Convert querystring to boolean
	if (q.isActive) q.isActive = q.isActive.toLowerCase() === 'true';

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
		const item = await Item.get(req.params.id);
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

		const item = await Item.update(req.params.id, req.body);
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
		await Item.remove(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

/******************************************************************************/
/*                      Category Routes                                       */
/******************************************************************************/

/** POST items/categories, { category }  => { id, name}
 *
 * category should be { name } 
 *
 * This returns the newly created category
 *  { category: { id, name }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 **/

router.post('/categories', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, categoryNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const categyr = await Category.create(req.body);
		return res.status(201).json({ category });
	} catch (err) {
		return next(err);
	}
});

/** GET items/categories  =>
 *   { categories: [ { id, name }, ...] }
 *
 * Can filter on provided optional search filters:
 * - name (will find case-insensitive, partial matches)
 *
 * Authorization required: LoggedIn
 * 
 */

router.get('/categories', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;

	try {
		const validator = jsonschema.validate(q, categorySearchSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const categories = await Category.findAll(q);
		return res.json({ categories });
	} catch (err) {
		return next(err);
	}
});

/** GET /items/categories/:id  =>  { category }
 *
 *  category is { id, name }
 *
 * Authorization required: LoggedIn
 */

router.get('/categories/:id', ensureLoggedIn, async function(req, res, next) {
	try {
		const category = await Category.get(req.params.id);
		return res.json({ category });
	} catch (err) {
		return next(err);
	}
});

/** PATCH items/categories/:id, { fld1, fld2, ... } => { category }
 *
 * Patches category name.
 *
 * fields can be: { name }
 *
 * Returns { id, name }
 *
 * Authorization required: Authorization required: manager or owner (RoleId = 10 or 11)
 */

router.patch('/categories/:id', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, categoryUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const category = await Category.update(req.params.id, req.body);
		return res.json({ category });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /id  =>  { deleted: id }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 * Note: Catetgories should not be deleted once they have been used in any way. If needed, implement is_active
 * This route should only run if an item is created accidentally and needs to be immediately deleted.
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
	try {
		await Category.remove(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
