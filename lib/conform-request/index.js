const request = require('request');
const HttpRequestError = require('./httpRequestError');

class conformRequest {
  constructor (serviceUrl, options = {}) {
    this.serviceUrl = serviceUrl;
    options.timeout = options.timeout || 30000;
    this.options = options;
  }

  async execute (apiPath, method, json = {}) {
    return new Promise((resolve, reject) => {
      let requestOptions = {
        url: `${this.serviceUrl}/${apiPath}`,
        timeout: this.options.timeout,
        json: json
      };
      if (this.options.conformToken) requestOptions.headers = {'Authorization': `Bearer ${this.options.conformToken}`};

      request[method.toLowerCase()](requestOptions, (err, res, body) => {
        if (err) return reject(err);
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          let additionalInfo = {
            requestOptions: requestOptions,
            responseStatusCode: res.statusCode,
            responseHeaders: res.headers,
            body: body
          };
          let httpRequestErr = new HttpRequestError(`Http request error`, additionalInfo);
          return reject(httpRequestErr);
        }
        resolve(body);
      });
    });
  }
}

module.exports = conformRequest;
