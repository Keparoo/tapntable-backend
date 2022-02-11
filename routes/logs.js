'use strict';

/** Routes for user logs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const Log = require('../models/log');

const logNewSchema = require('../schemas/logNew.json');

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

module.exports = router;
