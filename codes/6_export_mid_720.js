//export 中間データ and result exports to specific format

(function(){
  'use strict';

  // ────────────────────────────────────
  //  Config: per-App settings
  // ────────────────────────────────────
  const APPS = [
    {
      btnSelector: '.btn.export',
      appId:       722,
      filenameBase:'請求データ',
      exclude:     [3, 6, 7, 8, 10, 12, 14, 16]
    },
    {
      btnSelector: '#export725726',
      appId:       724,
      filenameBase:'入金明細_銀行情報',
      exclude:     [3, 6, 7, 8, 10, 12, 14, 16]
    },
    {
      btnSelector: '#btn_export1',
      appId:       725,
      filenameBase:'入金結果明細',
      exclude:     [2,5,6,7,10,12,14,18,20]
    },
    {
      btnSelector: '#btn_export2',
      appId:       726,
      filenameBase:'インポート専用',
      // for App 726 we'll ignore this exclude and do a custom column mapping
      exclude:     []
    }
  ];
  const VIEW_ID = 15929930;

  // ────────────────────────────────────
  //  Helpers (unchanged)
  // ────────────────────────────────────
  function showFormatDialog() {
    return new Promise(resolve => {
      const m = document.createElement('div');
      m.style.cssText = `
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        background:white; padding:20px; border:1px solid #ccc;
        box-shadow:0 2px 8px rgba(0,0,0,0.3); border-radius:8px;
        z-index:10000; text-align:center;
      `;
      m.innerHTML = `
        <h3 style="margin:0 0 10px">Export Format</h3>
        <label><input type="radio" name="fmt" value="xlsx" checked> Excel (.xlsx)</label><br>
        <label><input type="radio" name="fmt" value="csv"> CSV (.csv)</label><br><br>
        <button id="ok">OK</button>
        <button id="cancel">Cancel</button>
      `;
      document.body.append(m);
      m.querySelector('#ok').onclick = () => {
        const v = m.querySelector('input[name=fmt]:checked').value;
        m.remove(); resolve(v);
      };
      m.querySelector('#cancel').onclick = () => {
        m.remove(); resolve(null);
      };
    });
  }

  function loadXLSX() {
    return window.XLSX
      ? Promise.resolve()
      : new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload  = res;
          s.onerror = () => rej(new Error('XLSX load failed'));
          document.head.append(s);
        });
  }

  function flattenRecord(rec) {
    const out = {};
    for (const k in rec) {
      let v = rec[k]?.value !== undefined ? rec[k].value : rec[k];
      if (Array.isArray(v)) {
        v = v.length && v[0].value && typeof v[0].value === 'object'
          ? v.map(r => JSON.stringify(
              Object.fromEntries(
                Object.entries(r.value).map(([c,o]) => [c,o.value])
              )
            )).join(' | ')
          : v.map(i => (i?.value!==undefined ? i.value : i)).join(', ');
      }
      else if (v && typeof v === 'object') {
        v = v.name ?? v.code ?? v.text ?? JSON.stringify(v);
      }
      out[k] = v;
    }
    return out;
  }

  function filterColumns(records, excludeColumns) {
    if (!records.length) return [];
    const headers = Object.keys(records[0])
      .filter((_, idx) => !excludeColumns.includes(idx + 1));
    return records.map(r =>
      headers.reduce((o, h) => ((o[h] = r[h]), o), {})
    );
  }

  function convertToCSV(records) {
    if (!records.length) return '';
    const hdrs = Object.keys(records[0]);
    const esc = s => {
      const str = String(s).replace(/"/g,'""');
      return /[,"\n]/.test(str) ? `"${str}"` : str;
    };
    const lines = [
      hdrs.join(','),
      ...records.map(r => hdrs.map(h => esc(r[h] ?? '')).join(','))
    ];
    return lines.join('\r\n');
  }

  function convertToExcelBlob(records) {
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    return XLSX.write(wb, { bookType:'xlsx', type:'array' });
  }

  function triggerDownload(data, name) {
    const blob = data instanceof Blob
      ? data
      : new Blob([data], { type:'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function getTimestampedName(base, ext) {
    const d = new Date(), p = n => String(n).padStart(2,'0');
    const ts = d.getFullYear()
      + p(d.getMonth()+1) + p(d.getDate()) + '_'
      + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    return `${base}${ts}.${ext}`;
  }

  async function fetchAllRecords(appId) {
    let all = [], offset = 0, limit = 500;
    while (true) {
      const res = await kintone.api(
        kintone.api.url('/k/v1/records', true),
        'GET',
        { app: appId, query: `limit ${limit} offset ${offset}` }
      );
      all = all.concat(res.records);
      if (res.records.length < limit) break;
      offset += limit;
    }
    return all;
  }

  // ────────────────────────────────────
  //  Main binding
  // ────────────────────────────────────
  kintone.events.on('app.record.index.show', async ev => {
    if (ev.viewId !== VIEW_ID) return;

    APPS.forEach(cfg => {
      const btn = document.querySelector(cfg.btnSelector);
      if (!btn || btn.dataset.bound) return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', async () => {
        const fmt = await showFormatDialog();
        if (!fmt) return;

        // get raw + flattened records
        const raw  = await fetchAllRecords(cfg.appId);
        const flat = raw.map(flattenRecord);

        // special path for App 726
        if (cfg.appId === 726) {
          // two-row header definitions
          const header1 = ['区切','入金日付','入金先コード','入金先名','回収種別','入金額','手数料等'];
          const header2 = ['AR3080000','AR3080001','AR3080002','AR3080003','AR3080006','AR3080009','AR3080020'];
          // field‐to‐value mapping
          const fieldMap = [
            () => '*',
            r => r.bill_date || '',
            r => r.company_code || '',
            r => r.company_name || '',
            () => '0',
            r => r.bill_amount || '',
            () => '0'
          ];
          // build data rows as array of arrays
          const dataRows = flat.map(rec =>
            fieldMap.map(fn => fn(rec))
          );
          if (fmt === 'xlsx') {
            try { await loadXLSX(); }
            catch { return alert('XLSXライブラリの読み込みに失敗しました'); }
            const aoa = [ header1, header2, ...dataRows ];
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Export');
            const ab = XLSX.write(wb, { bookType:'xlsx', type:'array' });
            triggerDownload(ab, getTimestampedName(cfg.filenameBase, 'xlsx'));
          } else {
            // CSV: two header lines + data
            const esc = s => {
              const str = String(s).replace(/"/g,'""');
              return /[,"\n]/.test(str) ? `"${str}"` : str;
            };
            const lines = [
              header1.join(','),
              header2.join(','),
              ...dataRows.map(row => row.map(esc).join(','))
            ];
            const csv = lines.join('\r\n');
            const bom = new Uint8Array([0xEF,0xBB,0xBF]);
            triggerDownload(new Blob([bom, csv], { type:'text/csv;charset=utf-8;' }),
                            getTimestampedName(cfg.filenameBase, 'csv'));
          }
        }
        // default path for other apps
        else {
          const rows = filterColumns(flat, cfg.exclude);
          if (!rows.length) return alert('No records to export.');

          if (fmt === 'xlsx') {
            try { await loadXLSX(); }
            catch { return alert('XLSXライブラリの読み込みに失敗しました'); }
            const ab = convertToExcelBlob(rows);
            triggerDownload(ab, getTimestampedName(cfg.filenameBase, 'xlsx'));
          } else {
            const csvBody = convertToCSV(rows);
            const bom = new Uint8Array([0xEF,0xBB,0xBF]);
            triggerDownload(new Blob([bom, csvBody], { type:'text/csv;charset=utf-8;' }),
                            getTimestampedName(cfg.filenameBase, 'csv'));
          }
        }
      });
    });
  });

})();