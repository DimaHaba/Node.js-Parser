const config = require('config');
const Logger = require('@conform/logger');
const { StdoutOutput, FileOutput } = Logger.outputs;

const logConfig = config.get('log');
const name = config.get('code');
let { filename, folder, format, level, rotate } = logConfig;

let output = logConfig.output === 'file'
  ? new FileOutput(filename, folder, rotate)
  : new StdoutOutput();

const options = {
  name,
  level,
  format,
  output
};

const logger = new Logger(options);

module.exports = logger;
