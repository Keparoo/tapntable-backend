'use strict';

/** Routes for user tickets. */

const jsonschema = require('jsonschema');
const express = require('express');

const {
	ensureManager,
	ensureCorrectUserOrManager
} = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');

const OrdItem = require('../models/ordItem');

const orderedNewSchema = require('../schemas/orderedNew.json');
const orderedSearchSchema = require('../schemas/orderedSearch.json');
const orderedUpdateSchema = require('../schemas/orderedUpdate.json');

const router = express.Router();

module.exports = router;
