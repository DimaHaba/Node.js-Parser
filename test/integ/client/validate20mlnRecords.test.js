const expect = require('chai').expect;
const request = require('request');
const config = require('config');

describe('Validation API for 20 mln records', function () {
  this.timeout(30 * 1000);
  let url = config.apiUrl + `/validateData?divisionId=${config.test.divisionId}`;
  const methods = {post: 'POST'};

  it(`Calls ${methods.post} ${url}, returns Success message`, (done) => {
    request.post({
      url: url,
      timeout: 0,
      json: {
        jobId: config.test.emsTask.jobId,
        taskId: config.test.emsTask.taskId,
        taskName: 'Test validation task',
        paramsForExecution: {
          studyId: config.test.studyIdFor20mlnRecords,
          emails: ['test@email.com'],
          subjectIds: config.test.subjectIdsFor20mlnRecords,
          validationTypes: ['SDTM', 'Adam'],
          outputFormat: 'CSV'
        }
      }
    }, (err, res, body) => {
      if (err) throw err;
      expect(body.message).is.eql('Success');
      done();
    });
  });
});
