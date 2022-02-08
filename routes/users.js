'use strict';

/** Routes for users. */

const jsonschema = require('jsonschema');

const express = require('express');
const {
	ensureCorrectUserOrManager,
	ensureManager,
	ensureLoggedIn
} = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const User = require('../models/user');
const { createToken } = require('../helpers/tokens');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be a manager or owner.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { id, username, pin, displayName, firstName, lastName, role, isActive }, token }
 *
 * Authorization required: manager or owner (RoleId = 10 or 11)
 **/

router.post('/', ensureManager, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, userNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.register(req.body);
		const token = createToken(user);
		return res.status(201).json({ user, token });
	} catch (err) {
		return next(err);
	}
});

/** GET / => { users: [ {id, username, pin, displayName, firstName, lastName, role, isActive }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: manager or owner (roleId = 10 or 11)
 **/

router.get('/', ensureManager, async function(req, res, next) {
	try {
		const users = await User.findAll();
		console.log(users);
		return res.json({ users });
	} catch (err) {
		return next(err);
	}
});

/** GET /[username] => { user }
 *
 * Returns { id, username, pin, displayName, firstName, lastName, role, isActive }
 * 
 *
 * Authorization required: same user-as-:username or manager or owner (roleId = 10 or 11)
 **/

router.get('/:username', ensureCorrectUserOrManager, async function(
	req,
	res,
	next
) {
	try {
		const user = await User.get(req.params.username);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { username, password, pin, firstName, lastName }
 *
 * Returns { id, username, displayName, firstName, lastName, role, isActive }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch('/:username', ensureCorrectUserOrManager, async function(
	req,
	res,
	next
) {
	try {
		const validator = jsonschema.validate(req.body, userUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.update(req.params.username, req.body);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: manager or owner (roleId = 10 or 11)
 **/

router.delete('/:username', ensureManager, async function(req, res, next) {
	try {
		await User.remove(req.params.username);
		return res.json({ deleted: req.params.username });
	} catch (err) {
		return next(err);
	}
});

/** POST /[username]/jobs/[id]  { state } => { application }
 *
 * Returns {"applied": jobId}
 *
 * Authorization required: admin or same-user-as-:username
 * */

router.post('/:username/jobs/:id', ensureCorrectUserOrManager, async function(
	req,
	res,
	next
) {
	try {
		const jobId = +req.params.id;
		await User.applyToJob(req.params.username, jobId);
		return res.json({ applied: jobId });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
