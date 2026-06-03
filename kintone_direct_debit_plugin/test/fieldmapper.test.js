import { FieldMapper } from '../src/js/lib/fieldmapper.js';

describe('FieldMapper', () => {
  let fieldMapper;

  beforeEach(() => {
    fieldMapper = new FieldMapper();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createDefaultFieldConfig', () => {
    it('should create default field configuration with null app IDs', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null,
        companyMaster: null,
        seqMapping: null,
        fullResults: null,
        filteredResults: null,
        summary: null
      };

      const config = fieldMapper.createDefaultFieldConfig(appIds);

      expect(config.version).toBe('2.0.0');
      expect(config.apps.import).toBeNull();
      expect(config.apps.bankExport).toBeNull();
      expect(config.apps.bankResults).toBeNull();
      expect(config.apps.companyMaster).toBeNull();
      expect(config.apps.fullResults).toBeNull();
      expect(config.apps.filteredResults).toBeNull();
    });

    it('should set all required field codes', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null,
        companyMaster: null,
        seqMapping: null,
        fullResults: null,
        filteredResults: null
      };

      const config = fieldMapper.createDefaultFieldConfig(appIds);

      expect(config.fields.billDate).toBe('bill_date');
      expect(config.fields.billAmount).toBe('bill_amount');
      expect(config.fields.bankCode).toBe('bank_code');
      expect(config.fields.bankName).toBe('bank_name');
      expect(config.fields.branchCode).toBe('branch_code');
      expect(config.fields.branchName).toBe('branch_name');
      expect(config.fields.accountType).toBe('account_type');
      expect(config.fields.accountNo).toBe('account_no');
      expect(config.fields.customerName).toBe('customer_name');
      expect(config.fields.companyCode).toBe('company_code');
      expect(config.fields.companyName).toBe('company_name');
      expect(config.fields.lvCode).toBe('LVcode');
      expect(config.fields.seq).toBe('seq');
      expect(config.fields.transferType).toBe('transfer_type');
      expect(config.fields.result).toBe('result');
      expect(config.fields.dataLock).toBe('data_lock');
    });

    it('should initialize bank configuration structure', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null,
        companyMaster: null,
        seqMapping: null,
        fullResults: null,
        filteredResults: null
      };

      const config = fieldMapper.createDefaultFieldConfig(appIds);

      expect(config.bank).toBeDefined();
      expect(config.bank.bankCode).toBeDefined();
      expect(config.bank.bankNameKana).toBeDefined();
      expect(config.bank.branchCode).toBeDefined();
      expect(config.bank.branchNameKana).toBeDefined();
      expect(config.bank.accountTypeCode).toBeDefined();
      expect(config.bank.transferTypeValue).toBeDefined();
      expect(config.bank.csvEncoding).toBeDefined();
    });

    it('should set holiday configuration with defaults', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null,
        companyMaster: null,
        seqMapping: null,
        fullResults: null,
        filteredResults: null
      };

      const config = fieldMapper.createDefaultFieldConfig(appIds);

      expect(config.holidays.updateMethod).toBe('api');
      expect(config.holidays.excludeWeekends).toBe(true);
      expect(Array.isArray(config.holidays.manualList)).toBe(true);
    });

    it('should set advanced configuration', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null,
        companyMaster: null,
        seqMapping: null,
        fullResults: null,
        filteredResults: null
      };

      const config = fieldMapper.createDefaultFieldConfig(appIds);

      expect(config.advanced).toBeDefined();
      expect(config.advanced.batchSize).toBe(100);
      expect(config.advanced.autoLock).toBe(true);
      expect(config.advanced.defaultExportFormat).toBe('xlsx');
    });
  });

  describe('saveConfiguration', () => {
    it('should save configuration to localStorage', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null, bankExport: null },
        fields: { billDate: 'bill_date' }
      };

      const result = fieldMapper.saveConfiguration(config);

      expect(result).toBe(true);
      expect(localStorage.getItem('kintone_billing_config')).toBeDefined();
    });

    it('should store configuration as valid JSON', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null, bankExport: null },
        fields: { billDate: 'bill_date' }
      };

      fieldMapper.saveConfiguration(config);
      const stored = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(stored.version).toBe('2.0.0');
      expect(stored.apps.import).toBeNull();
    });

    it('should overwrite existing configuration', () => {
      const config1 = { version: '1.0.0', apps: { import: null } };
      const config2 = { version: '2.0.0', apps: { import: null } };

      fieldMapper.saveConfiguration(config1);
      fieldMapper.saveConfiguration(config2);
      const stored = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(stored.version).toBe('2.0.0');
    });
  });

  describe('loadConfiguration', () => {
    it('should load configuration from localStorage', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null },
        fields: { billDate: 'bill_date' }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      const loaded = fieldMapper.loadConfiguration();

      expect(loaded.version).toBe('2.0.0');
      expect(loaded.apps.import).toBeNull();
      expect(loaded.fields.billDate).toBe('bill_date');
    });

    it('should return null if no configuration exists', () => {
      const loaded = fieldMapper.loadConfiguration();

      expect(loaded).toBeNull();
    });

    it('should parse JSON correctly with complex objects', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null, bankExport: null },
        fields: { billDate: 'bill_date', bankCode: 'bank_code' },
        bank: { bankCode: 'TEST_CODE', branchCode: 'TEST_BRANCH' }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      const loaded = fieldMapper.loadConfiguration();

      expect(loaded.bank.bankCode).toBe('TEST_CODE');
      expect(loaded.bank.branchCode).toBe('TEST_BRANCH');
    });
  });

  describe('updateFieldMapping', () => {
    it('should update specific field mapping', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null },
        fields: { billDate: 'bill_date', bankCode: 'bank_code' }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      fieldMapper.updateFieldMapping('billDate', 'new_bill_date');
      const updated = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(updated.fields.billDate).toBe('new_bill_date');
    });

    it('should preserve other field mappings', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null },
        fields: { billDate: 'bill_date', bankCode: 'bank_code', amount: 'bill_amount' }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      fieldMapper.updateFieldMapping('billDate', 'updated_date');
      const updated = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(updated.fields.bankCode).toBe('bank_code');
      expect(updated.fields.amount).toBe('bill_amount');
    });

    it('should not affect other sections', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null },
        fields: { billDate: 'bill_date' },
        bank: { bankCode: 'CUSTOM_CODE' }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      fieldMapper.updateFieldMapping('billDate', 'new_date');
      const updated = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(updated.bank.bankCode).toBe('CUSTOM_CODE');
      expect(updated.version).toBe('2.0.0');
    });
  });

  describe('updateAppMapping', () => {
    it('should update app mapping with dynamic IDs', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null, bankExport: null }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      fieldMapper.updateAppMapping('import', 999);
      const updated = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(updated.apps.import).toBe(999);
    });

    it('should update app ID independently', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null, bankExport: null, fullResults: null }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      fieldMapper.updateAppMapping('bankExport', 888);
      const updated = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(updated.apps.bankExport).toBe(888);
      expect(updated.apps.import).toBeNull();
      expect(updated.apps.fullResults).toBeNull();
    });

    it('should handle any numeric app ID', () => {
      const config = {
        version: '2.0.0',
        apps: { import: null }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      
      const testIds = [1, 100, 999, 10000];
      testIds.forEach((id) => {
        fieldMapper.updateAppMapping('import', id);
        const updated = JSON.parse(localStorage.getItem('kintone_billing_config'));
        expect(updated.apps.import).toBe(id);
      });
    });

    it('should preserve other app IDs when updating one', () => {
      const config = {
        version: '2.0.0',
        apps: { import: 100, bankExport: 200, fullResults: 300 }
      };

      localStorage.setItem('kintone_billing_config', JSON.stringify(config));
      fieldMapper.updateAppMapping('bankExport', 250);
      const updated = JSON.parse(localStorage.getItem('kintone_billing_config'));

      expect(updated.apps.import).toBe(100);
      expect(updated.apps.bankExport).toBe(250);
      expect(updated.apps.fullResults).toBe(300);
    });
  });

  describe('Configuration Persistence', () => {
    it('should save and load configuration round-trip', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null,
        companyMaster: null,
        seqMapping: null,
        fullResults: null,
        filteredResults: null
      };

      const original = fieldMapper.createDefaultFieldConfig(appIds);
      fieldMapper.saveConfiguration(original);
      const loaded = fieldMapper.loadConfiguration();

      expect(loaded).toEqual(original);
    });

    it('should preserve all nested structures', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null,
        companyMaster: null,
        seqMapping: null,
        fullResults: null,
        filteredResults: null
      };

      const config = fieldMapper.createDefaultFieldConfig(appIds);
      fieldMapper.saveConfiguration(config);
      const loaded = fieldMapper.loadConfiguration();

      expect(loaded.bank).toEqual(config.bank);
      expect(loaded.holidays).toEqual(config.holidays);
      expect(loaded.fields).toEqual(config.fields);
      expect(loaded.advanced).toEqual(config.advanced);
    });

    it('should handle sequential updates', () => {
      const appIds = {
        import: null,
        bankExport: null,
        bankResults: null
      };

      const config = fieldMapper.createDefaultFieldConfig(appIds);
      fieldMapper.saveConfiguration(config);

      fieldMapper.updateAppMapping('import', 111);
      fieldMapper.updateAppMapping('bankExport', 222);
      fieldMapper.updateFieldMapping('billDate', 'custom_date');

      const loaded = fieldMapper.loadConfiguration();

      expect(loaded.apps.import).toBe(111);
      expect(loaded.apps.bankExport).toBe(222);
      expect(loaded.fields.billDate).toBe('custom_date');
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('kintone_billing_config', 'invalid json');
      
      expect(() => {
        fieldMapper.loadConfiguration();
      }).toThrow();
    });

    it('should handle missing configuration gracefully', () => {
      localStorage.removeItem('kintone_billing_config');
      const loaded = fieldMapper.loadConfiguration();

      expect(loaded).toBeNull();
    });
  });
});