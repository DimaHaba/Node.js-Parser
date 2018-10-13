const RequestService = require(`../lib/request-service`);
const PlatformManagementService = require(`../lib/platform-management-service`);
const CacheManagerService = require(`../lib/cache-manager-service`);

class EMSService {
  constructor (divisionId) {
    this.divisionId = divisionId;
    this.hostnameEMS = null;
    this.EMSApplicationCode = process.env.EMS_APPLICATION_CODE;
  }

  async createEvent (postData) {
    if (this.hostnameEMS === null) {
      await this._setHostnameEMS();
    }

    let url = `${this.hostnameEMS}/api/events?divisionId=${this.divisionId}`;
    let headers = {
      'content-type': 'application/json'
    };

    let requestService = new RequestService(this.divisionId);
    let requestParams = {
      method: 'POST',
      url: url,
      headers: headers,
      data: postData,
      useErrorMessage: false,
      useWFToken: true
    };
    let result = await requestService.send(requestParams);
    return result;
  }

  async getEventTypes () {
    const path = '/api/event-types';
    const namespace = 'EmsEventTypes';
    const key = `WF_getEventTypes_${this.divisionId}`;

    let cacheManagerService = new CacheManagerService(this.divisionId);
    await cacheManagerService.createCLient();
    let result = await cacheManagerService.get(namespace, key, () => {
      return this._get(path);
    });
    cacheManagerService.destructor();

    return result;
  }

  async getEventById (eventId, removeEventProperties = true) {
    const path = `/api/events/${eventId}/extended`;
    let result = await this._get(path, true);

    if (result.eventCustomProperties) {
      return result;
    }

    let eventCustomProperties = {};
    result.eventProperties.forEach((eventCustomProperty) => {
      eventCustomProperties[eventCustomProperty.name] = eventCustomProperty.value;
    });

    if (removeEventProperties) {
      delete result.eventProperties;
    }

    result.eventCustomProperties = eventCustomProperties;
    return result;
  }

  async getEventTypeProrerties () {
    const path = '/api/property-types';
    const namespace = 'EmsPropertyTypes';
    const key = `WF_getEventTypeProrerties_${this.divisionId}`;

    let cacheManagerService = new CacheManagerService(this.divisionId);
    await cacheManagerService.createCLient();
    let result = await cacheManagerService.get(namespace, key, () => {
      return this._get(path);
    });
    cacheManagerService.destructor();

    return result;
  }

  async getEventWithHistoryById (eventId) {
    let result = await this._get(`/api/events/${eventId}/relationship`);
    return result;
  }

  async getHierarchyProperties (eventId) {
    let results = await this._get(`/api/events/${eventId}/hierarchy-properties`);

    results = results.map((result) => {
      return {
        levelId: result.levelId,
        value: result.value
      };
    });

    return results;
  }

  async getReportedSystems () {
    const path = '/api/reported-systems';
    let reportedSystems = await this._get(path);

    return reportedSystems;
  }

  async _get (path, master = null) {
    let headers = {};
    path = `${path}?divisionId=${this.divisionId}`;

    if (master !== null) {
      path += '&master=true';
    }

    if (this.hostnameEMS === null) {
      await this._setHostnameEMS();
    }

    let url = this.hostnameEMS + path;
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

  async _setHostnameEMS () {
    let platformManagementService = new PlatformManagementService(this.divisionId);
    let divisionApplicationInfo = await platformManagementService.getApplicationDivisionInfo(this.EMSApplicationCode);
    this.hostnameEMS = divisionApplicationInfo.apiHost;
    return divisionApplicationInfo.apiHost;
  }
}

module.exports = EMSService;
