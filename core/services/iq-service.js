'use strict';

const Iq = require('@conform/iq');
const { iqApiUrl, token, apiUrl } = require('config');
class IQService {
  /**
   * Creates a new instance of IQ Service.
   * @param {Number} divisionId - id of the division that is used to run the CB.
   * @param token - bvo service.
   */
  constructor(divisionId) {
    this.iq = new Iq(divisionId, iqApiUrl + '/api', 'Bearer ' + token, apiUrl);
  }

  /**
   * Creates a new batch in IQ
   * @param {Number} jobId - jobId that triggered the CB run.
   * @param {Number} numberOfCommits - number of commits in a run.
   * @returns {Promise} Result of the API call.
   */
  async createBatch (jobId, numberOfCommits) {
    return await this.iq.createBatch(jobId, numberOfCommits);
  }
}

module.exports = IQService;
