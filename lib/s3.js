const aws = require('aws-sdk');
const config = require('config');

aws.config.update({ region: config.awsRegion });
const s3 = new aws.S3();

module.exports = s3;
