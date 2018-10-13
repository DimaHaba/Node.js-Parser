class httpRequestError extends Error {
  constructor (message, additionalInfo) {
    super(`${message}. ${JSON.stringify(additionalInfo)}`);
    this.name = 'httpRequestError';
    this.additionalInfo = additionalInfo;
  }
}

module.exports = httpRequestError;
