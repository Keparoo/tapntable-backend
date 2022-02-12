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

/** POST / { log }  => { log }
 *
 * log should be { userId, event, entityId }
 *
 * This returns the newly created log
 *  { log: { id, userId, event, timestamp, entity_id } }
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
 *   { logs:[ { id, userId, event, timestamp, entity_id }...]}
 *
 * Can filter on provided optional search filters:
 * - userId
 * - type
 * - timestamp
 * - entityId
 *
 * Authorization required: LoggedIn
 */

router.get('/', ensureLoggedIn, async function(req, res, next) {
	const q = req.query;

	if (q.userId) q.userId = +q.userId;
	if (q.entityId) q.entityId = +q.entityId;

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
 *  Log is { log: { id, userId, event, timestamp, entity_id } }
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
