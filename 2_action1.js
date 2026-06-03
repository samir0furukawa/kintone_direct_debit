(function () {
  'use strict';

  /*-------------------------------------------------------
    inject dialog + progress styles
  -------------------------------------------------------*/
  const style = document.createElement('style');
  style.textContent = `
    /* Confirmation dialog */
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
      margin: 0 .5em; padding: .5em 1.2em;
      background: #2684FF; border: none; border-radius: 4px;
      color: #fff; cursor: pointer;
    }
    .kintone-custom-dialog button.cancel {
      background: #999;
    }

    /* Progress overlay */
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
      height: 100%; background: #2684FF; width: 0%;
      transition: width .2s ease;
    }
    .kintone-custom-wait .progress-text {
      margin-top: .5em; font-size: .9em; color: #333;
    }
  `;
  document.head.appendChild(style);

  /*-------------------------------------------------------
    Confirm dialog
  -------------------------------------------------------*/
  function showConfirmDialog(message) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'kintone-custom-dialog-backdrop';
      const dlg = document.createElement('div');
      dlg.className = 'kintone-custom-dialog';
      dlg.innerHTML = `
        <div>${message.replace(/\n/g, '<br>')}</div>
        <div style="margin-top:1em;">
          <button class="ok">OK</button>
          <button class="cancel">Cancel</button>
        </div>`;
      backdrop.appendChild(dlg);
      document.body.appendChild(backdrop);
      dlg.querySelector('button.ok').onclick     = () => { backdrop.remove(); resolve(true);  };
      dlg.querySelector('button.cancel').onclick = () => { backdrop.remove(); resolve(false); };
    });
  }

  /*-------------------------------------------------------
    Progress overlay
  -------------------------------------------------------*/
  function showProgress() {
    if (document.getElementById('kintone-custom-progress')) return;
    const w = document.createElement('div');
    w.id = 'kintone-custom-progress';
    w.className = 'kintone-custom-wait';
    w.innerHTML = `
      <div class="wait-label">処理中…</div>
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

  /*-------------------------------------------------------
    Fetch all records in batches
  -------------------------------------------------------*/
  async function fetchAll(app, fields, batchSize = 500) {
    let offset = 0, all = [];
    while (true) {
      const res = await kintone.api(
        kintone.api.url('/k/v1/records', true),
        'GET',
        { app, fields, query: `limit ${batchSize} offset ${offset}` }
      );
      all.push(...res.records);
      if (res.records.length < batchSize) break;
      offset += batchSize;
    }
    return all;
  }

  /*-------------------------------------------------------
    Main workflow
  -------------------------------------------------------*/
  async function runFbDataWorkflow(button) {
    // 0) read date
    const selectedDate = document.getElementById('datepicker')?.value;
    if (!selectedDate) {
      alert('⚠️ 請求日を未選択です。\n 日付選択から日程選択してください。');
      return;
    }

    // define app IDs
    const APP_722 = 722, APP_721 = 721, APP_720 = 720, APP_719 = 719;
    const BATCH   = 100;

    // 1) check for locked records in App 722
    const lockCheck = await kintone.api(
      kintone.api.url('/k/v1/records', true),
      'GET',
      { app: APP_722, query: 'data_lock in ("locked") limit 1', totalCount: true }
    );
    if ((lockCheck.totalCount || 0) > 0) {
      alert(
        `❌ 処理を中止しました。\n` +
        `口振依頼データ（中間）にロック中のレコードが ${lockCheck.totalCount} 件あります。\n` +
        `すべてロックを解除してください。`
      );
      return;
    }

    // 2) confirm deletion & creation
    const ok = await showConfirmDialog(
      '口振依頼データ（中間）の既存レコードを全削除し、\n' +
      '新しい中間データを作成します。\n' +
      '実行してよろしいですか？'
    );
    if (!ok) return;

    // disable UI + show progress
    button.disabled  = true;
    const origText    = button.innerText;
    button.innerText = '削除と作成中…';
    showProgress();

    try {
      // 3) count existing records
      const cnt = await kintone.api(
        kintone.api.url('/k/v1/records', true),
        'GET',
        { app: APP_722, query: 'limit 1', totalCount: true }
      );
      const totalToDel = cnt.totalCount || 0;

      // 4) delete in batches (0–50%)
      let deleted = 0;
      while (true) {
        const recs = await kintone.api(
          kintone.api.url('/k/v1/records', true),
          'GET',
          { app: APP_722, fields: ['$id'], query: `limit ${BATCH}` }
        );
        const ids = recs.records.map(r => r.$id.value);
        if (!ids.length) break;
        await kintone.api(
          kintone.api.url('/k/v1/records', true),
          'DELETE',
          { app: APP_722, ids }
        );
        deleted += ids.length;
        updateProgress(Math.floor(deleted / totalToDel * 50));
      }

      // 5) map company_code → LVcode (App 721)
      const codeToLV = {};
      const rec721   = await fetchAll(APP_721, ['company_code','LVcode']);
      rec721.forEach(r => {
        const c = r.company_code.value?.trim();
        const l = r.LVcode.value?.trim();
        if (c && l) codeToLV[c] = l;
      });

      // 6) fetch billing (App 720) & merge
      const billing = await fetchAll(APP_720, [
        'company_code','bank_code','bill_date','bill_amount','SEQ'
      ]);
      const merged = billing.reduce((acc, r) => {
        const c  = r.company_code.value?.trim();
        const lv = codeToLV[c];
        if (lv) acc.push({
          LVcode: lv,
          bill_amount: Number(r.bill_amount.value.replace(/,/g,'')),
          SEQ: r.SEQ.value,
          bank_code: r.bank_code.value
        });
        return acc;
      }, []);
      if (!merged.length) {
        alert('有効な請求データがありません。');
        return;
      }

      // 7) fetch account info (App 719)
      const lvToAcc = {};
      const lvList  = Array.from(new Set(merged.map(x => x.LVcode)));
      for (let i = 0; i < lvList.length; i += 500) {
        const clause = lvList
          .slice(i, i + 500)
          .map(lv => `LVcode="${lv}"`).join(' or ');
        const res = await kintone.api(
          kintone.api.url('/k/v1/records', true),
          'GET',
          {
            app: APP_719,
            fields: [
              'LVcode','account_prio','bank_code',
              'branch_code','account_no','customer_name','account_type'
            ],
            query: `${clause} limit 500`
          }
        );
        res.records.forEach(r => {
          if (r.account_prio.value === '代表口座') {
            lvToAcc[r.LVcode.value] = {
              bank_code: r.bank_code.value,
              branch_code: r.branch_code.value,
              account_no: r.account_no.value,
              customer_name: r.customer_name.value,
              account_type: r.account_type.value
            };
          }
        });
      }

      // 8) prepare new records
      const newRecs = merged.map(b => {
        const a = lvToAcc[b.LVcode] || {};
        return {
          bank_code:     { value: a.bank_code || '' },
          branch_code:   { value: a.branch_code || '' },
          account_no:    { value: a.account_no || '' },
          customer_name: { value: a.customer_name || '' },
          account_type:  { value: a.account_type || '' },
          bill_amount:   { value: b.bill_amount },
          SEQ:           { value: b.SEQ },
          bill_date:     { value: selectedDate }
        };
      });

      // 9) post in batches (50–100%)
      for (let i = 0; i < newRecs.length; i += BATCH) {
        const slice = newRecs.slice(i, i + BATCH);
        await kintone.api(
          kintone.api.url('/k/v1/records', true),
          'POST',
          { app: APP_722, records: slice }
        );
        updateProgress(50 + Math.floor((i + slice.length) / newRecs.length * 50));
      }

      updateProgress(100);
      alert(`口振データ作成完了: ${newRecs.length} 件`);
    }
    catch (err) {
      console.error('⚠️ 処理中にエラーが発生しました:', err);
      alert('処理中にエラーが発生しました。詳細はコンソールをご確認ください。');
    }
    finally {
      hideProgress();
      button.disabled  = false;
      button.innerText = origText;
    }
  }

  /*-------------------------------------------------------
    bind to index view
  -------------------------------------------------------*/
  kintone.events.on('app.record.index.show', event => {
    if (kintone.app.getId() !== 722 || String(event.viewId) !== '15929930') {
      return event;
    }
    const btn = document.querySelector('button.btn.create');
    if (btn && !btn.dataset.fbBound) {
      btn.dataset.fbBound = '1';
      btn.addEventListener('click', () => runFbDataWorkflow(btn));
    }
    return event;
  });

})();
