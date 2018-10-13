const { Router } = require('express');
const Joi = require('joi');
const ValidationManager = require('../../core/study/validationManager');
const { requestsQueue } = require('../../lib/queues');
const redis = require('../../lib/redis');
const { validationRequestSchema } = require('../../schemas')
 
const validationManager = new ValidationManager(requestsQueue, redis);
const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const validationParams = req.body.paramsForExecution;
    const { error, value } = Joi.validate(validationParams, validationRequestSchema);
    if (error) {
      lof.error(error);
      return res.status(400).console.error({error: error.message});
    }
    console.log(value);

    const jemData = {
      jobId: req.body.jobId,
      taskId: req.body.taskId,
      taskName: req.body.taskName
    };

    let { outputFormat, emails } = validationParams;
    if (outputFormat === 'CSV') {
      if (!Array.isArray(emails) || emails.length === 0) {
        return res
          .status(400)
          .json({ message: 'Emails arrays is requier for csv output format' });
      }
    }

    await validationManager.execute(
      validationParams,
      jemData,
      req.query.divisionId
    );

    res.json({ message: 'Success' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
