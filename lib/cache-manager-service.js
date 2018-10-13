const redis = require('redis');

const log = require('./logger');

class CacheManagerService {
  constructor(divisionId) {
    this.divisionId = divisionId;
    this.client = {
      connected: false
    };
  }

  createCLient() {
    return new Promise((resolve) => {
      let options = {
        retry_strategy: () => {
          resolve('success');
          return false;
        }
      };

      if (process.env.REDIS_HOST !== undefined) {
        options.host = process.env.REDIS_HOST;
      }
      if (process.env.REDIS_PORT !== undefined) {
        options.port = process.env.REDIS_PORT;
      }
      if (process.env.REDIS_PASSWORD !== undefined) {
        options.password = process.env.REDIS_PASSWORD;
      }

      this.client = redis.createClient(options);
      this.client.on('connect', () => {
        resolve('success');
      });
    });
  }

  async get(namespace, key, callback) {
    let compositeKey = namespace + ':' + key;
    let result = null;

    result = await this._getAsync(compositeKey);
    if (result === null) {
      result = await callback();
      this._setAsync(compositeKey, result);
    }

    return result;
  }

  async set(namespace, key, data) {
    if (!this.client.connected) {
      return null;
    }

    let compositeKey = namespace + ':' + key;
    let result = this._setAsync(compositeKey, data);
    return result;
  }

  _getAsync(key) {
    return new Promise((resolve) => {
      if (!this.client.connected) {
        return resolve(null);
      }

      this.client.get(key, (err, result) => {
        if (err) {
          log.warn(err, 'workflow-backend:cache', this.divisionId);
          return resolve(null);
        }
        result = JSON.parse(result);
        resolve(result);
      });
    });
  }

  _setAsync(key, data) {
    return new Promise((resolve) => {
      if (!this.client.connected) {
        return resolve(null);
      }

      data = JSON.stringify(data);
      this.client.set(key, data, (err, result) => {
        if (err) {
          log.warn(err, 'workflow-backend:cache', this.divisionId);
          return resolve(null);
        }
        resolve(result);
      });
    });
  }

  destructor() {
    if (this.client.connected) {
      this.client.quit();
    }
  }
}

module.exports = CacheManagerService;