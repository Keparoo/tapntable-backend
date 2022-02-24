'use strict';

/** Routes for user logs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const Log = require('../models/log');

const logNewSchema = require('../schemas/logNew.json');
const logSearchSchema = require('../schemas/logSearch.json');

const router = express.Router();

/** POST / { log }  => {log: { log }}
 *
 * log should be { userId, event, declaredTips, entityId }
 * 
 * userId and event are required
 * declaredTips and entityId are optional
 *
 * This returns the newly created log
 *  { log: { id, userId, event, timestamp, declaredTips, entity_id } }
 *
 * Authorization required: logged in
 **/

router.post('/', ensureLoggedIn, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, logNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const log = await Log.create(req.body);
    return res.status(201).json({ log });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { logs:[ { id, userId, displayName, firstName, LastName, role, isActive, event, timestamp, declaredTips, entity_id }...]}
 *
 * Can filter on provided optional search filters:
 * - userId
 * - event
 * - timestamp
 * - declaredTips
 * - entityId
 * - before (Return records with timestamp values < before)
 * - after (Return records with timestamp values > after)
 *       Note if both before and after are used they are connected by AND not OR
 * - desc (boolean, when true, sort in descending order)
 * 
 * Default sort is in ascending order by datetime
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
  const q = req.query;

  if (q.userId) q.userId = +q.userId;
  if (q.entityId) q.entityId = +q.entityId;
  if (q.desc) q.desc = q.desc.toLocaleLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, logSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const logs = await Log.findAll(q);
    return res.json({ logs });
  } catch (err) {
    return next(err);
  }
});

/** GET /:id  =>  { log }
 *
 *  Log is { id, userId, event, timestamp, declaredTips, entity_id }
 * 
 * Returns: {log: { id, userId, displayName, firstName, LastName, role, isActive, event, timestamp, declaredTips, entity_id }}
 *
 * Authorization required: LoggedIn
 */

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const log = await Log.get(req.params.id);
    return res.json({ log });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
