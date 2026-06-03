
(function () {
  'use strict';

  //────────────────────────────────────────────
  //  1. Inject Styles for Confirm + Progress UI
  //────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .kintone-custom-dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .kintone-custom-dialog { background: #fff; padding: 1.5em 2em; border-radius: 6px; max-width: 360px; text-align: center; font-family: sans-serif; box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
    .kintone-custom-dialog h3 { margin: 0 0 .75em; font-size: 1.05em; }
    .kintone-custom-dialog .summary { text-align: left; margin:.5em 0 1em; line-height:1.6; }
    .kintone-custom-dialog .summary div { display:flex; justify-content:space-between; }
    .kintone-custom-dialog button { margin: 0 .5em; padding: .5em 1.2em; background: #2684FF; border: none; border-radius: 4px; color: #fff; cursor: pointer; }
    .kintone-custom-dialog button.cancel { background: #999; }
    .kintone-custom-wait { position: fixed; inset: 0; background: rgba(255,255,255,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; z-index: 9999; }
    .kintone-custom-wait .wait-label { font-size: 1.2em; margin-bottom: .5em; }
    .kintone-custom-wait .progress-container { width: 50%; height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
    .kintone-custom-wait .progress-bar { height: 100%; background: #2684FF; width: 0%; transition: width .2s ease; }
    .kintone-custom-wait .progress-text { margin-top: .5em; font-size: .9em; color: #333; }
  `;
  document.head.appendChild(style);

  //────────────────────────────────────────────
  //  2. CSV Parsing & File Reading Helpers
  //────────────────────────────────────────────
  const APP_720_ID = 720;

  function readFileAsText(file, encoding) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, encoding);
    });
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 3) {
      return { records: [], totalRows: 0, importedRows: 0, notKouzaFurikae: 0 };
    }

    let seq = 1;
    function parseLine(L) {
      const out = []; let cur = '', inQ = false;
      for (let i = 0; i < L.length; i++) {
        const ch = L[i];
        if (ch === '"' && L[i+1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      out.push(cur.trim());
      return out;
    }

    if (lines[0].charCodeAt(0) === 0xFEFF) {
      lines[0] = lines[0].slice(1);
    }

    const dataLines = lines.slice(2);
    const totalRows = dataLines.length;
    const records = [];
    let notKouzaFurikae = 0;

    dataLines.forEach((L, index) => {
      const rowNum = index + 3;
      const vals = parseLine(L);

      if (vals.length < 5) return;
      const billDate = vals[3] ? vals[3].trim() : '';
      if (!billDate) return;

      const transferType = vals[4] ? vals[4].trim() : '';
      if (transferType !== '口座振替') {
        notKouzaFurikae++;
        return;
      }

      const rec = {};
      const companyCode = vals[0] ? vals[0].trim() : '';
      if (companyCode) rec.company_code = { value: companyCode };

      const companyName = vals[1] ? vals[1].trim() : '';
      if (companyName) rec.company_name = { value: companyName };

      const billAmountStr = vals[2] ? vals[2].trim() : '';
      if (billAmountStr) {
        const n = Number(billAmountStr.replace(/,/g, ''));
        if (!isNaN(n)) rec.bill_amount = { value: n };
      }

      rec.bill_date = { value: billDate };
      rec.SEQ = { value: String(seq++) };
      records.push(rec);
    });

    return {
      records,
      totalRows,
      importedRows: records.length,
      notKouzaFurikae
    };
  }

  //────────────────────────────────────────────
  //  3. Dialog Helpers
  //────────────────────────────────────────────
  function showConfirmDialog(message) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'kintone-custom-dialog-backdrop';
      const dlg = document.createElement('div');
      dlg.className = 'kintone-custom-dialog';
      dlg.innerHTML = `<div>${message}</div><div style="margin-top:1em;">
        <button class="ok">OK</button><button class="cancel">Cancel</button>
      </div>`;
      backdrop.appendChild(dlg);
      document.body.appendChild(backdrop);
      dlg.querySelector('button.ok').onclick = () => { backdrop.remove(); resolve(true); };
      dlg.querySelector('button.cancel').onclick = () => { backdrop.remove(); resolve(false); };
    });
  }

  function showSummaryDialog({ totalRows, importedRows, notKouzaFurikae }) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'kintone-custom-dialog-backdrop';
      const dlg = document.createElement('div');
      dlg.className = 'kintone-custom-dialog';
      dlg.innerHTML = `
        <h3>Import summary</h3>
        <div class="summary">
          <div><span>Total rows:</span><strong>${totalRows}</strong></div>
          <div><span>Imported rows:</span><strong>${importedRows}</strong></div>
          <div><span>Not 口座振替:</span><strong>${notKouzaFurikae}</strong></div>
        </div>
        <div><button class="ok">OK</button></div>
      `;
      backdrop.appendChild(dlg);
      document.body.appendChild(backdrop);
      dlg.querySelector('button.ok').onclick = () => { backdrop.remove(); resolve(); };
    });
  }

  //────────────────────────────────────────────
  //  4. Progress Overlay
  //────────────────────────────────────────────
  function showProgress() {
    const w = document.createElement('div');
    w.id = 'kintone-custom-progress';
    w.className = 'kintone-custom-wait';
    w.innerHTML = `<div class="wait-label">Processing…</div>
      <div class="progress-container"><div class="progress-bar"></div></div>
      <div class="progress-text">0%</div>`;
    document.body.appendChild(w);
  }
  function updateProgress(pct) {
    const bar = document.querySelector('.kintone-custom-wait .progress-bar');
    const txt = document.querySelector('.kintone-custom-wait .progress-text');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  }
  function hideProgress() {
    const w = document.getElementById('kintone-custom-progress');
    if (w) w.remove();
  }

  //────────────────────────────────────────────
  //  5. Main Kintone Event
  //────────────────────────────────────────────
  kintone.events.on('app.record.index.show', () => {
    const btn = document.querySelector('button.btn.search');
    if (!btn) return;

    btn.onclick = async () => {
      const ok = await showConfirmDialog('請求情報全て削除されます。よろしいでしょうか？\nThis will delete all records in App 720.\nContinue?');
      if (!ok) return;

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;

        showProgress();

        let parsed;
        try {
          const txt = await readFileAsText(file, 'Shift_JIS');
          parsed = parseCSV(txt);
        } catch (err) {
          hideProgress();
          return alert(err.message);
        }

        const { records, totalRows, importedRows, notKouzaFurikae } = parsed;

        // If nothing to import, show summary only
        if (importedRows === 0) {
          hideProgress();
          await showSummaryDialog({ totalRows, importedRows, notKouzaFurikae });
          return;
        }

        // --- Delete all existing records ---
        const allIds = [];
        let offset = 0, limit = 500;
        while (true) {
          const resp = await kintone.api(
            kintone.api.url('/k/v1/records', true),
            'GET',
            { app: APP_720_ID, fields: ['$id'], query: `limit ${limit} offset ${offset}` }
          );
          const ids = resp.records.map(r => r.$id.value);
          allIds.push(...ids);
          if (ids.length < limit) break;
          offset += limit;
        }

        for (let i = 0; i < allIds.length; i += 100) {
          await kintone.api(
            kintone.api.url('/k/v1/records', true),
            'DELETE',
            { app: APP_720_ID, ids: allIds.slice(i, i + 100) }
          );
          if (allIds.length > 0) {
            const pct = Math.floor(Math.min(i + 100, allIds.length) / allIds.length * 50);
            updateProgress(pct);
          }
        }
        if (allIds.length > 0) updateProgress(50);

        // --- Import new records ---
        for (let i = 0; i < records.length; i += 100) {
          await kintone.api(
            kintone.api.url('/k/v1/records', true),
            'POST',
            { app: APP_720_ID, records: records.slice(i, i + 100) }
          );
          const pct = 50 + Math.floor(Math.min(i + 100, records.length) / records.length * 50);
          updateProgress(pct);
        }

        hideProgress();

        // Final summary
        await showSummaryDialog({ totalRows, importedRows, notKouzaFurikae });
      };

      input.click();
    };
  });
})();
      