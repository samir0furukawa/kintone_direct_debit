(function () {
  'use strict';

  const SOURCE_APP_ID      = 722;
  const DESTINATION_APP_ID = 723;
  const VIEW_ID            = '15929930';
  const BUTTON_SELECTOR    = 'button.btn.output';
  const RELEASE_SELECTOR   = 'button.btn.lockrelese';

  const ERROR_LINK =
    `https://x.cybozu.com/k/722/?view=20&q=f15929871%20%3D%20%22%22#sort_0=f15929861&order_0=desc&size=20`;

  // inject styles
  const style = document.createElement('style');
  style.textContent = `
    /* dialog backdrop */
    .kintone-custom-dialog-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .kintone-custom-dialog {
      background: #fff; padding: 1.5em 2em; border-radius: 6px;
      max-width: 320px; text-align: center; font-family: sans-serif;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }
    .kintone-custom-dialog button {
      margin-top: 1em; padding: .5em 1.2em;
      background: #2684FF; border: none; border-radius: 4px;
      color: #fff; cursor: pointer;
    }
    .kintone-custom-dialog a {
      display: block; margin-top: .5em; color: #2684FF;
      text-decoration: underline;
    }
    /* progress overlay */
    .kintone-custom-wait {
      position: fixed; inset: 0;
      background: rgba(255,255,255,0.9);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: sans-serif; z-index: 9999;
    }
    .kintone-custom-wait .wait-label {
      font-size: 1.2em; margin-bottom: .5em;
    }
    .kintone-custom-wait .progress-container {
      width: 50%; height: 6px;
      background: #eee; border-radius: 3px; overflow: hidden;
    }
    .kintone-custom-wait .progress-bar {
      height: 100%; background: #2684FF; width: 0; transition: width .2s ease;
    }
    .kintone-custom-wait .progress-text {
      margin-top: .5em; font-size: .9em; color: #333;
    }
  `;
  document.head.appendChild(style);

  // override native alert
  window.alert = msg => showDialog(msg);

  // padding helpers
  const padLeft  = (v, len, ch = '0') => (ch.repeat(len) + (v || '')).slice(-len);
  const padRight = (v, len, ch = ' ') => ((v || '') + ch.repeat(len)).slice(0, len);

  // show / hide spinner
  function showWaiting(text = '処理中…') {
    if (document.querySelector('.kintone-custom-wait')) return;
    const div = document.createElement('div');
    div.className = 'kintone-custom-wait';
    div.innerHTML = `
      <div class="wait-label">${text}</div>
      <div class="progress-container">
        <div class="progress-bar"></div>
      </div>
      <div class="progress-text">0%</div>
    `;
    document.body.appendChild(div);
  }
  function hideWaiting() {
    const div = document.querySelector('.kintone-custom-wait');
    if (div) div.remove();
  }
  function setProgress(pct, label) {
    const bar = document.querySelector('.progress-bar');
    const txt = document.querySelector('.progress-text');
    const lbl = document.querySelector('.wait-label');
    if (bar) bar.style.width = `${Math.min(100, pct)}%`;
    if (txt) txt.textContent = `${Math.floor(pct)}%`;
    if (lbl && label) lbl.textContent = label;
  }

  // modal dialog
  function showDialog(message) {
    if (document.querySelector('.kintone-custom-dialog-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'kintone-custom-dialog-backdrop';
    backdrop.innerHTML = `
      <div class="kintone-custom-dialog">
        <div>${message.replace(/\n/g,'<br>')}</div>
        <button>OK</button>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelector('button').onclick = () => backdrop.remove();
  }

  // error + link dialog
  function showErrorWithLink(count) {
    if (document.querySelector('.kintone-custom-dialog-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'kintone-custom-dialog-backdrop';
    backdrop.innerHTML = `
      <div class="kintone-custom-dialog">
        <div>口座番号が未設定のレコードが ${count} 件あります。<br>エクスポートを中止しました。</div>
        <a href="${ERROR_LINK}" target="_blank">未設定レコードを確認</a>
        <button>閉じる</button>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelector('button').onclick = () => backdrop.remove();
  }

  // record generators
  function generateHeaderRecord(billDateStr) {
    const d    = new Date(billDateStr);
    const mm   = padLeft(d.getMonth()+1, 2);
    const dd   = padLeft(d.getDate(), 2);
    const mmdd = `${mm}${dd}`;
    return [
      '1','91','0',
      padLeft('0000000000',10),  //use code provided by Mizuho Bank
      padRight('ﾔﾌﾞｼｷｶｲｼｬ',40), //use company name in katakana
      mmdd,
      padLeft('0001',4),//use bank code 0001 for Mizuho Bank
      padRight('ﾐｽﾞﾎ',15),//use bank name in katakana
      padLeft('125',3),//use branch code 125 for Ginza Chuo Branch
      padRight('ｷﾞﾝｻﾞﾁﾕｳｵｳ',15),//use branch name in katakana
      '2',
      padLeft('0000',7), // use bank account no
      ' '.repeat(17)
    ].join('');
  }
  function generateFooterRecord(recs) {
    const count = recs.length;
    const total = recs.reduce((s, r) => {
      const v = parseFloat(r.bill_amount?.value||'0');
      return s + (isNaN(v)?0:v);
    }, 0);
    return [
      '8',
      padLeft(count,6),
      padLeft(total,12),
      '000000','000000000000','000000','000000000000',
      ' '.repeat(65)
    ].join('');
  }
  function generateEndLine() {
    return '9' + ' '.repeat(119);
  }
  function getAccountTypeCode(label) {
    const map = { '普通':'1','普通預金':'1','当座':'2','納税準備預金':'3','納税準備':'3','その他':'9' };
    return map[label] || '9';
  }
  function formatRecord(r) {
    return [
      '2',
      padLeft(r.bank_code?.value,4),
      ' '.repeat(15),
      padLeft(r.branch_code?.value,3),
      ' '.repeat(19),
      getAccountTypeCode(r.account_type?.value),
      padLeft(r.account_no?.value,7),
      padRight(r.customer_name?.value,30),
      padLeft(r.bill_amount?.value,10),
      padLeft(r.SEQ?.value,21),
      '0',
      ' '.repeat(8)
    ].join('');
  }

  // fetchAllRecords auto-includes $id
  async function fetchAllRecords(appId, filter = '', fields = []) {
    showWaiting('データ取得中…');
    const out = [];
    let offset = 0, limit = 500;
    // ensure $id is in fields
    const flds = Array.from(new Set(['$id', ...fields]));
    while (true) {
      const res = await kintone.api(
        kintone.api.url('/k/v1/records', true),
        'GET',
        { app: appId, query: `${filter} limit ${limit} offset ${offset}`.trim(), fields: flds }
      );
      out.push(...res.records);
      offset += res.records.length;
      setProgress((offset % limit)/limit * 100, `取得中… ${offset} 件`);
      if (res.records.length < limit) break;
    }
    hideWaiting();
    return out;
  }

  // lock / unlock
  async function updateDataLock(recs) {
    showWaiting('レコードをロック中…');
    const total = recs.length, B = 100;
    for (let i=0; i<total; i+=B) {
      const slice = recs.slice(i, i+B).map(r => ({
        id: r.$id.value,
        record: { data_lock: { value: ['locked'] } }
      }));
      await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', { app: SOURCE_APP_ID, records: slice });
      setProgress((i+slice.length)/total*100, `ロック中… ${i+slice.length}/${total}`);
    }
    hideWaiting();
  }
  async function releaseDataLock(recs) {
    showWaiting('ロック解除中…');
    const total = recs.length, B = 100;
    for (let i=0; i<total; i+=B) {
      const slice = recs.slice(i, i+B).map(r => ({
        id: r.$id.value,
        record: { data_lock: { value: [] } }
      }));
      await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', { app: SOURCE_APP_ID, records: slice });
      setProgress((i+slice.length)/total*100, `解除中… ${i+slice.length}/${total}`);
    }
    hideWaiting();
  }

  // export to TXT
  async function exportToTxt(recs) {
    if (!recs.length) {
      alert('出力するデータがありません。');
      return;
    }
    const missing = recs.filter(r => !r.account_no?.value);
    if (missing.length) {
      showErrorWithLink(missing.length);
      return;
    }

    // header uses bill_date from first record
    const header = generateHeaderRecord(recs[0].bill_date.value);

    showWaiting('口振依頼ファイル作成中…');
    await updateDataLock(recs);

    const body   = recs.map(formatRecord);
    const footer = generateFooterRecord(recs);
    const end    = generateEndLine();

    // save summary to DESTINATION_APP_ID
    const totalBill = recs.reduce((s, r) => {
      const v = parseFloat(r.bill_amount?.value||'0');
      return s + (isNaN(v)?0:v);
    }, 0);
    await kintone.api(
      kintone.api.url('/k/v1/record', true),
      'POST',
      {
        app: DESTINATION_APP_ID,
        record: {
          header_text: { value: header },
          footer_text: { value: footer },
          end_line:    { value: end },
          total_bill:  { value: totalBill }
        }
      }
    );

    setProgress(100, '準備完了');

    // download file
    const content  = [header, ...body, footer, end, ''].join('\r\n');
    const filename = `FBexport_${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}.txt`;
    const blob     = new Blob([content], { type: 'text/plain' });
    const a        = document.createElement('a');
    a.href        = URL.createObjectURL(blob);
    a.download    = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);

    hideWaiting();
  }

  // bind buttons on index show
  kintone.events.on('app.record.index.show', async event => {
    if (kintone.app.getId() !== SOURCE_APP_ID || String(event.viewId) !== VIEW_ID) {
      return event;
    }

    const fields = [
      'bank_code','branch_code','account_no','customer_name',
      'account_type','bill_amount','SEQ','bill_date'
    ];

    // export button
    const btn = document.querySelector(BUTTON_SELECTOR);
    if (btn && !btn.dataset.exportAttached) {
      btn.dataset.exportAttached = 'true';
      btn.onclick = async () => {
        try {
          const recs = await fetchAllRecords(
            SOURCE_APP_ID,
            'data_lock not in ("locked")',
            fields
          );
          await exportToTxt(recs);
        } catch (e) {
          console.error(e);
          alert('出力処理に失敗しました。');
        }
      };
    }

    // release-lock button
    const rel = document.querySelector(RELEASE_SELECTOR);
    if (rel && !rel.dataset.releaseAttached) {
      rel.dataset.releaseAttached = 'true';
      rel.onclick = async () => {
        try {
          const recs = await fetchAllRecords(
            SOURCE_APP_ID,
            'data_lock in ("locked")',
            []  // no extra fields needed
          );
          await releaseDataLock(recs);
          alert(`🔓 ${recs.length}件のロックを解除しました。`);
        } catch (e) {
          console.error(e);
          alert('ロック解除処理に失敗しました。');
        }
      };
    }

    return event;
  });

})();
