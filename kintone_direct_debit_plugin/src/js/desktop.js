// src/js/desktop.js

(function() {
  'use strict';

  let CONFIG = {};
  const PLUGIN_ID = kintone.plugin.app.getId();
  const BASE_APP_ID = kintone.app.getId();

  function loadPluginConfig() {
    return new Promise(resolve => {
      kintone.plugin.app.getConfig(PLUGIN_ID, configData => {
        CONFIG = JSON.parse(configData || '{}');
        resolve(CONFIG);
      });
    });
  }

  function initializePluginUI() {
    setupEventListeners();
    updateDashboard();
  }

  function setupEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        switchSection(this.dataset.section);
      });
    });

    document.getElementById('useSpace').addEventListener('change', function() {
      document.getElementById('spaceIdLabel').style.display = this.checked ? 'block' : 'none';
    });
  }

  function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });

    const section = document.getElementById(sectionName);
    if (section) {
      section.classList.add('active');
    }

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.section === sectionName) {
        tab.classList.add('active');
      }
    });
  }

  function updateDashboard() {
    const configStatus = CONFIG.apps && CONFIG.apps.import ? '✓ Configured' : '⚠️ Not Configured';
    const appsCreated = CONFIG.apps ? Object.values(CONFIG.apps).filter(id => id).length : 0;

    document.getElementById('configStatus').innerHTML = `
      <p>Status: ${configStatus}</p>
      <p>Apps Created: ${appsCreated} / 7</p>
    `;
  }

  window.switchSection = switchSection;

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadPluginConfig();
      if (Object.keys(CONFIG).length > 0) {
        initializePluginUI();
      }
    } catch (err) {
      console.error('Plugin initialization failed:', err);
    }
  });
})();