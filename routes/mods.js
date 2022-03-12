'use strict';

/** Routes for items. */

const jsonschema = require('jsonschema');
const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const Mod = require('../models/mod');

const modNewSchema = require('../schemas/modNew.json');
const modUpdateSchema = require('../schemas/modUpdate.json');
const modSearchSchema = require('../schemas/modSearch.json');

const router = express.Router();

/** POST / { mod }  => {mod: { mod }}
 *
 * Required fields: { name, modCatId }
 * Optional fields: { modPrice }
 *
 * This returns the newly created mod
 *  {mod: { id, name, modCatId, modPrice, isActive}}
 *
 * Authorization required: manager or owner
 **/

router.post('/', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, modNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.name) req.body.name = req.body.name.trim();

    const mod = await Mod.create(req.body);
    return res.status(201).json({ mod });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { mods: [ { id, name, modCatId, modCat, modPrice, isActive }, ...] }
 *
 * Can filter on provided optional search filters:
   * - name (will find case-insensitive, partial matches)
   * - categoryId
   * - modCat
   * - modPrice
   * - isActive
   * - desc
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
  const q = req.query;
  // Convert querystring to int
  if (q.categoryId) q.categoryId = +q.categoryId;
  // Convert querystring to boolean
  if (q.isActive) q.isActive = q.isActive.toLowerCase() === 'true';
  if (q.desc) q.desc = q.desc.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, modSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const mods = await Mod.findAll(q);
    return res.json({ mods });
  } catch (err) {
    return next(err);
  }
});

/** GET /:id  =>  {mod: { mod }}
 *
 *  Mod is { id, name, modCatId, modCat, modPrice, isActive }
 * 
 * Returns: {mod: { id, name, modCatId, modCat, modPrice, isActive }}
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const mod = await Mod.get(req.params.id);
    return res.json({ mod });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /:id { fld1, fld2, ... } => {mod: { mod }}
 *
 * Patches mod data.
 *
 * fields can be: { name, modCatId, modPrice, isActive }
 *
 * Returns {mod: { name, modCatId, modPrice, isActive }}
 *
 * Throws BadRequestError if mod (case insensitive) is already in db
 * Authorization required: Authorization required: manager or owner
 */

router.patch('/:id', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, modUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.name) req.body.name = req.body.name.trim();

    const mod = await Mod.update(req.params.id, req.body);
    return res.json({ mod });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /:id  =>  { deleted: id }
 *
 * Authorization required: manager or owner
 * 
 * Note: Mods should not be deleted once they have been used in any way. Instead: * is_active=false
 * This route should only run if a mod is created accidentally and needs to be immediately deleted.
 * 
 */

router.delete('/:id', ensureManager, async function(req, res, next) {
  try {
    await Mod.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
