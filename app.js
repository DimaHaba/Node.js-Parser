'use strict';

// node modules
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const request = require('request-promise');

// core
const ProgressQueueManager = require('./core/study/progressQueueManager');
const ProgressDeadQueueManager = require('./core/study/progressDeadQueueManager');
const RequestsDeadQueueManager = require('./core/study/requestsDeadQueueManager');

// lib
const log = require('./lib/logger');
const { progressQueue } = require('./lib/queues');
const Db = require('./lib/db/db');
const redis = require('./lib/redis');
const s3 = require('./lib/s3');

const config = require('config');
const routes = require('./routes/api/routes');

const db = new Db(redis);
const progressQm = new ProgressQueueManager(db, progressQueue, redis, s3, request);
progressQm.run();

const awsConfig = config.aws;
const requestsDqm = new RequestsDeadQueueManager(awsConfig.sqs.queues.requestsDeadQueueUrl, awsConfig.config.region, awsConfig.sqs.options.getMessageInterval);
requestsDqm.run();

const progressDqm = new ProgressDeadQueueManager(awsConfig.sqs.queues.progressDeadQueueUrl, awsConfig.config.region, awsConfig.sqs.options.getMessageInterval);
progressDqm.run();

const app = express();
app.use(morgan('combined'));

// set CORS headers to all responses
app.all('/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  res.header('Access-Control-Expose-Headers', 'Conform_token, Total_count');
  next();
});

// set security headers

app.use(helmet({noCache: true}));
app.use(bodyParser.json());

// url path for routes
app.use('/api', routes);

// error handler
app.use(async (err, req, res, next) => {
  if (!err.code) err.code = 404;
  if (!err.message || err.code === 500) err.message = 'Internal server error';
  let obj = {message: err.message};
  if (err.errors) obj.errors = err.errors;
  if (err.additionalInfo) obj.additionalInfo = err.additionalInfo;
  log.error(err);
  res.status(err.code).json(obj);
});

module.exports = app;
