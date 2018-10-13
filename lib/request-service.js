const https = require('https');
const http = require('http');
const URL = require('url');

const log = require('./logger');
const config = require('config');

class RequestService {
  constructor (divisionId) {
    this.divisionId = divisionId;
  }

  send (params) {
    return new Promise((resolve, reject) => {
      let {
        method,
        url,
        headers,
        data,
        useErrorMessage,
        useWFToken
      } = params;

      if (headers === undefined) {
        headers = {};
      }
      if ((method === 'POST' || method === 'PUT') && headers['Content-Type'] === undefined) {
        headers['Content-Type'] = 'application/json';
      }
      if (useWFToken === true) {
        headers['Authorization'] = `Bearer ${config.token}`;
      }

      let myURL = URL.parse(url);
      let path = myURL.pathname;
      if (myURL.search) {
        path += myURL.search;
      }

      let options = {
        method: method,
        hostname: myURL.hostname,
        path: path,
        headers: headers
      };

      if (myURL.port) {
        options.port = myURL.port;
      }

      let protocol = https;
      if (myURL.protocol === 'http:') {
        protocol = http;
      }
      options.timeout = 30000;

      let req = protocol.request(options, (res) => {
        let result = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          result += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200 && res.statusCode !== 201) {
            let code = 500;
            let message = 'Problem with external service';
            let additionalInfo = {
              requestOptions: options
            };
            let skipLog = false;

            if (useErrorMessage && res.statusCode < 500) {
              code = res.statusCode;
              try {
                result = JSON.parse(result);
                message = (result.message !== undefined) ? result.message : 'Something went wrong';
                additionalInfo = result.additionalInfo;
              } catch (error) {
                message = 'Problem with parsing error';
              }
            } else {
              // write logs
              let logObj = {
                code: res.statusCode,
                url: url,
                response: result
              };
              log.warn(logObj, 'workflow-backend:request', this.divisionId);
              skipLog = true;
            }

            return reject({
              code: code,
              message: message,
              additionalInfo: additionalInfo,
              skipLog: skipLog
            });
          }

          try {
            result = JSON.parse(result);
            resolve(result);
          } catch (error) {
            return reject(result);
          }
        });

        res.on('error', (error) => {
          return reject(error);
        });
      });

      req.on('error', (error) => {
        return reject(error);
      });

      if (data !== undefined) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  sendWithoutAnswer (params) {
    return new Promise((resolve, reject) => {
      let {
        method,
        url,
        headers,
        data,
        useWFToken
      } = params;

      if (headers === undefined) {
        headers = {};
      }
      if ((method === 'POST' || method === 'PUT') && headers['Content-Type'] === undefined) {
        headers['Content-Type'] = 'application/json';
      }
      if (useWFToken === true) {
        headers['Authorization'] = `Bearer ${config.token}`;
      }

      let myURL = URL.parse(url);
      let path = myURL.pathname;
      if (myURL.search) {
        path += myURL.search;
      }

      let options = {
        method: method,
        hostname: myURL.hostname,
        path: path,
        headers: headers
      };

      if (myURL.port) {
        options.port = myURL.port;
      }

      let protocol = https;
      if (myURL.protocol === 'http:') {
        protocol = http;
      }

      let req = protocol.request(options);

      if (data !== undefined) {
        req.write(JSON.stringify(data));
      }

      req.on('error', (error) => {
        reject({
          code: 500,
          message: error.message,
          logCategory: 'request'
        });
      });

      req.end(() => {
        resolve('success');
      });
    });
  }
}

module.exports = RequestService;
