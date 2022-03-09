'use strict';

/** Routes for users. */

const jsonschema = require('jsonschema');

const express = require('express');
const {
  ensureCorrectUserOrManager,
  ensureManager
} = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const User = require('../models/user');
const { createToken } = require('../helpers/tokens');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');
const userSearchSchema = require('../schemas/userSearch.json');
const userTimeclockSchema = require('../schemas/userTimeclock.json');

const router = express.Router();

/** POST / { user }  => {user: { user, token }}
 * 
 * Required fields: {username, password, pin, displayName, firstName, lastName, role}
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be a manager or owner.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }, token }
 *
 * Authorization required: manager or owner
 **/

router.post('/', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.username) req.body.username = req.body.username.trim();
    if (req.body.password) req.body.password = req.body.password.trim();
    if (req.body.displayName)
      req.body.displayName = req.body.displayName.trim();
    if (req.body.firstName) req.body.firstName = req.body.firstName.trim();
    if (req.body.lastName) req.body.lastName = req.body.lastName.trim();

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ {id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }, ... ] }
 *
 * Returns list of all users.
 * 
 * Can filter on provided optional search filters:
 * - firstNameLike (will find case-insensitive, partial matches)
 * - lastNameLike (will find case-insensitive, partial matches)
 * - displayNameLike (will find case-insensitive, partial matches)
 * - role,
 * - isClockedIn,
 * - isActive
 * - desc
 *
 * Authorization required: manager or owner
 **/

router.get('/', ensureManager, async function(req, res, next) {
  const q = req.query;
  if (q.isClockedIn) q.isClockedIn = q.isClockedIn.toLowerCase() === 'true';
  if (q.isActive) q.isActive = q.isActive.toLowerCase() === 'true';
  if (q.desc) q.desc = q.desc.toLowerCase() === 'true';

  try {
    const validator = jsonschema.validate(q, userSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const users = await User.findAll(q);
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /pin => {pin: { user }}
 * 
 * This route is for a user to locally identify themselves on a device.
 * The device must be logged in alread with username and password and thus must already have a token.
 * This route is used for users punching in or accessing the terminal for orders
 *
 * user is { id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }
 * 
 * Returns: {user: { id, pin, displayName, role, isClockedIn, isActive }}
 * 
 *
 * Authorization required: same user-as-:username or manager or owner
 **/

router.post('/pin', ensureCorrectUserOrManager, async function(req, res, next) {
  try {
    const user = await User.getUserFromPin(req.body.pin);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** POST /timeclock => {pin: { user }}
 * 
 * This is a special route for updating the isClockedIn field in the users table
 *
 * user is { id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }
 * 
 * Returns: {user: { id, pin, displayName, role, isClockedIn, isActive }}
 * 
 * Required: { userId, isClockedIn }
 * 
 * Authorization required: same user-as-:username or manager or owner
 **/

router.post('/timeclock', ensureCorrectUserOrManager, async function(
  req,
  res,
  next
) {
  try {
    const validator = jsonschema.validate(req.body, userTimeclockSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.timeclock(req.body.id, req.body);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => {user: { user }}
 *
 * user is { id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }
 * 
 * Returns: {user: { id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }}
 * 
 *
 * Authorization required: same user-as-:username or 'manager' or 'owner'
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

/** PATCH /[username] { user } => {user: { user }}
 *
 * Data can include:
 *   { username, password, pin, displayName, firstName, lastName, role, isClockedIn, isActive }
 *
 * Returns {user: { id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }}
 *
 * Authorization required: 'manager' or 'owner'
 **/

router.patch('/:username', ensureManager, async function(req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    if (req.body.username) req.body.username = req.body.username.trim();
    if (req.body.password) req.body.password = req.body.password.trim();
    if (req.body.displayName)
      req.body.displayName = req.body.displayName.trim();
    if (req.body.firstName) req.body.firstName = req.body.firstName.trim();
    if (req.body.lastName) req.body.lastName = req.body.lastName.trim();

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: 'manager' or 'owner'
 **/

router.delete('/:username', ensureManager, async function(req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
