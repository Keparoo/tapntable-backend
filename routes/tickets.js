'use strict';

/** Routes for user tickets. */

const jsonschema = require('jsonschema');
const express = require('express');

const { ensureManager, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const Ticket = require('../models/ticket');

const ticketNewSchema = require('../schemas/ticketNew.json');
const ticketSearchSchema = require('../schemas/ticketSearch.json');

const router = express.Router();

module.exports = router;
