#!/bin/bash
#cd /edetek/bvo-api
#npm --prefix /edetek/bvo-api install
#source /home/ec2-user/.bashrc
#sudo BVO_TOKEN=$BATCH_TOKEN BVO_PROTOCOL='https' BVO_HOST=$COMMON_API_LINK BVO_PORT=8081 NODE_ENV=production SQS_REQUESTS_URL='https://sqs.us-east-1.amazonaws.com/022587608743/conform5-bvo-api-requests-queue' SQS_DEAD_REQUESTS_URL='https://sqs.us-east-1.amazonaws.com/022587608743/conform5-bvo-api-requests-dead-letter-queue' SQS_DEAD_REPORT_URL='https://sqs.us-east-1.amazonaws.com/022587608743/conform5-dvw-api-report-dead-letter-queue' SQS_PROGRESS_URL='https://sqs.us-east-1.amazonaws.com/022587608743/conform5-imw-api-progress-queue' SQS_DEAD_PROGRESS_URL='https://sqs.us-east-1.amazonaws.com/022587608743/conform5-imw-api-progress-dead-letter-queue' REDIS_HOST='con-re-hg1f42l8wqfj.nuwctg.0001.use1.cache.amazonaws.com' LOG_FORMAT='json' pm2 start ./bin/www --node-args="--max-old-space-size=24576" -n "bvo-api" -i 0
cd /edetek
sudo PORT=8081 pm2 start ecosystem.config.js
pm2 save
pm2 startup
