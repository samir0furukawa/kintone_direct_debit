(function () {
  "use strict";

  const APP_725 = 725;
  const APP_726 = 726;
  const BATCH_SIZE = 100;
  const XLSX_URL = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";

  // Load XLSX library
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      if (window.XLSX) return resolve();
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function fetchAllRecords(appId) {
    let allRecords = [];
    let offset = 0;
    while (true) {
      const resp = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
        app: appId,
        query: `limit ${BATCH_SIZE} offset ${offset}`,
      });
      allRecords = allRecords.concat(resp.records);
      if (resp.records.length < BATCH_SIZE) break;
      offset += BATCH_SIZE;
    }
    return allRecords;
  }

  function convertToCSV(records) {
    if (records.length === 0) return "";
    const excludeFields = ["$id", "$revision", "レコード番号", "更新者", "作成者", "data_lock", "bank_name"];
    const fields = Object.keys(records[0]).filter((f) => !excludeFields.includes(f));
    // Wrap headers with quotes
    const header = fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(",");
    const rows = records.map((record) =>
      fields
        .map((f) => {
          let val = record[f]?.value ?? "";
          if (Array.isArray(val)) val = val.join(",");
          return `"${val.toString().replace(/"/g, '""')}"`; // Escape internal quotes by doubling
        })
        .join(",")
    );
    return [header].concat(rows).join("\r\n");
  }

  function convertToExcelBlob(records) {
    const excludeFields = ["$id", "$revision", "レコード番号", "更新者", "作成者", "data_lock", "bank_name"];
    const fields = Object.keys(records[0]).filter((f) => !excludeFields.includes(f));
    const data = [fields];
    records.forEach((record) => {
      const row = fields.map((f) => record[f]?.value || "");
      data.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([wbout], { type: "application/octet-stream" });
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showFormatDialog() {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.style.cssText =
        "position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:white;padding:20px;border:1px solid #ccc;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.3);border-radius:8px;text-align:center;";
      modal.innerHTML = `
        <h3 style="margin-top:0;">Export Format</h3>
        <label><input type="radio" name="format" value="xlsx" checked> Excel (.xlsx)</label><br>
        <label><input type="radio" name="format" value="csv"> CSV (.csv)</label><br><br>
        <button id="okBtn" style="margin-right:10px;">OK</button>
        <button id="cancelBtn">Cancel</button>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#okBtn").onclick = () => {
        const selected = modal.querySelector('input[name="format"]:checked').value;
        document.body.removeChild(modal);
        resolve(selected);
      };

      modal.querySelector("#cancelBtn").onclick = () => {
        document.body.removeChild(modal);
        resolve(null);
      };
    });
  }

  // Progress overlay
  function createProgressOverlay() {
    let overlay = document.getElementById("progressOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "progressOverlay";
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:11000;";
      overlay.innerHTML = `
        <div style="background:#fff;padding:20px 30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.3);text-align:center;min-width:250px;">
          <div id="progressText" style="font-size:16px;margin-bottom:8px;">Processing...</div>
          <div style="width:100%;height:16px;background:#eee;border-radius:8px;overflow:hidden;">
            <div id="progressBar" style="width:0%;height:100%;background:#4caf50;transition:width 0.3s;"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function updateProgress(percent) {
    const overlay = document.getElementById("progressOverlay");
    if (!overlay) return;
    const bar = document.getElementById("progressBar");
    const text = document.getElementById("progressText");
    if (bar) bar.style.width = percent + "%";
    if (text) text.textContent = `処理中... ${percent}%`;
  }

  function showProgress() {
    const overlay = createProgressOverlay();
    overlay.style.display = "flex";
    updateProgress(0);
  }

  function hideProgress() {
    const overlay = document.getElementById("progressOverlay");
    if (overlay) overlay.style.display = "none";
  }

  async function updateLocks(appId, records) {
    // Filter records that do not have data_lock locked checked
    const toUpdate = records.filter(
      (r) =>
        !r.data_lock?.value?.includes("locked")
    );
    if (toUpdate.length === 0) return;

    showProgress();

    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE).map((r) => ({
        id: r.$id.value,
        record: { data_lock: { value: ["locked"] } },
      }));
      try {
        await kintone.api(kintone.api.url("/k/v1/records", true), "PUT", {
          app: appId,
          records: batch,
        });
      } catch (e) {
        console.error("ロックに失敗しました。\nFailed to lock records:", e);
        alert("❌ Failed to update lock status. See console.");
        break;
      }
      updateProgress(Math.round(((i + BATCH_SIZE) / toUpdate.length) * 100));
    }
    hideProgress();
  }

  // Modified exportApp function to store and restore original button text
  async function exportApp(appId, buttonId) {
    const exportBtn = document.getElementById(buttonId);
    if (!exportBtn) return;

    // Store the original button text
    const originalText = exportBtn.textContent;

    exportBtn.disabled = true;
    exportBtn.textContent = "処理中...";

    try {
      await loadScript(XLSX_URL);

      const format = await showFormatDialog();
      if (!format) {
        // Restore original text if dialog is cancelled
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
        return;
      }

      const records = await fetchAllRecords(appId);
      if (records.length === 0) {
        alert("⚠️ No records found.");
        // Restore original text if no records are found
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
        return;
      }

      if (format === "xlsx") {
        const blob = convertToExcelBlob(records);
        triggerDownload(blob, `App${appId}_Export.xlsx`);
      } else {
        const csv = convertToCSV(records);
        // Add BOM for UTF-8 CSV to ensure correct character display in Excel
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        const blob = new Blob([bom, csv], { type: "text/csv;charset=utf-8;" });
        triggerDownload(blob, `App${appId}_Export.csv`);
      }

      await updateLocks(appId, records);

      alert("✅ 出力完了しました.");
    } catch (err) {
      console.error(err);
      alert("❌ Export failed. See console for details.");
    } finally {
      // Always restore the original text and enable the button
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
    }
  }

  async function releaseLocks(appId, buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    // Store original text for lock release buttons too
    const originalText = btn.textContent;

    if (!confirm(`すべてのロック解除します。よろしいでしょうか。\n Are you sure you want to release all locks in App ${appId}?`)) return;

    btn.disabled = true;
    showProgress();

    try {
      let offset = 0;
      let allIds = [];

      while (true) {
        const resp = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
          app: appId,
          fields: ["$id", "data_lock"],
          query: `data_lock in ("locked") limit ${BATCH_SIZE} offset ${offset}`,
        });
        if (resp.records.length === 0) break;

        allIds = allIds.concat(resp.records);
        if (resp.records.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
      }

      if (allIds.length === 0) {
        alert(`👍 ロック中のレコードありませんでした。\n No locked records found in App ${appId}.`);
        hideProgress();
        // Restore original text and re-enable
        btn.textContent = originalText;
        btn.disabled = false;
        return;
      }

      for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const batch = allIds.slice(i, i + BATCH_SIZE).map((r) => ({
          id: r.$id.value,
          record: { data_lock: { value: [] } },
        }));
        await kintone.api(kintone.api.url("/k/v1/records", true), "PUT", {
          app: appId,
          records: batch,
        });
        updateProgress(Math.round(((i + BATCH_SIZE) / allIds.length) * 100));
      }

      alert(`✅ ロック解除完了。\n Released locks on ${allIds.length} records in App ${appId}.`);
    } catch (e) {
      console.error(e);
      alert("❌ Failed to release locks. See console.");
    } finally {
      // Always restore the original text and enable the button
      hideProgress();
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  kintone.events.on("app.record.index.show", () => {
    // Attach event handlers for export buttons
    const btnExport1 = document.getElementById("btn_export");
    if (btnExport1 && !btnExport1.dataset.ready) {
      btnExport1.dataset.ready = "1";
      // No need to pass "export1" or "export2" anymore
      btnExport1.addEventListener("click", () => exportApp(APP_725, "btn_export"));
    }

    const btnExport2 = document.getElementById("btn_export_failed");
    if (btnExport2 && !btnExport2.dataset.ready) {
      btnExport2.dataset.ready = "1";
      btnExport2.addEventListener("click", () => exportApp(APP_726, "btn_export_failed"));
    }

    // Attach event handlers for lock release buttons
    const btnLockRelease2 = document.getElementById("btn_lockrelease2");
    if (btnLockRelease2 && !btnLockRelease2.dataset.ready) {
      btnLockRelease2.dataset.ready = "1";
      btnLockRelease2.addEventListener("click", () => releaseLocks(APP_725, "btn_lockrelease2"));
    }

    const btnLockRelease3 = document.getElementById("btn_lockrelease3");
    if (btnLockRelease3 && !btnLockRelease3.dataset.ready) {
      btnLockRelease3.dataset.ready = "1";
      btnLockRelease3.addEventListener("click", () => releaseLocks(APP_726, "btn_lockrelease3"));
    }
  });
})();