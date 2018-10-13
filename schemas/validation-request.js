const Joi = require('joi');

module.exports = Joi.object().keys({
    jobId: Joi.number(),
    taskId: Joi.number(),
    taskName: Joi.string(),
    paramsForExecution:{
        emails:Joi.required(),
        studyName: Joi.required(),
        subjectIds: Joi.required(),
        validationTypes: Joi.required(),
        outputFormat:Joi.required()
    }
})
