const { assert } = require('chai');
const ValidationManager = require('../../../../core/study/validationManager');

describe('Validation manager unit tests', function () {
  let queue, redis;
  /** @type {ValidationManager} */
  let validationManager;

  before(function () {
    redis = {
      async set (key, validationData) {
        assert.strictEqual(key, 'validation_job_8');
        assert.isString(validationData);

        validationData = JSON.parse(validationData);
        assert.isObject(validationData);
        assert.hasAllKeys(validationData, [
          'startAt',
          'jemData',
          'divisionId',
          'validationParams',
          'messagesAll',
          'messagesCompleted'
        ]);

        const { jemData, divisionId, validationParams, messagesAll, messagesCompleted } = validationData;
        assert.deepStrictEqual(jemData, { jobId: 8, taskId: 203, taskName: 'Test validation task' });
        assert.strictEqual(divisionId, '15');
        assert.deepStrictEqual(validationParams, {
          outputFormat: 'CSV',
          studyName: 'testStudySmall',
          subjectIds: ['001-00001-00001', '001-00001-00002'],
          validationTypes: ['SDTM']
        });
        assert.isArray(messagesAll);
        assert.isNotEmpty(messagesAll);
        for (let messageId of messagesAll) {
          assert.isString(messageId);
          assert.isNotEmpty(messageId);
        }
        assert.isArray(messagesCompleted);
        assert.isEmpty(messagesCompleted);

        return true;
      }
    };
    queue = {
      async sendMessages (messages) {
        return messages;
      }
    };

    validationManager = new ValidationManager(queue, redis);
  });

  it('execute', async function () {
    const validationParams = {
      outputFormat: 'CSV',
      studyName: 'testStudySmall',
      subjectIds: ['001-00001-00001', '001-00001-00002'],
      validationTypes: ['SDTM']
    };
    const jemData = {
      jobId: 8,
      taskId: 203,
      taskName: 'Test validation task'
    };
    const divisionId = '15';

    const result = await validationManager.execute(validationParams, jemData, divisionId);

    assert.isArray(result);
    assert.lengthOf(result, 3);

    const study = result[0];
    assert.doesNotHaveAnyKeys(study, 'subjectId');
    assert.strictEqual(study.validationType, 'Study');
    
    for (let i = 1; i < result.length; i++) {
      const subject = result[i];
      assert.strictEqual(subject.subjectId, `001-00001-0000${i}`);
      assert.strictEqual(subject.validationType, 'Subject');
    }

    for (let message of result) {
      assert.strictEqual(message.studyName, 'testStudySmall');
      assert.deepEqual(message.validationTypes, ['SDTM']);
      assert.deepEqual(message.jemData, { jobId: 8, taskId: 203, taskName: 'Test validation task' });
      assert.strictEqual(message.divisionId, '15');
      assert.isAbove(message.created, 1534226470347);
      assert.strictEqual(message.loadId, 8);
      assert.strictEqual(message.initialSubjectsCount, 2);
      assert.strictEqual(message.outputFormat, 'CSV');
    }
  });
});
