const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

/** return signed JWT from user data. */

function createToken(user) {
	console.assert(
		user.role_id !== undefined,
		'createToken passed user without role_id property'
	);

	let payload = {
		username: user.username,
		role: user.role_id || 0
	};

	return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
