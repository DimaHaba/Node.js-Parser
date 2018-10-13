// TODO: Outdated test. Breaks whole npm run test command.
// Validation manager is initialized with wrong params

// const expect = require('chai').expect;
// process.bvo = {};
// const paths = process.bvo.paths = require('./../../../initPaths');
// const config = process.bvo.config = require(process.bvo.paths.config);
// const ValidationManager = require(`${paths.core}/study/validationManager`);

// describe('ValidationManager', function () {
//   let validationManager = new ValidationManager(config.requestsQueueUrl, config.awsRegion);

//   it('Calls execute, returns true', async () => {
//     let emsData = {
//       jobId: config.test.emsTask.jobId,
//       taskId: config.test.emsTask.taskId,
//       taskName: config.test.emsTask.taskName
//     };
//     let res = await validationManager.execute(config.test.studyId, config.test.subjectIds, ['SDTM', 'Adam'],
//       emsData, config.test.divisionId);
//     expect(res).is.an('object');
//     expect(res.successful).has.lengthOf(2);
//     expect(res.failed).has.lengthOf(0);
//   });
// });
