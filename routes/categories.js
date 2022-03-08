'use strict';

/** Routes for categories. */

const jsonschema = require('jsonschema');

const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const Category = require('../models/category');

const categoryNewSchema = require('../schemas/categoryNew.json');
const categorySearchSchema = require('../schemas/categorySearch.json');
const categoryUpdateSchema = require('../schemas/categoryUpdate.json');

const router = express.Router();

/** POST items/categories, { category }  => {category: { id, name}}
 *
 * category should be { name } 
 *
 * This returns the newly created category
 *  { category: { id, name }
 * 
 * Throws BadRequestError if category exists in database.
 * Throws BadRequestError if a category exists with same spelling but different capitalization
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 **/

router.post('/', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, categoryNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const newCat = req.body.trim();

    const category = await Category.create(newCat);
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

router.get('/', ensureLoggedIn, async function(req, res, next) {
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

/** GET /items/categories/:id  =>  {category: { id, name }}
 *
 *  category is { id, name }
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const category = await Category.get(req.params.id);
    return res.json({ category });
  } catch (err) {
    return next(err);
  }
});

/** PATCH items/categories/:id, { fld1, fld2, ... } => { category }
 *
 * Updates category name.
 *
 * fields can be: { name }
 *
 * Returns {category: { id, name }}
 * 
 * If data.name (or case insensitive version of data.name) exists in db, throw BadRequestError
 *
 * Authorization required: Authorization required: manager or owner (RoleId = 10 or 11)
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
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

/** DELETE /categories/id  =>  { deleted: id }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 * 
 * Note: Categories should not be deleted once they have been used in any way. If needed, implement is_active
 * This route should only run if an item is created accidentally and needs to be immediately deleted before any database insertions.
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
