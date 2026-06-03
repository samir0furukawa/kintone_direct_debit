// src/js/lib/formatter.js

class DataFormatter {
  static flattenRecord(rec) {
    const out = {};
    for (const k in rec) {
      let v = rec[k]?.value !== undefined ? rec[k].value : rec[k];

      if (Array.isArray(v)) {
        v = v.length && v[0]?.value && typeof v[0].value === 'object'
          ? v.map(r => JSON.stringify(
              Object.fromEntries(
                Object.entries(r.value).map(([c, o]) => [c, o.value])
              )
            )).join(' | ')
          : v.map(i => (i?.value !== undefined ? i.value : i)).join(', ');
      } else if (v && typeof v === 'object') {
        v = v.name ?? v.code ?? v.text ?? JSON.stringify(v);
      }

      out[k] = v;
    }
    return out;
  }

  static filterColumns(records, excludeFields) {
    if (!records.length) return [];
    const fields = Object.keys(records[0]).filter(f => !excludeFields.includes(f));
    return records.map(r =>
      fields.reduce((o, h) => ((o[h] = r[h]), o), {})
    );
  }

  static padLeft(v, len, ch = '0') {
    return String(v).padStart(len, ch);
  }

  static padRight(v, len, ch = ' ') {
    return String(v).padEnd(len, ch);
  }

  static toFixedLength(value, length) {
    return this.padRight(String(value).substring(0, length), length);
  }

  static toKatakana(str) {
    return str.replace(/[ぁ-ん]/g, match => String.fromCharCode(match.charCodeAt(0) + 0x60));
  }
}

export { DataFormatter };