const expect = require('chai').expect;
const config = require('config');
const JEM = require('./../index.js');

describe('JEM API', function () {
  this.timeout(10000);
  let jemUrl = `${config.jemProtocol}://${config.jemHost}:${config.jemPort}` +
    (config.jemPath ? `/${config.jemPath}` : '');
  let jem = new JEM(jemUrl, config.conformToken, {timeout: config.jemTimeout});
  let lastJob, previousJob;

  it(`Calls getJob, returns Success message`, async () => {
    let job = await jem.getJob(config.divisionId, config.jobId);
    expect(job).is.an('object');
    expect(job.id).is.eql(config.jobId);
  });

  it(`Calls getJobsByType, returns Success message`, async () => {
    let jobs = await jem.getJobsByType(config.divisionId, config.jobTypeId);
    expect(jobs).is.an('array');
    let job = jobs[0];
    expect(job.jobTypeId).is.eql(config.jobTypeId);
  });

  it(`Calls getLastJobByType, returns Success message`, async () => {
    lastJob = await jem.getLastJobByType(config.divisionId, config.jobTypeId);
    expect(lastJob.jobTypeId).is.eql(config.jobTypeId);
    expect(lastJob.state).is.eql('Completed');
    expect(lastJob.status).is.eql('Successful');
  });

  it(`Calls getPreviousJobByType, returns Success message`, async () => {
    previousJob = await jem.getPreviousJobByType(config.divisionId, config.jobTypeId);
    expect(previousJob.jobTypeId).is.eql(config.jobTypeId);
    expect(previousJob.state).is.eql('Completed');
    expect(previousJob.status).is.eql('Successful');
    expect(lastJob.id).is.above(previousJob.id);
  });
});
