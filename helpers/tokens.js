const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const { TRAINEE } = require('../constants');

/** return signed JWT from user data. 
 * 
 * There should always be a role given. If for some reason
 * it is missing, 1: trainee will be assigned
 * This should not happen as 1 is the default in the postgresql db
 * 
*/

function createToken(user) {
  console.assert(
    user.role !== undefined,
    'createToken passed user without a role: Role will be set to trainee'
  );

  let payload = {
    username: user.username,
    role: user.role || TRAINEE
  };

  return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
