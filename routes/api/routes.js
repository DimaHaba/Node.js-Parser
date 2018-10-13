const express = require('express');
const routes = express.Router();

const validateData = require('./validateData');
const version = require('./version');

routes.use('/validateData', validateData);
routes.use('/version', version);

module.exports = routes;
