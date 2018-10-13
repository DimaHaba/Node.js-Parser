'use strict';

const CsvExporter = require('../../../lib/csvExporter');
const from = require('from2');
const config = require('config');
const attachmentsBucket = config.get('s3AttachmentsBucket');
const emailApiUrl = config.get('emailApiUrl');
const { assert } = require('chai');
const ReadableStream = require('stream').Readable;

describe('csv-exporter', () => {
  const runners = [1, 1000, 10000];

  runners.forEach((number, index) => {
    it(`should export ${number} object(s)`, async () => {
      const db = {
        getBy (table, where) {
          assert.strictEqual(table, 'studies');
          assert.exists(where[0].studyName);
          return [{ id: 1 }];
        },
        getStreamBy (table, where) {
          assert.strictEqual(table, 'issues');
          assert.strictEqual(where[0].studyId, 1);
          return {
            stream: generateIssuesStream
          };
        },
        setupConnection (divisionId) {
          assert.strictEqual(divisionId, 14);
        }
      };
      const s3 = {
        upload (options) {
          assert.strictEqual(options.Bucket, attachmentsBucket);
          assert.instanceOf(options.Body, ReadableStream);
          return {
            promise () {}
          };
        }
      };
      const request = {
        post (url, options) {
          assert.strictEqual(url, emailApiUrl);
          const { body } = options;
          assert.isEmpty(body.body);
          assert.strictEqual(body.divisionId, 14);
          assert.deepEqual(body.addresses, ['test@email.com']);

          return {};
        }
      };
      const csvExporter = new CsvExporter(db, s3, request);
      await csvExporter.export(14, ['test@email.com'], 'TestStudyName');
    }).timeout(20 * 1000); // 10 seconds
  });
});

function generateIssuesStream (number) {
  return from.obj(function (size, next) {
    for (let i = 0; i < number; i++) {
      const issue = {
        issue: JSON.stringify({
          longDescription: 'Test description',
          patientName: '001-00001-' + i,
          priorityName: 'High',
          ruleId: '1',
          shortDescription: 'Failed for variable: STUDYID',
          title: 'Required value is missing'
        })
      };
      this.push(issue);
    }

    next(null, null);
  });
}
