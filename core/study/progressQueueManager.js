'use strict';

// node modules
const prettyMs = require('pretty-ms');

// config
const config = require('config');
const getQueueMessageInterval = config.aws.sqs.options.getMessageInterval;

// libs
const Ems = require(`../../lib/ems-service`);
const log = require('../../lib/logger');

/* eslint-disable no-unused-vars */
const CsvExporter = require('../../lib/csvExporter');
const db = require('../../lib/db/db');
const redis = require('../../lib/redis');
const request = require('request-promise');
const s3 = require('../../lib/s3');
const { progressQueue } = require('../../lib/queues');
/* eslint-enable */

class ProgressQueueManager {
  /**
   * @param {db} db
   * @param {progressQueue} progressQueue
   * @param {redis} redis
   * @param {s3} s3
   * @param {request} request
   * @memberof ProgressQueueManager
   */
  constructor (db, progressQueue, redis, s3, request) {
    this._db = db;
    this._progressQueue = progressQueue;
    this._redis = redis;
    this._s3 = s3;
    this._csvExporter = new CsvExporter(db, s3, request);
  }

  async run () {
    this._running = true;
    this._consumeQueue();
  }

  async stop () {
    this._running = false;
  }

  async _consumeQueue () {
    try {
      let messages = (await this._progressQueue.getMessages()) || [];

      for (let message of messages) {
        const { created, loadId, messageId } = message;
        const validationKey = `validation_job_${loadId}`;

        // Locking or waiting for lock to be released
        while ((await redis.setnxAsync(`lock.${validationKey}`, Date.now() + 6e4)) === 0) {
          let lock = await redis.getAsync(`lock.${validationKey}`);
          let lockDuration = Number(lock) - Date.now();
          if (lockDuration > 0) {
            await new Promise(resolve => setTimeout(resolve, lockDuration));
          } else {
            await redis.delAsync(`lock.${validationKey}`);
          }
        }

        let validationProgress = await redis.getAsync(validationKey);
        validationProgress = JSON.parse(validationProgress);
        validationProgress.messagesCompleted.push(messageId);
        await redis.setAsync(validationKey, JSON.stringify(validationProgress));

        if (hasFinished(validationProgress)) {
          const tasks = [
            storeValidationHistory(this._db, validationProgress),
            sendEmsCompleteMessage(message),
            redis.delAsync(validationKey)
          ];

          if (validationProgress.validationParams.outputFormat === 'CSV') {
            const {
              divisionId,
              validationParams: { studyName, emails }
            } = validationProgress;
            const exportPromise = this._csvExporter.export(
              divisionId,
              emails,
              studyName
            );
            tasks.push(exportPromise);
          }

          await Promise.all(tasks);
          log.info(
            `Load ${loadId} validation completed for ${prettyMs(
              Date.now() - created
            )}`
          );
        }

        await this._progressQueue.deleteMessage(message);
        await redis.delAsync(`lock.${validationKey}`);
      }

      if (this._running) {
        setTimeout(this._consumeQueue.bind(this), getQueueMessageInterval);
      }
    } catch (error) {
      log.error(error);

      if (this._running) {
        setTimeout(this._consumeQueue.bind(this), getQueueMessageInterval);
      }
    }
  }
}

function hasFinished (validationProgress) {
  const { messagesCompleted, messagesAll } = validationProgress;

  const a = new Set(messagesAll);
  const b = new Set(messagesCompleted);
  const difference = new Set([...a].filter(x => !b.has(x)));

  return difference.size === 0;
}

async function sendEmsCompleteMessage (message) {
  let ems = new Ems(message.divisionId);
  ems.hostnameEMS = config.emsApiUrl;
  await ems.createEvent({
    parentEventId: null,
    eventTypeName: 'JEM_Action',
    description: `Load ${message.loadId} validation completed for ${prettyMs(
      Date.now() - message.created
    )}`,
    externalReferenceId: null,
    onBehalfOf: {
      userId: null,
      firstName: null,
      lastName: null,
      email: null,
      company: null,
      system: 'BVO'
    },
    title: `Load ${message.created} validation completed`,
    attachments: [],
    eventCustomProperties: {
      Priority: 'High',
      Action: 'Complete',
      State: 'Completed',
      ObjectID: message.jemData.taskId,
      ObjectType: 'Task',
      ObjectStatus: 'Successful',
      SendSubscription: 'Yes'
    },
    occuredAt: new Date().toISOString()
  });
}

async function storeValidationHistory (db, validationProgress) {
  await db.setupConnection(validationProgress.divisionId);
  return db.add('validationHistory', {
    studyName: validationProgress.validationParams.studyName,
    jobId: validationProgress.jemData.jobId,
    startAt: validationProgress.startAt,
    endAt: new Date()
  });
}

module.exports = ProgressQueueManager;
