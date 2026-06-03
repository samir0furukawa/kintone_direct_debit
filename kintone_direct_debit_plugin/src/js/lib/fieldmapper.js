// src/js/config.js (Updated bank section)

(function() {
  'use strict';

  const DEFAULT_CONFIG = {
    version: '2.0.0',
    general: {
      enableImport: true,
      enableExport: true,
      enableCalendar: true,
      autoLock: true,
      batchSize: 100,
      defaultExportFormat: 'xlsx',
      targetViewId: '15929930'
    },
    apps: {
      import: null,
      bankExport: null,
      bankResults: null,
      companyMaster: null,
      seqMapping: null,
      fullResults: null,
      filteredResults: null,
      summary: null
    },
    fields: {
      billDate: 'bill_date',
      billAmount: 'bill_amount',
      bankCode: 'bank_code',
      bankName: 'bank_name',
      branchCode: 'branch_code',
      branchName: 'branch_name',
      accountType: 'account_type',
      accountNo: 'account_no',
      customerName: 'customer_name',
      companyCode: 'company_code',
      companyName: 'company_name',
      lvCode: 'LVcode',
      seq: 'seq',
      transferType: 'transfer_type',
      result: 'result',
      dataLock: 'data_lock',
      datePicker: 'datepicker',
      excludeFields: ['$id', '$revision', 'レコード番号', '更新者', '作成者', 'data_lock', 'bank_name']
    },
    bank: {
      bankCode: null,
      bankNameKana: null,
      branchCode: null,
      branchNameKana: null,
      companyUseCode: null,
      companyNameKana: null,
      accountTypeCode: null,
      bankAccountNo: null,
      csvEncoding: 'sjis',
      csvLineDelimiter: 'auto',
      transferTypeValue: '口座振替'
    },
    holidays: {
      updateMethod: 'api',
      apiUrl: 'https://holidays-jp.github.io/api/v1/date.json',
      autoRefresh: true,
      refreshFrequency: 7,
      excludeWeekends: true,
      additionalExclusionDays: [],
      manualList: ['2026-01-01']
    },
    advanced: {
      batchSize: 100,
      autoLock: true,
      defaultExportFormat: 'xlsx'
    }
  };

  function initTabs() {
    const tabButtons = document.querySelectorAll('.config-tab');
    const tabPanes = document.querySelectorAll('.config-tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabName = this.dataset.tab;

        tabButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        tabPanes.forEach(pane => pane.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
      });
    });
  }

  function loadConfiguration() {
    return new Promise(resolve => {
      kintone.plugin.app.getConfig(kintone.plugin.app.getId(), config => {
        const mergedConfig = Object.assign({}, DEFAULT_CONFIG, JSON.parse(config || '{}'));
        populateForm(mergedConfig);
        resolve(mergedConfig);
      });
    });
  }

  function populateForm(config) {
    if (config.general) {
      document.getElementById('enableImport').checked = config.general.enableImport;
      document.getElementById('enableExport').checked = config.general.enableExport;
      document.getElementById('enableCalendar').checked = config.general.enableCalendar;
      document.getElementById('autoLock').checked = config.general.autoLock;
      document.getElementById('batchSize').value = config.general.batchSize;
      document.getElementById('defaultExportFormat').value = config.general.defaultExportFormat;
      document.getElementById('targetViewId').value = config.general.targetViewId;
    }

    if (config.apps) {
      document.getElementById('appImport').value = config.apps.import || '';
      document.getElementById('appBankExport').value = config.apps.bankExport || '';
      document.getElementById('appBankResults').value = config.apps.bankResults || '';
      document.getElementById('appCompanyMaster').value = config.apps.companyMaster || '';
      document.getElementById('appSeqMapping').value = config.apps.seqMapping || '';
      document.getElementById('appFullResults').value = config.apps.fullResults || '';
      document.getElementById('appFilteredResults').value = config.apps.filteredResults || '';
      document.getElementById('appSummary').value = config.apps.summary || '';
    }

    if (config.fields) {
      document.getElementById('fieldBillDate').value = config.fields.billDate;
      document.getElementById('fieldBillAmount').value = config.fields.billAmount;
      document.getElementById('fieldBankCode').value = config.fields.bankCode;
      document.getElementById('fieldBankName').value = config.fields.bankName;
      document.getElementById('fieldBranchCode').value = config.fields.branchCode;
      document.getElementById('fieldBranchName').value = config.fields.branchName;
      document.getElementById('fieldAccountType').value = config.fields.accountType;
      document.getElementById('fieldAccountNo').value = config.fields.accountNo;
      document.getElementById('fieldCustomerName').value = config.fields.customerName;
      document.getElementById('fieldCompanyCode').value = config.fields.companyCode;
      document.getElementById('fieldCompanyName').value = config.fields.companyName;
      document.getElementById('fieldLVcode').value = config.fields.lvCode;
      document.getElementById('fieldSeq').value = config.fields.seq;
      document.getElementById('fieldTransferType').value = config.fields.transferType;
      document.getElementById('fieldResult').value = config.fields.result;
      document.getElementById('fieldDataLock').value = config.fields.dataLock;
      document.getElementById('excludeFields').value = config.fields.excludeFields.join('\n');
    }

    if (config.bank) {
      document.getElementById('bankCode').value = config.bank.bankCode || '';
      document.getElementById('bankNameKana').value = config.bank.bankNameKana || '';
      document.getElementById('branchCode').value = config.bank.branchCode || '';
      document.getElementById('branchNameKana').value = config.bank.branchNameKana || '';
      document.getElementById('companyUseCode').value = config.bank.companyUseCode || '';
      document.getElementById('companyNameKana').value = config.bank.companyNameKana || '';
      document.getElementById('accountTypeCode').value = config.bank.accountTypeCode || '';
      document.getElementById('bankAccountNo').value = config.bank.bankAccountNo || '';
      document.getElementById('csvEncoding').value = config.bank.csvEncoding;
      document.getElementById('csvLineDelimiter').value = config.bank.csvLineDelimiter;
      document.getElementById('transferTypeValue').value = config.bank.transferTypeValue;
    }

    if (config.holidays) {
      document.getElementById('holidayUpdateMethod').value = config.holidays.updateMethod;
      document.getElementById('holidayApiUrl').value = config.holidays.apiUrl;
      document.getElementById('autoRefreshHolidays').checked = config.holidays.autoRefresh;
      document.getElementById('refreshFrequency').value = config.holidays.refreshFrequency;
      document.getElementById('excludeWeekends').checked = config.holidays.excludeWeekends;
      document.getElementById('manualHolidayList').value = config.holidays.manualList.join('\n');
    }

    toggleHolidaySettings(config.holidays.updateMethod);
  }

  function getFormConfiguration() {
    return {
      version: DEFAULT_CONFIG.version,
      general: {
        enableImport: document.getElementById('enableImport').checked,
        enableExport: document.getElementById('enableExport').checked,
        enableCalendar: document.getElementById('enableCalendar').checked,
        autoLock: document.getElementById('autoLock').checked,
        batchSize: parseInt(document.getElementById('batchSize').value),
        defaultExportFormat: document.getElementById('defaultExportFormat').value,
        targetViewId: document.getElementById('targetViewId').value
      },
      apps: {
        import: parseInt(document.getElementById('appImport').value) || null,
        bankExport: parseInt(document.getElementById('appBankExport').value) || null,
        bankResults: parseInt(document.getElementById('appBankResults').value) || null,
        companyMaster: parseInt(document.getElementById('appCompanyMaster').value) || null,
        seqMapping: parseInt(document.getElementById('appSeqMapping').value) || null,
        fullResults: parseInt(document.getElementById('appFullResults').value) || null,
        filteredResults: parseInt(document.getElementById('appFilteredResults').value) || null,
        summary: parseInt(document.getElementById('appSummary').value) || null
      },
      fields: {
        billDate: document.getElementById('fieldBillDate').value,
        billAmount: document.getElementById('fieldBillAmount').value,
        bankCode: document.getElementById('fieldBankCode').value,
        bankName: document.getElementById('fieldBankName').value,
        branchCode: document.getElementById('fieldBranchCode').value,
        branchName: document.getElementById('fieldBranchName').value,
        accountType: document.getElementById('fieldAccountType').value,
        accountNo: document.getElementById('fieldAccountNo').value,
        customerName: document.getElementById('fieldCustomerName').value,
        companyCode: document.getElementById('fieldCompanyCode').value,
        companyName: document.getElementById('fieldCompanyName').value,
        lvCode: document.getElementById('fieldLVcode').value,
        seq: document.getElementById('fieldSeq').value,
        transferType: document.getElementById('fieldTransferType').value,
        result: document.getElementById('fieldResult').value,
        dataLock: document.getElementById('fieldDataLock').value,
        datePicker: document.getElementById('fieldDatePicker').value,
        excludeFields: document.getElementById('excludeFields').value.split('\n').filter(f => f.trim())
      },
      bank: {
        bankCode: document.getElementById('bankCode').value || null,
        bankNameKana: document.getElementById('bankNameKana').value || null,
        branchCode: document.getElementById('branchCode').value || null,
        branchNameKana: document.getElementById('branchNameKana').value || null,
        companyUseCode: document.getElementById('companyUseCode').value || null,
        companyNameKana: document.getElementById('companyNameKana').value || null,
        accountTypeCode: document.getElementById('accountTypeCode').value || null,
        bankAccountNo: document.getElementById('bankAccountNo').value || null,
        csvEncoding: document.getElementById('csvEncoding').value,
        csvLineDelimiter: document.getElementById('csvLineDelimiter').value,
        transferTypeValue: document.getElementById('transferTypeValue').value
      },
      holidays: {
        updateMethod: document.getElementById('holidayUpdateMethod').value,
        apiUrl: document.getElementById('holidayApiUrl').value,
        autoRefresh: document.getElementById('autoRefreshHolidays').checked,
        refreshFrequency: parseInt(document.getElementById('refreshFrequency').value),
        excludeWeekends: document.getElementById('excludeWeekends').checked,
        additionalExclusionDays: [],
        manualList: document.getElementById('manualHolidayList').value.split('\n').filter(d => d.trim())
      }
    };
  }

  function validateConfiguration(config) {
    const errors = [];

    if (config.general.batchSize < 10 || config.general.batchSize > 500) {
      errors.push('Batch size must be between 10 and 500');
    }

    if (config.bank.bankCode && config.bank.bankCode.length !== 4) {
      errors.push('Bank code must be 4 digits');
    }

    if (config.bank.branchCode && config.bank.branchCode.length !== 3) {
      errors.push('Branch code must be 3 digits');
    }

    return errors;
  }

  function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `config-status ${type}`;

    if (type !== 'error') {
      setTimeout(() => {
        statusEl.className = 'config-status';
      }, 3000);
    }
  }

  function saveConfiguration() {
    const config = getFormConfiguration();
    const errors = validateConfiguration(config);

    if (errors.length > 0) {
      showStatus(errors.join(', '), 'error');
      return;
    }

    kintone.plugin.app.setConfig(kintone.plugin.app.getId(), JSON.stringify(config), () => {
      showStatus('✓ Configuration saved successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    });
  }

  function resetConfiguration() {
    if (confirm('Reset all settings to default values?')) {
      populateForm(DEFAULT_CONFIG);
      showStatus('Settings reset to defaults', 'info');
    }
  }

  function toggleHolidaySettings(method) {
    document.getElementById('apiHolidaySettings').style.display = method === 'api' ? 'block' : 'none';
    document.getElementById('manualHolidaySettings').style.display = method === 'manual' ? 'block' : 'none';
  }

  window.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    await loadConfiguration();

    document.getElementById('saveBtn').addEventListener('click', saveConfiguration);
    document.getElementById('cancelBtn').addEventListener('click', () => window.history.back());
    document.getElementById('resetBtn').addEventListener('click', resetConfiguration);

    document.getElementById('holidayUpdateMethod').addEventListener('change', (e) => {
      toggleHolidaySettings(e.target.value);
    });

    document.getElementById('useSpace').addEventListener('change', (e) => {
      document.getElementById('spaceIdLabel').style.display = e.target.checked ? 'block' : 'none';
    });
  });
})();