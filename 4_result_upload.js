// Desktop JavaScript customization for App 722
(function () {
  'use strict';

  const TARGET_APP_ID = 724;
  const CHUNK_SIZE    = 100;
  const LINE_LENGTH   = 120; // pad every line to 120 chars

  kintone.events.on('app.record.index.show', () => {
    // Inject full-screen progress overlay once
    if (!document.getElementById('fullScreenProgress')) {
      const style = document.createElement('style');
      style.textContent = `
        #fullScreenProgress { position:fixed; inset:0; background:rgba(0,0,0,0.5);
          display:flex; align-items:center; justify-content:center; z-index:9999; }
        #progressBox { background:#fff; padding:24px 32px; border-radius:10px;
          text-align:center; width:360px; box-shadow:0 4px 12px rgba(0,0,0,0.3); }
        #progressBar { width:100%; background:#eee; border-radius:8px;
          overflow:hidden; margin-top:12px; height:24px; }
        #progressFill { height:100%; width:0; background:#4caf50; color:#fff;
          font-weight:bold; text-align:center; line-height:24px;
          transition:width 0.3s ease; }`;
      document.head.appendChild(style);

      const overlay = document.createElement('div');
      overlay.id = 'fullScreenProgress';
      overlay.style.display = 'none';
      overlay.innerHTML = `
        <div id="progressBox">
          <div>⏳ 情報更新中...</div>
          <div id="progressBar"><div id="progressFill">0%</div></div>
        </div>`;
      document.body.appendChild(overlay);
    }

    const importBtn    = document.getElementById('importBankDataBtn');
    const fileInput    = document.getElementById('dataFile');
    const overlay      = document.getElementById('fullScreenProgress');
    const progressFill = document.getElementById('progressFill');
    if (!importBtn || !fileInput || !overlay || !progressFill) return;

    importBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return alert('テキストファイル選択してください。\nPlease select a .txt file.');

      overlay.style.display    = 'flex';
      progressFill.style.width = '0%';
      progressFill.textContent = '0%';

      try {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        await new Promise((resolve, reject) => {
            reader.onload = resolve;
            reader.onerror = reject;
        });

        const arrayBuffer = reader.result;
        const uint8Array = new Uint8Array(arrayBuffer);

        const detectedEncoding = Encoding.detect(uint8Array);
        console.log("Detected encoding:", detectedEncoding);

        const unicodeArray = Encoding.convert(uint8Array, {
            to: 'UNICODE',
            from: 'SJIS'
        });
        const text = Encoding.codeToString(unicodeArray);

        const lines = text.split(/\r?\n/).map(l => l.trim());
        // --- MODIFIED LINE HERE ---
        const rows  = lines.slice(1, -3); // skip header + last 3 rows
        // --------------------------

        const records = rows.map(raw => {
          const line = raw.padEnd(LINE_LENGTH, ' ');

          const bank_code      = line.slice(1,   5).trim();
          const bank_name      = line.slice(5,  20).trim();
          const branch_code    = line.slice(20, 23).trim();
          const branch_name    = line.slice(23, 42).trim();
          const account_type   = line.slice(42, 43).trim();
          const account_no     = line.slice(43, 50).trim();
          const customer_name  = line.slice(50, 80).trim();
          const bill_raw       = line.slice(80, 90);
          const bill_amount    = parseInt(bill_raw.replace(/^0+/, ''), 10) || 0;

          const seq            = parseInt(line.slice(91, 111).trim().replace(/^0+/, ''), 10) || 0;
          const result         = line.slice(111, 112).trim();
          const rec = {
            bank_code:      { value: bank_code      },
            bank_name:      { value: bank_name      },
            branch_code:    { value: branch_code    },
            branch_name:    { value: branch_name    },
            account_type:   { value: account_type   },
            account_no:     { value: account_no     },
            customer_name:  { value: customer_name  },
            bill_amount:    { value: bill_amount    }, // Number field
            result:         { value: result         },
            seq:            { value: seq            }  // Number field
          };

          const allBlank = Object.values(rec)
            .every(f => f.value === '' || f.value === 0);
          return allBlank ? null : rec;
        }).filter(Boolean);

        console.log(`Parsed ${records.length} records`);

        await deleteAllRecords(TARGET_APP_ID);

        const total = records.length;
        for (let i = 0; i < total; i += CHUNK_SIZE) {
          const chunk = records.slice(i, i + CHUNK_SIZE);
          try {
            await kintone.api(
              kintone.api.url('/k/v1/records', true),
              'POST',
              { app: TARGET_APP_ID, records: chunk }
            );
          } catch (err) {
            overlay.style.display = 'none';
            console.error('Chunk upload failed:', err);
            console.log('Sample:', chunk[0]);
            alert('Some records failed. Check console.');
            return;
          }
          const pct = Math.min(100, Math.round(((i + CHUNK_SIZE) / total) * 100));
          progressFill.style.width   = pct + '%';
          progressFill.textContent   = pct + '%';
        }

        progressFill.textContent = '✅ Done';
        setTimeout(() => overlay.style.display = 'none', 800);
        alert(`結果取込成功しました。\n Imported ${records.length} records successfully!`);
      }
      catch (err) {
        overlay.style.display = 'none';
        console.error('Unexpected error:', err);
        alert('Something went wrong. Check console.');
      }
    });

    async function deleteAllRecords(appId) {
      while (true) {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/records', true),
          'GET',
          { app: appId, fields: ['$id'], query: 'order by $id asc limit 500' }
        );
        const ids = resp.records.map(r => r.$id.value);
        if (!ids.length) break;
        for (let j = 0; j < ids.length; j += 100) {
          await kintone.api(
            kintone.api.url('/k/v1/records', true),
            'DELETE',
            { app: appId, ids: ids.slice(j, j + 100) }
          );
        }
      }
    }
  });
})();
//lock release

