module.exports = {
  apiUrl: process.env.BVO_API_URL || 'https://conform5-api.dev.edetekapps.com/api',
  port: Number(process.env.APP_PORT) || 443,

  aws: {
    sqs: {
      queues: {
        requestsQueueUrl: process.env.BVO_REQUESTS_URL || 'https://sqs.us-east-1.amazonaws.com/022587608743/conform5-bvo-api-requests-queue',
        requestsDeadQueueUrl: process.env.BVO_SQS_DEAD_REQUESTS_URL || 'https://sqs.us-east-1.amazonaws.com/022587608743/conform5-bvo-api-requests-dead-letter-queue',
        progressQueueUrl: process.env.DVW_SQS_PROGRESS_URL || 'https://sqs.us-east-1.amazonaws.com/022587608743/conform5-dvw-api-progress-queue',
        progressDeadQueueUrl: process.env.DVW_SQS_DEAD_PROGRESS_URL || 'https://sqs.us-east-1.amazonaws.com/022587608743/conform5-dvw-api-progress-dead-letter-queue'
      }
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'con-re-hg1f42l8wqfj.nuwctg.0001.use1.cache.amazonaws.com',
  },
  log: {
    format: process.env.LOG_FORMAT || 'json'
  }
};
