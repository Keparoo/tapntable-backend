'use strict';

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const { UnauthorizedError } = require('../expressError');
const { MANAGER, OWNER } = require('../constants');

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, '').trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when user must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when user must be logged in as an a manager or owner (roleId >= 10).
 *
 *  If not, raises Unauthorized.
 */

function ensureManager(req, res, next) {
  try {
    if (
      !res.locals.user ||
      (res.locals.user.role !== MANAGER && res.locals.user.role !== OWNER)
    ) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must provide a valid token & be user matching
 *  username provided as route param.
 * 
 *  A manager or owner (roleId >= 10) will allow this route
 *
 *  If not, raises Unauthorized.
 */

function ensureCorrectUserOrManager(req, res, next) {
  try {
    const user = res.locals.user;
    if (
      !(
        user &&
        (user.username === req.params.username ||
          res.locals.user.role === MANAGER ||
          res.locals.user.role === OWNER)
      )
    ) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureManager,
  ensureCorrectUserOrManager
};
