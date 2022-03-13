'use strict';

/** Routes for items. */

const jsonschema = require('jsonschema');
const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const ModGroup = require('../models/modGroup');

const modGroupNewSchema = require('../schemas/modGroupNew.json');
const modGroupUpdateSchema = require('../schemas/modGroupUpdate.json');
const modGroupSearchSchema = require('../schemas/modGroupSearch.json');

const router = express.Router();

/** POST /modgroups { modGroup }  => {modGroup: { modGroup }}
 *
 * Required fields: { name }
 * Optional fields: { numChoices, isRequired }
 *
 * This returns the newly created modGroup
 *  {modGroup: { id, name, numChoices, isRequired }}
 *
 * Authorization required: manager or owner
 **/

router.post('/', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, modGroupNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.name) req.body.name = req.body.name.trim();

    const modGroup = await ModGroup.create(req.body);
    return res.status(201).json({ modGroup });
  } catch (err) {
    return next(err);
  }
});

/** GET /modgroups  =>
 *   { modGroups: [ { id, name, numChoices, isRequired }, ...] }
 *
 * Can filter on provided optional search filters:
  * - name (will find case-insensitive, partial matches)
  * - numChoices
  * - isRequired
  * - desc
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
  const q = req.query;
  // Convert querystring to int
  if (q.numChoices) q.numChoices = +q.numChoices;
  // Convert querystring to boolean
  if (q.isRequired) q.isRequired = q.isRequired.toLowerCase() === 'true';
  if (q.desc) q.desc = q.desc.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, modGroupSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const modGroups = await ModGroup.findAll(q);
    return res.json({ modGroups });
  } catch (err) {
    return next(err);
  }
});

/** GET /modgroups/:id  =>  {modGroup: { modGroup }}
 *
 *  modGroup is { id, name, numChoices, isRequired }
 * 
 * Returns: {modGroup: { id, name, numChoices, isRequired }}
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const modGroup = await ModGroup.get(req.params.id);
    return res.json({ modGroup });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /modgroups/:id { fld1, fld2, ... } => {modGroup: { modGroup }}
 *
 * Updates modGroup data.
 *
 * fields can be: { name, numChoices, isRequired }
 *
 * Returns {modGroup: { id, name, numChoices, isRequired }}
 *
 * Throws BadRequestError if name (case insensitive) is already in db
 * Authorization required: Authorization required: manager or owner
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, modGroupUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.name) req.body.name = req.body.name.trim();

    const modGroup = await ModGroup.update(req.params.id, req.body);
    return res.json({ modGroup });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /modgroups/:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
  try {
    await ModGroup.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
