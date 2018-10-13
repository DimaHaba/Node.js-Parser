const ConformRequest = require('conform-request');

class JEM {
  constructor (jemUrl, conformToken, options = {}) {
    options.conformToken = conformToken;
    this.conformRequest = new ConformRequest(jemUrl, options);
  }

  async getJob (divisionId, jobId) {
    return await this.conformRequest.execute(`api/jobs/${jobId}?&divisionId=${divisionId}`, 'GET');
  }

  async getJobsByType (divisionId, jobTypeId) {
    return await this.conformRequest.execute(`api/jobs?filters[jobTypeId]=${jobTypeId}` +
      `&divisionId=${divisionId}`, 'GET');
  }

  async getLastJobByType (divisionId, jobTypeId) {
    return (await this.conformRequest.execute(`api/jobs?limit=1&offset=0&sortField=completedDate&sortOrder=-1&` +
      `filters[jobTypeId]=${jobTypeId}&divisionId=${divisionId}`, 'GET'))[0];
  }

  async getPreviousJobByType (divisionId, jobTypeId) {
    return (await this.conformRequest.execute(`api/jobs?limit=1&offset=1&sortField=completedDate&sortOrder=-1&` +
      `filters[jobTypeId]=${jobTypeId}&divisionId=${divisionId}`, 'GET'))[0];
  }
}

module.exports = JEM;
