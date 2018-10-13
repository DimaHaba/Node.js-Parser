const { Router } = require('express');
const router = Router();

const { version } = require('../../package');

router.get('/', (req, res, next) => {
  res.json({ version });
});

module.exports = router;
