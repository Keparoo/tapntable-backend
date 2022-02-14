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
		roleId = 1,
		isActive = true
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
            display_name,
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

	static async findAll(searchFilters = {}) {
		let query = `SELECT id,
                        username,
                        pin,
                        display_name AS "displayName",
                        first_name AS "firstName",
                        last_name AS "lastName",
                        role_id AS "roleId",
                        is_active AS "isActive"
                    FROM users`;
		let whereExpressions = [];
		let queryValues = [];

		const {
			firstName,
			lastName,
			displayName,
			roleId,
			isActive
		} = searchFilters;

		// For each possible search term, add to whereExpressions and queryValues so
		// we can generate the right SQL

		if (firstName) {
			queryValues.push(`%${firstName}%`);
			whereExpressions.push(`first_name ILIKE $${queryValues.length}`);
		}

		if (lastName) {
			queryValues.push(`%${lastName}%`);
			whereExpressions.push(`last_name ILIKE $${queryValues.length}`);
		}

		if (displayName) {
			queryValues.push(`%${displayName}%`);
			whereExpressions.push(`display_name ILIKE $${queryValues.length}`);
		}

		if (roleId) {
			queryValues.push(roleId);
			whereExpressions.push(`role_id = $${queryValues.length}`);
		}

		if (isActive !== undefined) {
			queryValues.push(isActive);
			whereExpressions.push(`is_active = $${queryValues.length}`);
		}

		if (whereExpressions.length > 0) {
			query += ' WHERE ' + whereExpressions.join(' AND ');
		}

		// Finalize query and return results

		query += ' ORDER BY last_name';
		const usersRes = await db.query(query, queryValues);
		return usersRes.rows;
	}

	/** Given a username, return data about user.
   *
   * Returns { id, username, pin, displayName, firstName, lastName, role, isActive }
   *
   * Throws NotFoundError if user not found.
   **/

	static async get(username) {
		const userRes = await db.query(
			`SELECT id,
	            username,
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

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		// const userApplicationsRes = await db.query(
		// 	`SELECT a.job_id
		//        FROM applications AS a
		//        WHERE a.id = $1`,
		// 	[ id ]
		// );

		// user.applications = userApplicationsRes.rows.map((a) => a.job_id);
		return user;
	}

	/** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { username, password, pin, displayName, firstName, lastName, roleId, isActive }
   *
   * Returns { id, username, pin, displayName, firstName, lastName, role, isActive }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

	static async update(username, data) {
		if (data.password) {
			data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
		}

		const { setCols, values } = sqlForPartialUpdate(data, {
			displayName: 'display_name',
			firstName: 'first_name',
			lastName: 'last_name',
			roleId: 'role_id',
			isActive: 'is_active'
		});
		const usernameVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING id,
                                username,
                                pin,
                                display_name AS "displayName",
                                first_name AS "firstName",
                                last_name AS "lastName",
                                role_id AS "roleId",
                                is_active AS "isActive"`;
		const result = await db.query(querySql, [ ...values, username ]);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		delete user.password;
		return user;
	}

	/** Delete given user from database; returns undefined. */

	static async remove(username) {
		let result = await db.query(
			`DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
			[ username ]
		);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);
	}
}

module.exports = User;
