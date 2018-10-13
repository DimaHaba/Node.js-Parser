const AWS = require('aws-sdk');
const uuid = require('uuid/v1');
const log = require('./logger');

class AwsSqs {
  constructor (queueUrl, region, options = {}) {
    options.maxNumberOfMessages = options.maxNumberOfMessages || 10;
    options.batchSendCount = options.batchSendCount || 10;
    options.connectTimeout = options.connectTimeout || 30000;
    options.timeout = options.timeout || 30000;
    this.options = options;
    this.queueUrl = queueUrl;
    AWS.config.update({ region: region });
    this.sqs = new AWS.SQS();
  }

  async sendMessage (body) {
    const params = {
      MessageBody: JSON.stringify(body),
      QueueUrl: this.queueUrl
    };

    let data = await this.sqs.sendMessage(params).promise();

    return data.MessageId;
  }

  /**
   * @param {Object[]} messages
   */
  async sendMessages (messages) {
    const parallel = [];

    while (messages.length > 0) {
      const chunk = messages.splice(0, this.options.batchSendCount);
      const params = {
        Entries: [],
        QueueUrl: this.queueUrl
      };

      for (let message of chunk) {
        const entry = {
          Id: uuid(),
          MessageBody: JSON.stringify(message)
        };

        params.Entries.push(entry);
      }
      
      parallel.push(this.sqs.sendMessageBatch(params).promise());
    }
    
    let promiseResult = await Promise.all(parallel);
    let res = {
      successful: [],
      failed: []
    };
    promiseResult.map(item => {
      res.successful = res.successful.concat(item.Successful);
      res.failed = res.failed.concat(item.Failed);
    });

    log.info({sqsMessage: res}, 'Sent messages to SQS');
    return res;
  }

  async getMessages () {
    const params = {
      MaxNumberOfMessages: this.options.maxNumberOfMessages,
      MessageAttributeNames: ['All'],
      QueueUrl: this.queueUrl,
      VisibilityTimeout: 60 * 60,
      WaitTimeSeconds: 0
    };

    const { Messages } = await this.sqs.receiveMessage(params).promise();
    if (!Messages || !Messages.length) return null;

    const messages = [];
    for (let message of Messages) {
      const { Body, ReceiptHandle } = message;
      const body = JSON.parse(Body);

      const processed = {
        ReceiptHandle,
        ...body
      };

      messages.push(processed);
    }

    log.info({sqsMessages: messages}, 'Got messages from SQS');
    return messages;
  }

  async deleteMessage (message) {
    const params = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: message.ReceiptHandle
    };
    return this.sqs.deleteMessage(params).promise();
  }
}

module.exports = AwsSqs;
