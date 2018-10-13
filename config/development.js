module.exports = {
  aws: {
    sqs: {
      queues: {
        requestsQueueUrl: process.env.BVO_REQUESTS_URL || 'http://localhost:9324/queue/request',
        requestsDeadQueueUrl: process.env.BVO_SQS_DEAD_REQUESTS_URL || 'http://localhost:9324/queue/dead-request',
        progressQueueUrl: process.env.DVW_SQS_PROGRESS_URL || 'http://localhost:9324/queue/progress',
        progressDeadQueueUrl: process.env.DVW_SQS_DEAD_PROGRESS_URL || 'http://localhost:9324/queue/dead-progress'
      }
    }
  }
};
