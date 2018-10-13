const RequestService = require(`../lib/request-service`);
const CacheManagerService = require(`../lib/cache-manager-service`);

class PlatformManagementService {
  constructor (divisionId) {
    this.hostanamePM = process.env.HOSTNAME_PM;
    this.divisionId = divisionId;
    this.WFApplicationCode = process.env.WF_APPLICATION_CODE;
  }

  async getToken (credentials) {
    let url = `${this.hostanamePM}/api/login/applications/${this.WFApplicationCode}`;
    let headers = {
      'content-type': 'application/json',
      authorization: credentials
    };

    let requestService = new RequestService(this.divisionId);
    let requestParams = {
      method: 'POST',
      url: url,
      headers: headers,
      data: {},
      useErrorMessage: true
    };

    let result = await requestService.send(requestParams);
    return result;
  }

  async getAPIHostByApplicationCode (applicationCode) {
    let divisionInfo = await this.getApplicationDivisionInfo(applicationCode);
    return divisionInfo.apiHost;
  }

  async getDivisions (userId) {
    const path = `/api/login/users/${userId}/applications/${this.WFApplicationCode}/divisions`;
    const namespace = 'PmUserDivisions';
    const key = `WF_getDivisions_${userId}`;

    let cacheManagerService = new CacheManagerService(this.divisionId);
    await cacheManagerService.createCLient();
    let divisions = await cacheManagerService.get(namespace, key, () => {
      return this._get(path);
    });
    cacheManagerService.destructor();

    return divisions;
  }

  async getApplicationDivisionInfo (applicationCode) {
    const path = `/api/divisions/${this.divisionId}/applications/${applicationCode}/config`;
    const namespace = 'PmGetAppConfiguration';
    const key = `WF_getApplicationDivisionInfo_${applicationCode}_${this.divisionId}`;

    let cacheManagerService = new CacheManagerService(this.divisionId);
    await cacheManagerService.createCLient();
    let divisionInfo = await cacheManagerService.get(namespace, key, () => {
      return this._get(path);
    });
    cacheManagerService.destructor();

    return divisionInfo;
  }

  async getReportedCompanies () {
    const path = '/api/companies';
    const namespace = 'PmGetCompanies';
    const key = `WF_getReportedCompanies_${this.divisionId}`;

    let cacheManagerService = new CacheManagerService(this.divisionId);
    await cacheManagerService.createCLient();
    let reportedCompanies = await cacheManagerService.get(namespace, key, () => {
      return this._get(path);
    });
    cacheManagerService.destructor();

    return reportedCompanies;
  }

  async getUserInfo (userId) {
    const path = `/api/users/${userId}`;
    const namespace = 'PmGetUser';
    const key = `WF_getUserInfo_${userId}_${this.divisionId}`;

    let cacheManagerService = new CacheManagerService(this.divisionId);
    await cacheManagerService.createCLient();
    let userInfo = await cacheManagerService.get(namespace, key, () => {
      return this._get(path);
    });
    cacheManagerService.destructor();

    return userInfo;
  }

  async _get (path) {
    let headers = {};

    if (this.divisionId !== undefined) {
      path = `${path}?divisionId=${this.divisionId}`;
    }

    let url = this.hostanamePM + path;
    let requestParams = {
      method: 'GET',
      url: url,
      headers: headers,
      useErrorMessage: false,
      useWFToken: true
    };

    let requestService = new RequestService(this.divisionId);
    let result = await requestService.send(requestParams);

    return result;
  }
}

module.exports = PlatformManagementService;