(function() {
  'use strict';

  const TARGET_APP_ID = 724;
  const FETCH_SIZE    = 500;
  const BATCH_SIZE    = 100;

  // 1) Inject CSS for modals + progress overlay
  const style = document.createElement('style');
  style.textContent = `
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
  }
  .modal-box {
    background: #fff;
    padding: 20px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 320px; width: 90%;
    text-align: center; font-family: Arial, sans-serif;
  }
  .modal-buttons {
    margin-top: 16px;
    display: flex; justify-content: center; gap: 12px;
  }
  .modal-buttons button {
    padding: 6px 12px; border: none; border-radius: 4px;
    cursor: pointer;
  }
  .modal-ok { background: #4caf50; color: #fff; }
  .modal-cancel { background: #ccc; }

  #progressOverlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    display: none; align-items: center; justify-content: center;
    z-index: 9998;
  }
  #progressContainer {
    background: #fff; padding: 24px;
    border-radius: 8px; text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    width: 280px;
  }
  #progressBarBackground {
    width: 100%; height: 16px; background: #eee;
    border-radius: 8px; overflow: hidden; margin-top: 12px;
  }
  #progressBarFill {
    height: 100%; width: 0%; background: #4caf50;
    transition: width 0.2s ease;
  }
  #progressPercent {
    margin-top: 8px; font-weight: bold;
  }`;
  document.head.appendChild(style);

  // 2) Modal helpers
  function showConfirm(message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <div>${message}</div>
          <div class="modal-buttons">
            <button class="modal-ok">Yes</button>
            <button class="modal-cancel">No</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.modal-ok').onclick = () => {
        overlay.remove(); resolve(true);
      };
      overlay.querySelector('.modal-cancel').onclick = () => {
        overlay.remove(); resolve(false);
      };
    });
  }
  function showAlert(message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <div>${message}</div>
          <div class="modal-buttons">
            <button class="modal-ok">OK</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.modal-ok').onclick = () => {
        overlay.remove(); resolve();
      };
    });
  }

  // 3) Progress overlay
  const progOL = document.createElement('div');
  progOL.id = 'progressOverlay';
  progOL.innerHTML = `
    <div id="progressContainer">
      <div>⏳ Releasing locks...</div>
      <div id="progressBarBackground">
        <div id="progressBarFill"></div>
      </div>
      <div id="progressPercent">0%</div>
    </div>`;
  document.body.appendChild(progOL);

  function showProgress() {
    progOL.style.display = 'flex';
    updateProgress(0);
  }
  function updateProgress(pct) {
    const fill = document.getElementById('progressBarFill');
    const txt  = document.getElementById('progressPercent');
    fill.style.width = pct + '%';
    txt.textContent  = pct + '%';
  }
  function hideProgress() {
    progOL.style.display = 'none';
  }

  // 4) Delegate click on your view button
  document.body.addEventListener('click', e => {
    if (e.target.matches('.btn.lockrelease1')) {
      e.preventDefault();
      releaseLocksIn724();
    }
  });

  // 5) Main logic
  async function releaseLocksIn724() {
    const ok = await showConfirm(
      'Really release locks on ALL records in App 724?'
    );
    if (!ok) return;

    try {
      // fetch all locked IDs
      let offset = 0, ids = [];
      while (true) {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/records', true), 'GET',
          {
            app: TARGET_APP_ID,
            fields: ['$id'],
            query: `data_lock in ("locked") order by $id asc ` +
                   `limit ${FETCH_SIZE} offset ${offset}`
          }
        );
        if (resp.records.length === 0) break;
        ids.push(...resp.records.map(r => r.$id.value));
        offset += FETCH_SIZE;
      }

      if (ids.length === 0) {
        return showAlert('👍 ロック中のレコード見つかりませんでした。\n No locked records found in App 724.');
      }

      // clear in batches with progress
      showProgress();
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const chunk = ids.slice(i, i + BATCH_SIZE).map(id => ({
          id,
          record: { data_lock: { value: [] } }
        }));
        await kintone.api(
          kintone.api.url('/k/v1/records', true), 'PUT',
          { app: TARGET_APP_ID, records: chunk }
        );
        updateProgress(Math.round(((i + BATCH_SIZE) / ids.length) * 100));
      }
      hideProgress();
      await showAlert(
        `✅ Released locks on ${ids.length} record(s) in App 724.`
      );
      location.reload();
    }
    catch (err) {
      hideProgress();
      console.error('Release Locks Error:', err);
      await showAlert('❌ Failed to release locks. Check console.');
    }
  }
})();

