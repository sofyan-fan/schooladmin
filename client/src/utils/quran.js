export function serializePoint(point) {
  // Encode both surah/ayah and hizb if available for full fidelity
  if (point.surahId && point.ayah) {
    const base = `${point.surahId}:${point.ayah}`;
    return point.hizb ? `${base}|hizb:${point.hizb}` : base;
  }
  if (point.hizb) return `hizb:${point.hizb}`;
  return '';
}

export function parsePoint(raw) {
  if (!raw) return { surahId: '', ayah: '', hizb: '' };
  // Support new combined encoding: "s:a|hizb:H" as well as legacy formats
  const [main, extra] = String(raw).split('|');
  let surahId = '', ayah = '', hizb = '';

  if (main.startsWith('hizb:')) {
    hizb = main.split(':')[1] || '';
  } else {
    const parts = main.split(':');
    if (parts.length === 2) {
      surahId = parts[0] || '';
      ayah = parts[1] || '';
    }
  }

  if (extra && extra.startsWith('hizb:')) {
    hizb = extra.split(':')[1] || hizb;
  }

  return { surahId, ayah, hizb };
}
