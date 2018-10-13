'use strict';

const fastCsv = require('fast-csv');
const pump = require('pump');
const through = require('through2');
const log = require('./logger');

const config = require('config');
const attachmentsBucket = config.get('s3AttachmentsBucket');
const token = config.get('token');
const emailApiUrl = config.get('emailApiUrl');

/* eslint-disable no-unused-vars */
const request = require('request-promise');
const s3 = require('./s3');
const db = require('./db/db');
/* eslint-enable */

class CsvExporter {
  /**
   * @param {db} db
   * @param {s3} s3
   * @param {request} request
   * @memberof CsvExporter
   */
  constructor (db, s3, request) {
    this._db = db;
    this._s3 = s3;
    this._request = request;
  }

  /**
   * @param {number} divisionId
   * @param {string[]} emails
   * @param {string} studyName
   * @returns {void}
   * @memberof CsvExporter
   */
  async export (divisionId, emails, studyName) {
    await this._db.setupConnection(divisionId);
    const filename = `${new Date().toISOString()}_${studyName}_issues.csv`;
    const exportStream = await this._getCsvStream(studyName);

    await this._uploadAttachment(filename, exportStream);
    await this._sendEmail(divisionId, emails, studyName, filename);
  }

  /**
   * @param {string} key filename
   * @param {sting|Buffer|ReadableStream} body file contents
   * @returns {void}
   * @memberof CsvExporter
   */
  async _uploadAttachment (key, body) {
    try {
      const result = await this._s3
        .upload({
          Key: key,
          Bucket: attachmentsBucket,
          Body: body
        })
        .promise();
      log.info({ issuesReport: result }, 'Issues report uploaded to S3');
    } catch (err) {
      log.error(err, 'Failed to upload issues report to S3');
    }
  }

  /**
   * @param {number} divisionId
   * @param {string} studyName
   * @param {string[]} emails
   * @param {string} key filename
   * @returns {void}
   * @memberof CsvExporter
   */
  async _sendEmail (divisionId, emails, studyName, key) {
    try {
      const result = await this._request.post(emailApiUrl, {
        auth: {
          bearer: token
        },
        json: true,
        body: {
          body: '',
          divisionId,
          type: 'Email',
          addresses: emails,
          subject: `Validation report for ${studyName}`,
          attachments: [
            {
              bucket: attachmentsBucket,
              key,
              name: key
            }
          ]
        }
      });

      result.divisionId = divisionId;
      result.emails = emails;
      result.studyName = studyName;
      result.key = key;

      log.info(
        { issuesReportNotification: result },
        'Issues report sent via Email'
      );
    } catch (err) {
      log.error(err, 'Error while sending issues report via email');
    }
  }

  /**
   * @param {string} studyName
   * @returns {ReadableStream} stream with csv data
   * @memberof CsvExporter
   */
  async _getCsvStream (studyName) {
    const issuesStream = await this._getIssuesStream(studyName);
    const csvStream = fastCsv.createWriteStream({ headers: true });

    return pump(issuesStream, csvStream);
  }

  /**
   * @param {string} studyName
   * @returns {ReadableStream} stream with data from db
   * @memberof CsvExporter
   */
  async _getIssuesStream (studyName) {
    const studies = await this._db.getBy('studies', [{ studyName }]);
    const studyId = studies[0].id;
    const dbStream = this._db.getStreamBy('issues', [{ studyId }]).stream();

    const issuesStream = pump(
      dbStream,
      through.obj(function (row, enc, next) {
        try {
          const issues = JSON.parse(row.issues);
          for (let issue of issues) {
            this.push(issue);
          }
        } catch (err) {
          next(err);
        }
        next();
      })
    );

    return issuesStream;
  }
}

module.exports = CsvExporter;
