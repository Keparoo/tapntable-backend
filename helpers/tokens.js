const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

/** return signed JWT from user data. 
 * 
 * There should always be a role given. If for some reason
 * it is missing, 1: trainee will be assigned
 * This should not happen as 1 is the default in the postgresql db
 * 
*/

function createToken(user) {
	console.assert(
		user.roleId !== undefined,
		'createToken passed user without role_id property of trainee'
	);

	let payload = {
		username: user.username,
		roleId: user.roleId || 1
	};

	return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
