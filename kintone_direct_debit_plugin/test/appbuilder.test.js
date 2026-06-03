import { KintoneAppBuilder } from '../src/js/lib/appbuilder.js';

describe('KintoneAppBuilder', () => {
  let appBuilder;

  beforeEach(() => {
    appBuilder = new KintoneAppBuilder();
  });

  describe('createApp', () => {
    it('should create app with name and description', async () => {
      const result = await appBuilder.createApp('Test App', 'Test Description');

      expect(result.success).toBe(true);
      expect(result.appId).toBeDefined();
      expect(result.name).toBe('Test App');
      expect(result.createdAt).toBeDefined();
    });

    it('should create app with name only', async () => {
      const result = await appBuilder.createApp('Simple App');

      expect(result.success).toBe(true);
      expect(result.appId).toBeDefined();
      expect(result.name).toBe('Simple App');
    });

    it('should return different app IDs for multiple creations', async () => {
      const result1 = await appBuilder.createApp('App 1');
      const result2 = await appBuilder.createApp('App 2');

      expect(result1.appId).not.toBe(result2.appId);
    });

    it('should handle app creation with special characters', async () => {
      const result = await appBuilder.createApp('請求 App (Test)');

      expect(result.success).toBe(true);
      expect(result.name).toBe('請求 App (Test)');
    });

    it('should create app in specified space', async () => {
      const result = await appBuilder.createApp('Spaced App', 'Description', 123);

      expect(result.success).toBe(true);
      expect(result.appId).toBeDefined();
    });

    it('should handle app creation without space ID', async () => {
      const result = await appBuilder.createApp('No Space App', 'Description', null);

      expect(result.success).toBe(true);
      expect(result.appId).toBeDefined();
    });

    it('should include timestamp in creation result', async () => {
      const beforeTime = new Date();
      const result = await appBuilder.createApp('Timestamped App');
      const afterTime = new Date();

      expect(result.success).toBe(true);
      const createdAt = new Date(result.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should return error object on failure', async () => {
      const result = await appBuilder.createApp('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('addFields', () => {
    it('should add fields to app', async () => {
      const fields = [
        { code: 'name', type: 'SINGLE_LINE_TEXT', label: 'Name' },
        { code: 'email', type: 'SINGLE_LINE_TEXT', label: 'Email' }
      ];

      const result = await appBuilder.addFields(1, fields);

      expect(result.success).toBe(true);
      expect(result.fieldCount).toBe(2);
    });

    it('should handle empty field array', async () => {
      const result = await appBuilder.addFields(1, []);

      expect(result.success).toBe(true);
      expect(result.fieldCount).toBe(0);
    });

    it('should support different field types', async () => {
      const fields = [
        { code: 'text', type: 'SINGLE_LINE_TEXT', label: 'Text' },
        { code: 'number', type: 'NUMBER', label: 'Number' },
        { code: 'date', type: 'DATE', label: 'Date' },
        { code: 'checkbox', type: 'CHECK_BOX', label: 'Checkbox' }
      ];

      const result = await appBuilder.addFields(1, fields);

      expect(result.success).toBe(true);
      expect(result.fieldCount).toBe(4);
    });

    it('should add fields with configuration', async () => {
      const fields = [
        {
          code: 'company_code',
          type: 'SINGLE_LINE_TEXT',
          label: 'Company Code',
          config: { required: true, unique: 'ON' }
        }
      ];

      const result = await appBuilder.addFields(1, fields);

      expect(result.success).toBe(true);
      expect(result.fieldCount).toBe(1);
    });

    it('should return revision number', async () => {
      const fields = [
        { code: 'field1', type: 'SINGLE_LINE_TEXT', label: 'Field 1' }
      ];

      const result = await appBuilder.addFields(1, fields);

      expect(result.success).toBe(true);
      expect(result.revision).toBeDefined();
    });

    it('should handle field addition error', async () => {
      const fields = [
        { code: 'invalid', type: 'INVALID_TYPE', label: 'Invalid' }
      ];

      const result = await appBuilder.addFields(999, fields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deployApp', () => {
    it('should deploy app successfully', async () => {
      const result = await appBuilder.deployApp(1);

      expect(result.success).toBe(true);
    });

    it('should handle deployment of multiple apps', async () => {
      const result1 = await appBuilder.deployApp(1);
      const result2 = await appBuilder.deployApp(2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle invalid app ID', async () => {
      const result = await appBuilder.deployApp(999999);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('_buildFieldMap', () => {
    it('should build field map from array', () => {
      const fields = [
        { code: 'field1', type: 'SINGLE_LINE_TEXT', label: 'Field 1' },
        { code: 'field2', type: 'NUMBER', label: 'Field 2' }
      ];

      const fieldMap = appBuilder._buildFieldMap(fields);

      expect(fieldMap.field1).toBeDefined();
      expect(fieldMap.field1.type).toBe('SINGLE_LINE_TEXT');
      expect(fieldMap.field2.type).toBe('NUMBER');
    });

    it('should include field labels', () => {
      const fields = [
        { code: 'name', type: 'SINGLE_LINE_TEXT', label: 'Full Name' }
      ];

      const fieldMap = appBuilder._buildFieldMap(fields);

      expect(fieldMap.name.label).toBe('Full Name');
    });

    it('should include field config if present', () => {
      const fields = [
        {
          code: 'email',
          type: 'SINGLE_LINE_TEXT',
          label: 'Email',
          config: { required: true }
        }
      ];

      const fieldMap = appBuilder._buildFieldMap(fields);

      expect(fieldMap.email.config.required).toBe(true);
    });

    it('should handle fields without config', () => {
      const fields = [
        { code: 'text', type: 'SINGLE_LINE_TEXT', label: 'Text' }
      ];

      const fieldMap = appBuilder._buildFieldMap(fields);

      expect(fieldMap.text).toBeDefined();
      expect(fieldMap.text.type).toBe('SINGLE_LINE_TEXT');
    });

    it('should build empty map for empty array', () => {
      const fields = [];

      const fieldMap = appBuilder._buildFieldMap(fields);

      expect(Object.keys(fieldMap).length).toBe(0);
    });
  });

  describe('APP_TEMPLATES', () => {
    it('should have all required app templates', () => {
      expect(appBuilder.constructor.APP_TEMPLATES).toBeDefined();
      expect(appBuilder.constructor.APP_TEMPLATES.CSV_IMPORT).toBeDefined();
      expect(appBuilder.constructor.APP_TEMPLATES.BANK_EXPORT).toBeDefined();
      expect(appBuilder.constructor.APP_TEMPLATES.BANK_RESULTS).toBeDefined();
      expect(appBuilder.constructor.APP_TEMPLATES.COMPANY_MASTER).toBeDefined();
      expect(appBuilder.constructor.APP_TEMPLATES.FULL_RESULTS).toBeDefined();
      expect(appBuilder.constructor.APP_TEMPLATES.FILTERED_RESULTS).toBeDefined();
    });

    it('CSV_IMPORT template should have required fields', () => {
      const template = appBuilder.constructor.APP_TEMPLATES.CSV_IMPORT;

      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.fields).toBeDefined();
      expect(Array.isArray(template.fields)).toBe(true);
      expect(template.fields.length).toBeGreaterThan(0);
    });

    it('BANK_EXPORT template should have required fields', () => {
      const template = appBuilder.constructor.APP_TEMPLATES.BANK_EXPORT;

      expect(template.name).toBeDefined();
      expect(template.fields).toBeDefined();
      expect(template.fields.length).toBeGreaterThan(0);
    });

    it('templates should have consistent structure', () => {
      const templates = appBuilder.constructor.APP_TEMPLATES;

      Object.values(templates).forEach(template => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(Array.isArray(template.fields)).toBe(true);
      });
    });
  });

  describe('App Creation Workflow', () => {
    it('should create app and add fields', async () => {
      const appResult = await appBuilder.createApp('Workflow Test App');
      expect(appResult.success).toBe(true);

      const fields = [
        { code: 'field1', type: 'SINGLE_LINE_TEXT', label: 'Field 1' }
      ];
      const fieldResult = await appBuilder.addFields(appResult.appId, fields);

      expect(fieldResult.success).toBe(true);
    });

    it('should create app, add fields, and deploy', async () => {
      const appResult = await appBuilder.createApp('Full Workflow App');
      expect(appResult.success).toBe(true);

      const fields = [
        { code: 'name', type: 'SINGLE_LINE_TEXT', label: 'Name' },
        { code: 'amount', type: 'NUMBER', label: 'Amount' }
      ];
      const fieldResult = await appBuilder.addFields(appResult.appId, fields);
      expect(fieldResult.success).toBe(true);

      const deployResult = await appBuilder.deployApp(appResult.appId);
      expect(deployResult.success).toBe(true);
    });

    it('should handle multiple app creations in sequence', async () => {
      const apps = [];
      
      for (let i = 0; i < 3; i++) {
        const result = await appBuilder.createApp(`App ${i}`);
        expect(result.success).toBe(true);
        apps.push(result.appId);
      }

      expect(apps.length).toBe(3);
      expect(new Set(apps).size).toBe(3); // All unique
    });
  });

  describe('Error Scenarios', () => {
    it('should return error for invalid app ID on field addition', async () => {
      const fields = [
        { code: 'test', type: 'SINGLE_LINE_TEXT', label: 'Test' }
      ];

      const result = await appBuilder.addFields(-1, fields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for invalid app ID on deploy', async () => {
      const result = await appBuilder.deployApp(-1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle app creation with empty name', async () => {
      const result = await appBuilder.createApp('');

      expect(result.success).toBe(false);
    });
  });
});