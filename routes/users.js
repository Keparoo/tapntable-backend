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
const userClockInSchema = require('../schemas/userClockIn.json');

const router = express.Router();

/** POST / { user }  => {user: { user, token }}
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be a manager or owner.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }, token }
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

/** GET / => { users: [ {id, username, pin, displayName, firstName, lastName, role, isClockedIn, isActive }, ... ] }
 *
 * Returns list of all users.
 * 
 * Can filter on provided optional search filters:
 * - firstNameLike (will find case-insensitive, partial matches)
 * - lastNameLike (will find case-insensitive, partial matches)
 * - displayNameLike (will find case-insensitive, partial matches)
 * - roleId
 * - isActive
 *
 * Authorization required: manager or owner (roleId = 10 or 11)
 **/

router.get('/', ensureManager, async function(req, res, next) {
  const q = req.query;
  if (q.roleId) q.roleId = +q.roleId;
  if (q.isClockedIn) q.isClockedIn = q.isClockedIn.toLowerCase() === 'true';
  if (q.isActive) q.isActive = q.isActive.toLowerCase() === 'true';

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
 * Authorization required: same user-as-:username or manager or owner (roleId = 10 or 11)
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
 * Authorization required: same user-as-:username or manager or owner (roleId = 10 or 11)
 **/

router.post('/timeclock', ensureCorrectUserOrManager, async function(
  req,
  res,
  next
) {
  try {
    const validator = jsonschema.validate(req.body, userClockInSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.body.id, req.body);
    delete user.username;
    delete user.firstName;
    delete user.lastName;
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

/** PATCH /[username] { user } => {user: { user }}
 *
 * Data can include:
 *   { username, password, pin, displayName, firstName, lastName, roleId, isClockedIn, isActive }
 *
 * Returns {user: { id, username, pin, displayName, firstName, lastName, roleId, isClockedIn, isActive }}
 *
 * Authorization required: manager or owner (roleId = 10 or 11)
 **/

router.patch('/:username', ensureManager, async function(req, res, next) {
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

module.exports = router;
