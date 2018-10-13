const IQService = require(`../../core/services/iq-service`);
const uuid = require('uuid/v4');

class ValidationManager {
  constructor (queue, redis) {
    this.queue = queue;
    this.redis = redis;
  }

  async execute (validationParams, jemData, divisionId) {
    const { subjectIds, outputFormat } = validationParams;

    if (outputFormat === 'IQ') {
      let iq = new IQService(divisionId, process.bvo);
      await iq.createBatch(jemData.jobId, subjectIds.length + 1);
    }

    const studyValidationMessage = this._composeStudyValidationMessage(validationParams, jemData, divisionId);
    const subjectValidationMessages = this._composeSubjectValidationMessages(validationParams, jemData, divisionId);
    const messages = [studyValidationMessage, ...subjectValidationMessages];

    await this._saveValidationData(messages, validationParams, jemData, divisionId);

    return this.queue.sendMessages(messages);
  }

  _composeStudyValidationMessage (validationParams, jemData, divisionId) {
    const { studyName, areaName, areaTypeName, validationTypes, subjectIds, outputFormat } = validationParams;

    const message = {
      studyName,
      areaName,
      areaTypeName,
      validationTypes,
      jemData,
      divisionId,
      created: Date.now(),
      loadId: jemData.jobId,
      initialSubjectsCount: subjectIds.length,
      messageId: uuid(),
      outputFormat,
      validationType: 'Study'
    };

    return message;
  }

  _composeSubjectValidationMessages (validationParams, jemData, divisionId) {
    const { studyName, areaName, areaTypeName, validationTypes, subjectIds, outputFormat } = validationParams;
    const messages = [];

    for (let subjectId of subjectIds) {
      messages.push({
        studyName,
        areaName,
        areaTypeName,
        subjectId,
        validationTypes,
        jemData,
        divisionId,
        created: Date.now(),
        loadId: jemData.jobId,
        initialSubjectsCount: subjectIds.length,
        messageId: uuid(),
        outputFormat,
        validationType: 'Subject'
      });
    }

    return messages;
  }

  _saveValidationData (messages, validationParams, jemData, divisionId) {
    const validationData = {
      startAt: new Date(),
      jemData,
      divisionId,
      validationParams,
      messagesAll: messages.map(({ messageId }) => messageId),
      messagesCompleted: []
    };

    return this.redis.set(`validation_job_${jemData.jobId}`, JSON.stringify(validationData));
  }
}

module.exports = ValidationManager;
