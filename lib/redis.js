const Redis = require('redis');
const bluebird = require('bluebird');
const { redis: { protocol, host } } = require('config');
bluebird.promisifyAll(Redis.RedisClient.prototype);
bluebird.promisifyAll(Redis.Multi.prototype);
const redisUrl = `${protocol}://${host}`;

const redis = Redis.createClient(redisUrl, {
  retry_strategy: function (options) {
    if (options.error) return options.error;
  }
});

module.exports = redis;
