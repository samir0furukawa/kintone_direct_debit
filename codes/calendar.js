/*(async function () {
  'use strict';

  const VIEW_ID = 15929930;

  // fetch Japanese holidays
  async function getJapaneseHolidays() {
    const res = await fetch("https://holidays-jp.github.io/api/v1/date.json");
    if (!res.ok) return [];
    const data = await res.json();
    return Object.keys(data);
  }

  kintone.events.on('app.record.index.show', async function (event) {
    if (event.viewId !== VIEW_ID) return event;

    const input = document.getElementById('datepicker');
    if (!input || input.classList.contains('flatpickr-input')) return event;

    // single action button
    const btn = document.createElement('button');
    btn.textContent = '📅 Select a date';
    btn.style.marginLeft = '10px';
    btn.style.padding = '6px 10px';
    btn.style.cursor = 'pointer';
    input.parentNode.insertBefore(btn, input.nextSibling);

    const holidays = await getJapaneseHolidays();

    // initialize Flatpickr and capture the instance
    const fp = flatpickr(input, {
      locale: flatpickr.l10ns.ja,
      dateFormat: 'Y-m-d',
      disable: [
        ...holidays,
        d => [0, 6].includes(d.getDay())
      ],
      clickOpens: false,  // disable auto-open
      onChange: function (selectedDates) {
        if (selectedDates.length) {
          btn.textContent = '✅ 確定';
          btn.disabled = false;
        }
      }
    });

    // button click handler calls the instance.open()
    btn.addEventListener('click', () => {
      if (btn.textContent === '📅 日付選択') {
        fp.open();
      }
      else if (btn.textContent === '✅ 確定') {
        input.readOnly = true;
        fp.set('clickOpens', false);
        btn.textContent = '🔄 再設定';
      }
      else if (btn.textContent === '🔄 再設定') {
        fp.clear();
        input.readOnly = false;
        fp.set('clickOpens', false);
        btn.textContent = '📅 日付選択';
        btn.disabled = false;
      }
    });

    return event;
  });
})();*/

(async function () {
  'use strict';

  const VIEW_ID = 15929930;

  // Static list of Japanese holidays in 2025
  async function getJapaneseHolidays() {
    return [
      "2025-01-01", // 元日
     /* "2025-01-13", // 成人の日
      "2025-02-11", // 建国記念の日
      "2025-02-23", // 天皇誕生日
      "2025-03-20", // 春分の日
      "2025-04-29", // 昭和の日
      "2025-05-03", // 憲法記念日
      "2025-05-04", // みどりの日
      "2025-05-05", // こどもの日
      "2025-07-21", // 海の日
      "2025-08-11", // 山の日
      "2025-09-15", // 敬老の日
      "2025-09-23", // 秋分の日
      "2025-10-13", // スポーツの日
      "2025-11-03", // 文化の日
      "2025-11-23"  // 勤労感謝の日*/
    ];
  }

  kintone.events.on('app.record.index.show', async function (event) {
    if (event.viewId !== VIEW_ID) return event;

    const input = document.getElementById('datepicker');
    if (!input || input.classList.contains('flatpickr-input')) return event;

    // Create action button
    const btn = document.createElement('button');
    btn.textContent = '📅 日付選択';
    btn.style.marginLeft = '10px';
    btn.style.padding = '6px 10px';
    btn.style.cursor = 'pointer';
    input.parentNode.insertBefore(btn, input.nextSibling);

    const holidays = await getJapaneseHolidays();

    // Initialize Flatpickr
    const fp = flatpickr(input, {
      locale: flatpickr.l10ns.ja,
      dateFormat: 'Y-m-d',
      disable: [
        ...holidays,
        function (date) {
          return date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
        }
      ],
      clickOpens: false,
      onChange: function (selectedDates) {
        if (selectedDates.length) {
          btn.textContent = '✅ 確定';
          btn.disabled = false;
        }
      }
    });

    // Handle button state changes
    btn.addEventListener('click', () => {
      if (btn.textContent === '📅 日付選択') {
        fp.open();
      } else if (btn.textContent === '✅ 確定') {
        input.readOnly = true;
        fp.set('clickOpens', false);
        btn.textContent = '🔄 再設定';
      } else if (btn.textContent === '🔄 再設定') {
        fp.clear();
        input.readOnly = false;
        fp.set('clickOpens', false);
        btn.textContent = '📅 日付選択';
        btn.disabled = false;
      }
    });

    return event;
  });
})();

