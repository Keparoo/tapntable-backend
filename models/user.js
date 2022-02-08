'use strict';

const db = require('../db');
const bcrypt = require('bcrypt');
const { sqlForPartialUpdate } = require('../helpers/sql');
const {
	NotFoundError,
	BadRequestError,
	UnauthorizedError
} = require('../expressError');

const { BCRYPT_WORK_FACTOR } = require('../config.js');

/** Related functions for users. */

class User {
	/** authenticate user with username, password.
   *
   * Returns { id, username, pin, displayName, first_name, last_name, role, isActive }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

	static async authenticate(username, password) {
		// try to find the user first
		const result = await db.query(
			`SELECT id,
              username,
              password,
              pin,
              display_name AS "displayName",
              first_name AS "firstName",
              last_name AS "lastName",
              role_id AS "roleId",
              is_active AS "isActive"
           FROM users
           WHERE username = $1`,
			[ username ]
		);

		const user = result.rows[0];

		if (user) {
			// compare hashed password to a new hash from password
			const isValid = await bcrypt.compare(password, user.password);
			if (isValid === true) {
				delete user.password;
				return user;
			}
		}

		throw new UnauthorizedError('Invalid username/password');
	}

	/** Register user with data.
   *
   * Returns { id, username, pin, displayName, firstName, lastName, role, isActive }
   *
   * Throws BadRequestError on duplicates.
   **/

	static async register({
		username,
		password,
		pin,
		displayName,
		firstName,
		lastName,
		roleId,
		isActive
	}) {
		const duplicateCheck = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[ username ]
		);

		if (duplicateCheck.rows[0]) {
			throw new BadRequestError(`Duplicate username: ${username}`);
		}

		const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

		const result = await db.query(
			`INSERT INTO users
           (username,
            password,
            pin,
            display_name
            first_name,
            last_name,
            role_id,
            is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, username, pin, display_name AS "displayName", first_name AS "firstName", last_name AS "lastName", role_id AS "roleId", is_active AS "isActive"`,
			[
				username,
				hashedPassword,
				pin,
				displayName,
				firstName,
				lastName,
				roleId,
				isActive
			]
		);

		const user = result.rows[0];

		return user;
	}

	/** Find all users.
   *
   * Returns [{ id, username, pin, displayName, firstName, lastName, role, isActive }, ...]
   **/

	static async findAll() {
		const result = await db.query(
			`SELECT id,
              username,
              pin,
              display_name AS "displayName",
              first_name AS "firstName",
              last_name AS "lastName",
              role_id AS "roleId",
              is_active AS "isActive"
           FROM users
           ORDER BY id`
		);

		return result.rows;
	}

	/** Given a username, return data about user.
   *
   * Returns { id, username, pin, displayName, firstName, lastName, role, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

	// static async get(username) {
	// 	const userRes = await db.query(
	// 		`SELECT id,
	//                 username,
	//                 pin,
	//                 display_name AS "displayName",
	//                 first_name AS "firstName",
	//                 last_name AS "lastName",
	//                 role,
	//                 is_active AS "isActive"
	//          FROM users
	//          WHERE id = $1`,
	// 		[ id ]
	// 	);

	// 	const user = userRes.rows[0];

	// 	if (!user) throw new NotFoundError(`No user: ${username}`);

	// 	const userApplicationsRes = await db.query(
	// 		`SELECT a.job_id
	//          FROM applications AS a
	//          WHERE a.id = $1`,
	// 		[ id ]
	// 	);

	// 	user.applications = userApplicationsRes.rows.map((a) => a.job_id);
	// 	return user;
	// }

	/** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { pin, displayName, firstName, lastName, password, role, isActive }
   *
   * Returns { id, pin, displayName, firstName, lastName, role, isActive }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

	static async update(id, data) {
		if (data.password) {
			data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
		}

		const { setCols, values } = sqlForPartialUpdate(data, {
			firstName: 'first_name',
			lastName: 'last_name',
			isActive: 'is_active'
		});
		const idVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                                pin,
                                display_name AS "displayName",
                                first_name AS "firstName",
                                last_name AS "lastName",
                                role_id,
                                is_active AS "isActive"`;
		const result = await db.query(querySql, [ ...values, id ]);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${id}`);

		delete user.password;
		return user;
	}

	/** Delete given user from database; returns undefined. */

	static async remove(id) {
		let result = await db.query(
			`DELETE
           FROM users
           WHERE id = $1
           RETURNING id`,
			[ id ]
		);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${id}`);
	}

	/** Apply for job: update db, returns undefined.
   *
   * - id: id applying for job
   * - jobId: job id
   **/

	// static async applyToJob(username, jobId) {
	// 	const preCheck = await db.query(
	// 		`SELECT id
	//          FROM jobs
	//          WHERE id = $1`,
	// 		[ jobId ]
	// 	);
	// 	const job = preCheck.rows[0];

	// 	if (!job) throw new NotFoundError(`No job: ${jobId}`);

	// 	const preCheck2 = await db.query(
	// 		`SELECT username
	//          FROM users
	//          WHERE username = $1`,
	// 		[ username ]
	// 	);
	// 	const user = preCheck2.rows[0];

	// 	if (!user) throw new NotFoundError(`No username: ${username}`);

	// 	await db.query(
	// 		`INSERT INTO applications (job_id, username)
	//          VALUES ($1, $2)`,
	// 		[ jobId, username ]
	// 	);
	// }
}

module.exports = User;
