const Queue = require('./awsSqs');
const {
  aws
} = require('config');

module.exports = {
  requestsQueue: new Queue(aws.sqs.queues.requestsQueueUrl, aws.config.region),
  progressQueue: new Queue(aws.sqs.queues.progressQueueUrl, aws.config.region)
};
