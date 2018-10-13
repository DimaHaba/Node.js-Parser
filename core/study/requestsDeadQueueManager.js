let Queue = require('../../lib/awsSqs');
const log = require('../../lib/logger');
let queue;

class RequestsDeadQueueManager {
  constructor (queueUrl, awsRegion, getQueueMessageInterval) {
    this.getQueueMessageInterval = getQueueMessageInterval;
    queue = new Queue(queueUrl, awsRegion);
  }

  run () {
    setInterval(async () => {
      try {
        let messages = await queue.getMessages();
        if (!messages) return;
        log.info(messages);
      } catch (error) {
        log.error(error);
      }
    }, this.getQueueMessageInterval);
    return true;
  }
}

module.exports = RequestsDeadQueueManager;
