// src/js/lib/kintoneapi.js

class KintoneAPI {
  constructor(apiToken = null) {
    this.apiToken = apiToken;
    this.baseUrl = kintone.api.baseUrl;
    this.retries = 3;
    this.timeout = 30000;
  }

  async call(method, path, body) {
    for (let i = 0; i < this.retries; i++) {
      try {
        return await this._makeRequest(method, path, body);
      } catch (err) {
        if (i === this.retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  _makeRequest(method, path, body) {
    return new Promise((resolve, reject) => {
      kintone.api(
        kintone.api.url(path, true),
        method,
        body,
        resolve,
        reject
      );
    });
  }

  async getRecords(appId, query = '', fields = []) {
    let allRecords = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const resp = await this.call('GET', '/k/v1/records', {
        app: appId,
        fields: fields.length ? fields : undefined,
        query: `${query} limit ${limit} offset ${offset}`.trim()
      });

      allRecords = allRecords.concat(resp.records);
      if (resp.records.length < limit) break;
      offset += limit;
    }

    return allRecords;
  }

  async createRecords(appId, records) {
    return this.call('POST', '/k/v1/records', {
      app: appId,
      records: records
    });
  }

  async updateRecords(appId, records) {
    return this.call('PUT', '/k/v1/records', {
      app: appId,
      records: records
    });
  }

  async deleteRecords(appId, ids) {
    return this.call('DELETE', '/k/v1/records', {
      app: appId,
      ids: ids
    });
  }

  async getApp(appId) {
    return this.call('GET', '/k/v1/app', {
      id: appId
    });
  }

  async createApp(name, description = '') {
    return this.call('POST', '/k/v1/apps', {
      name: name,
      description: description
    });
  }
}

export { KintoneAPI };