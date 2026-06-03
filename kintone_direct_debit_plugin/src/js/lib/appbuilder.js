// src/js/lib/appbuilder.js

class KintoneAppBuilder {
  constructor(apiToken = null) {
    this.apiToken = apiToken;
    this.baseUrl = kintone.api.baseUrl;
  }

  async createApp(name, description = '', spaceId = null) {
    try {
      const params = {
        name: name,
        description: description
      };

      if (spaceId) {
        params.spaceId = spaceId;
      }

      const response = await this._restApi('POST', '/k/v1/apps', params);

      return {
        success: true,
        appId: response.app,
        name: name,
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('Failed to create app:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async addFields(appId, fields) {
    try {
      const fieldMap = this._buildFieldMap(fields);

      const response = await this._restApi('POST', '/k/v1/app/form/fields', {
        app: appId,
        properties: fieldMap
      });

      return {
        success: true,
        revision: response.revision,
        fieldCount: Object.keys(fieldMap).length
      };
    } catch (err) {
      console.error('Failed to add fields:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async deployApp(appId) {
    try {
      await this._restApi('POST', '/k/v1/app/deploy', {
        apps: [{ app: appId }]
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to deploy app:', err);
      return { success: false, error: err.message };
    }
  }

  _buildFieldMap(fields) {
    const fieldMap = {};

    fields.forEach(field => {
      fieldMap[field.code] = {
        type: field.type,
        label: field.label,
        ...field.config
      };
    });

    return fieldMap;
  }

  _restApi(method, path, body) {
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
}

export { KintoneAppBuilder };