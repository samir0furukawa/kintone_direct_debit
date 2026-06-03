(function () {
  "use strict";

  const APP_724 = 724;     // billing + banking
  const APP_720 = 720;     // SEQ → company_code
  const APP_721 = 721;     // company_code → LVcode + company_name
  const APP_725 = 725;     // all records
  const APP_726 = 726;     // only result == "0"
  const BATCH_SIZE = 100;
  const TARGET_VIEW_ID = 15929930;

  // --- Progress Overlay Setup ---
  const progressOverlay = document.createElement("div");
  progressOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  const progressBox = document.createElement("div");
  progressBox.style.cssText = `
    background: #fff;
    padding: 20px 30px;
    border-radius: 8px;
    text-align: center;
    min-width: 280px;
    max-width: 560px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  `;

  const progressText = document.createElement("div");
  progressText.style.cssText = `
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: bold;
  `;
  progressText.textContent = "Uploading...";

  const progressBarContainer = document.createElement("div");
  progressBarContainer.style.cssText = `
    width: 100%;
    height: 20px;
    background: #eee;
    border-radius: 10px;
    overflow: hidden;
  `;

  const progressBar = document.createElement("div");
  progressBar.style.cssText = `
    height: 100%;
    width: 0%;
    background: #4caf50;
    transition: width 0.3s ease;
  `;

  progressBarContainer.appendChild(progressBar);
  progressBox.appendChild(progressText);
  progressBox.appendChild(progressBarContainer);
  progressOverlay.appendChild(progressBox);
  document.body.appendChild(progressOverlay);

  function showProgress(text) {
    progressText.textContent = text || "Processing...";
    progressBar.style.width = "0%";
    progressOverlay.style.display = "flex";
  }

  function updateProgress(percent) {
    progressBar.style.width = percent + "%";
    progressText.textContent = `Progress: ${percent}%`;
  }

  function hideProgress() {
    progressOverlay.style.display = "none";
  }

  // --- Custom Confirm Modal (centered) ---
  function customConfirm(message, { okText = "OK", cancelText = "キャンセル" } = {}) {
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
      `;

      const box = document.createElement("div");
      box.style.cssText = `
        background: #fff;
        border-radius: 10px;
        padding: 20px 24px;
        width: min(520px, 92vw);
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      `;

      const msg = document.createElement("div");
      msg.style.cssText = `
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 18px;
        white-space: pre-wrap;
      `;
      msg.textContent = message;

      const actions = document.createElement("div");
      actions.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      `;

      const okBtn = document.createElement("button");
      okBtn.textContent = okText;
      okBtn.style.cssText = `
        background: #1976d2; color: #fff; border: 0;
        padding: 8px 14px; border-radius: 6px; cursor: pointer;
      `;

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = cancelText;
      cancelBtn.style.cssText = `
        background: #e0e0e0; color: #333; border: 0;
        padding: 8px 14px; border-radius: 6px; cursor: pointer;
      `;

      actions.appendChild(cancelBtn);
      actions.appendChild(okBtn);
      box.appendChild(msg);
      box.appendChild(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      const cleanup = (val) => {
        document.body.removeChild(overlay);
        resolve(val);
      };

      okBtn.addEventListener("click", () => cleanup(true));
      cancelBtn.addEventListener("click", () => cleanup(false));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(false);
      });
      // Close on ESC
      const onKey = (e) => {
        if (e.key === "Escape") {
          window.removeEventListener("keydown", onKey);
          cleanup(false);
        }
      };
      window.addEventListener("keydown", onKey);
    });
  }

  // --- Data utilities ---
  async function fetchAll(appId, fields = []) {
    let allRecords = [], offset = 0;
    const LIMIT = 500;
    while (true) {
      const resp = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        { app: appId, fields, query: `limit ${LIMIT} offset ${offset}` }
      );
      allRecords = allRecords.concat(resp.records);
      if (resp.records.length < LIMIT) break;
      offset += LIMIT;
    }
    return allRecords;
  }

  function buildMap(records, keyField, valueFields) {
    const map = {};
    for (const r of records) {
      const key = r[keyField]?.value;
      if (!key || map[key]) continue;
      const obj = {};
      valueFields.forEach(f => (obj[f] = r[f]?.value ?? ""));
      map[key] = obj;
    }
    return map;
  }

  async function deleteAll(appId) {
    const all = await fetchAll(appId, ["$id"]);
    const ids = all.map(r => r.$id.value);
    const total = ids.length;
    let deletedCount = 0;
    while (ids.length) {
      const batch = ids.splice(0, BATCH_SIZE);
      await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "DELETE",
        { app: appId, ids: batch }
      );
      deletedCount += batch.length;
      updateProgress(Math.round((deletedCount / Math.max(total, 1)) * 100));
    }
    console.log(`🗑 Deleted ${total} records from App ${appId}`);
  }

  async function runBulkUpload() {
    console.clear();
    const billDate = document.getElementById("datepicker")?.value;
    if (!billDate) {
      alert("⚠️ 口座引落日を選択してください（入金引当日）");
      return;
    }

    showProgress("Fetching source data...");
    const records724 = await fetchAll(APP_724);
    const records720 = await fetchAll(APP_720, ["SEQ", "company_code"]);
    const records721 = await fetchAll(APP_721, ["company_code", "LVcode", "company_name"]);

    const companyCodeMap = buildMap(records720, "SEQ", ["company_code"]);
    const companyInfoMap = buildMap(records721, "company_code", ["LVcode", "company_name"]);

    showProgress("Clearing App 725...");
    await deleteAll(APP_725);

    showProgress("Clearing App 726...");
    await deleteAll(APP_726);

    const to725 = [];
    const to726 = [];

    for (const r of records724) {
      // NOTE: ensure this matches your field code exactly ("seq" vs "SEQ")
      const seq = r.seq?.value ?? r.SEQ?.value;
      if (!seq) continue;

      const company_code = companyCodeMap[seq]?.company_code ?? "";
      const LVcode       = companyInfoMap[company_code]?.LVcode ?? "";
      const company_name = companyInfoMap[company_code]?.company_name ?? "";
      const result       = r.result?.value ?? "";

      const rec = {
        // Use the same field code name in target apps as you intend (seq or SEQ)
        seq:           { value: String(seq) },
        bill_date:     { value: billDate },
        bank_code:     { value: r.bank_code?.value ?? "" },
        bank_name:     { value: r.bank_name?.value ?? "" },
        customer_name: { value: r.customer_name?.value ?? "" },
        account_no:    { value: r.account_no?.value ?? "" },
        bill_amount:   { value: String(Number(r.bill_amount?.value ?? 0)) },
        company_code:  { value: company_code },
        company_name:  { value: company_name },
        LVcode:        { value: LVcode },
        result:        { value: String(result) }
      };

      // App 725: all records
      to725.push(rec);

      // App 726: only result === "0"
      if (String(result).trim() === "0") {
        to726.push(rec);
      }
    }

    const total = to725.length + to726.length;
    let uploaded = 0;

    showProgress("Uploading to App 725 (all records)...");
    for (let i = 0; i < to725.length; i += BATCH_SIZE) {
      const batch = to725.slice(i, i + BATCH_SIZE);
      await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "POST",
        { app: APP_725, records: batch }
      );
      uploaded += batch.length;
      updateProgress(Math.round((uploaded / Math.max(total, 1)) * 100));
    }

    showProgress("Uploading to App 726 (result == '0')...");
    for (let i = 0; i < to726.length; i += BATCH_SIZE) {
      const batch = to726.slice(i, i + BATCH_SIZE);
      await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "POST",
        { app: APP_726, records: batch }
      );
      uploaded += batch.length;
      updateProgress(Math.round((uploaded / Math.max(total, 1)) * 100));
    }

    hideProgress();
  }

  // Attach button on the target view
  kintone.events.on("app.record.index.show", async (event) => {
    if (event.viewId !== TARGET_VIEW_ID) return;
    const btn = document.getElementById("upload725726");
    if (!btn) return;

    btn.onclick = async () => {
      const proceed = await customConfirm("⚠️ この操作は指定した請求日のデータを再作成します。続行しますか？");
      if (!proceed) return;

      btn.disabled = true;
      try {
        await runBulkUpload();
        alert("✅ Upload completed to App 725 and App 726.");
      } catch (e) {
        console.error(e);
        alert("❌ Upload failed. See console for details.");
      }
      btn.disabled = false;
    };
  });

  // Prevent manual delete when data_lock = locked
  kintone.events.on("app.record.index.delete.submit", async (event) => {
    const appId = kintone.app.getId();
    try {
      const resp = await kintone.api(
        kintone.api.url("/k/v1/record", true),
        "GET",
        { app: appId, id: event.recordId }
      );
      const locked = resp.record.data_lock?.value || [];
      if (locked.includes("locked")) {
        event.error = "❌ This record is locked and cannot be deleted.";
        return event;
      }
    } catch (e) {
      console.error("Error checking lock status:", e);
      event.error = "❌ Failed to validate record lock status.";
      return event;
    }
    return event;
  });

})();