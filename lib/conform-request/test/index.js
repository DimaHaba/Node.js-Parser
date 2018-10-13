const expect = require('chai').expect;
const config = require('config');
const ConformRequest = require('./../index');

describe('ConformRequest API', function () {
  this.timeout(10000);
  let conformRequestUrl = `${config.protocol}://${config.host}:${config.port}` +
    (config.path ? `/${config.path}` : '');
  let conformRequest = new ConformRequest(conformRequestUrl, {
    timeout: config.timeout,
    conformToken: config.conformToken
  });

  it(`Calls execute, returns Success message`, async () => {
    let job = await conformRequest.execute(`api/jobs/${config.jemJobId}?&divisionId=${config.divisionId}`, 'GET', config.jobTypeId);
    expect(job.Id).is.eql(config.jobId);
  });
});
