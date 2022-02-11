'use strict';

/* Express app backend for tapntable */

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const { NotFoundError } = require('./expressError');
const { authenticateJWT } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const itemsRoutes = require('./routes/items');
const categoriesRoutes = require('./routes/categories');
const destinationsRoutes = require('./routes/destinations');
const checksRoutes = require('./routes/checks');
const paymentsRoutes = require('./routes/payments');
const logsRoutes = require('./routes/logs');

const app = express();

app.use(express.json());
app.use(authenticateJWT);
app.use(morgan('tiny'));
app.use(cors());

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/items/categories', categoriesRoutes);
app.use('/items/destinations', destinationsRoutes);
app.use('/items', itemsRoutes);
app.use('/checks', checksRoutes);
app.use('/payments', paymentsRoutes);
app.use('/users/logs', logsRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function(req, res, next) {
	return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function(err, req, res, next) {
	if (process.env.NODE_ENV !== 'test') console.error(err.stack);
	const status = err.status || 500;
	const message = err.message;

	return res.status(status).json({
		error: { message, status }
	});
});

module.exports = app;
